const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_your_stripe_secret_key_here');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', description, parkingSpotId, ownerId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      description: description,
      metadata: {
        parkingSpotId: parkingSpotId,
        ownerId: ownerId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook to handle successful payments
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_your_webhook_secret_here';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { parkingSpotId, ownerId } = paymentIntent.metadata;
    const amount = paymentIntent.amount / 100;

    // Update parking spot availability
    if (parkingSpotId) {
      await db.collection('parkingSpots').doc(parkingSpotId).update({
        availability: false,
        lastBooked: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Create payout record for owner
    if (ownerId) {
      const platformFee = amount * 0.10; // 10% platform fee
      const ownerAmount = amount - platformFee;

      await db.collection('payouts').add({
        ownerId: ownerId,
        spotId: parkingSpotId,
        totalAmount: amount,
        platformFee: platformFee,
        ownerAmount: ownerAmount,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: null
      });

      // Process payout to owner (using Stripe Connect)
      await processOwnerPayout(ownerId, ownerAmount, parkingSpotId);
    }

    console.log(`Payment successful: $${amount} for spot ${parkingSpotId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle payment failure
async function handlePaymentFailure(paymentIntent) {
  try {
    const { parkingSpotId } = paymentIntent.metadata;
    
    // Update parking spot availability back to true
    if (parkingSpotId) {
      await db.collection('parkingSpots').doc(parkingSpotId).update({
        availability: true
      });
    }

    console.log(`Payment failed for spot ${parkingSpotId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Process payout to owner
async function processOwnerPayout(ownerId, amount, spotId) {
  try {
    // Get owner's Stripe account (if they have one)
    const ownerDoc = await db.collection('users').doc(ownerId).get();
    const ownerData = ownerDoc.data();

    if (ownerData?.stripeAccountId) {
      // Transfer to owner's Stripe account
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: ownerData.stripeAccountId,
        description: `Payout for parking spot ${spotId}`
      });

      // Update payout record
      await db.collection('payouts').where('ownerId', '==', ownerId)
        .where('spotId', '==', spotId)
        .get()
        .then(snapshot => {
          if (!snapshot.empty) {
            snapshot.docs[0].ref.update({
              status: 'completed',
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              stripeTransferId: transfer.id
            });
          }
        });

      console.log(`Payout completed: $${amount} to owner ${ownerId}`);
    } else {
      // Store payout for manual processing
      console.log(`Payout pending manual processing: $${amount} to owner ${ownerId}`);
    }
  } catch (error) {
    console.error('Error processing payout:', error);
  }
}

// Get payout status for owners
app.get('/api/payouts/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const payoutsSnapshot = await db.collection('payouts')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();

    const payouts = [];
    payoutsSnapshot.forEach(doc => {
      payouts.push({ id: doc.id, ...doc.data() });
    });

    res.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Create Stripe Connect account for owners
app.post('/api/create-connect-account', async (req, res) => {
  try {
    const { ownerId, email, country = 'US' } = req.body;

    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account ID to user document
    await db.collection('users').doc(ownerId).update({
      stripeAccountId: account.id,
      stripeAccountStatus: account.charges_enabled ? 'active' : 'pending'
    });

    res.json({ accountId: account.id });
  } catch (error) {
    console.error('Error creating connect account:', error);
    res.status(500).json({ error: 'Failed to create connect account' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 