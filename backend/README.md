# PS Finder Backend - Payment System

This backend server handles real payment processing for the Parking Space Finder application using Stripe.

## 🚀 Features

- **Real Payment Processing** - Secure credit/debit card payments via Stripe
- **Owner Payout System** - Automatic money distribution to parking spot owners
- **Platform Fee Management** - 10% platform fee with transparent tracking
- **Webhook Handling** - Real-time payment status updates
- **Stripe Connect Integration** - Direct transfers to owner accounts
- **Firebase Integration** - Seamless database updates

## 📋 Prerequisites

- Node.js 16+ 
- Stripe Account
- Firebase Project
- Firebase Admin SDK credentials

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Stripe Configuration

#### Get Your Stripe Keys
1. Sign up at [stripe.com](https://stripe.com)
2. Go to Dashboard → Developers → API Keys
3. Copy your publishable and secret keys

#### Update Configuration
Replace the following in `server.js`:
```javascript
// Replace with your actual Stripe secret key
const stripe = require('stripe')('sk_test_your_stripe_secret_key_here');

// Replace with your webhook secret
const endpointSecret = 'whsec_your_webhook_secret_here';
```

### 3. Firebase Configuration

#### Get Firebase Admin SDK
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in backend folder

#### Update Firebase Config
Replace in `server.js`:
```javascript
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});
```

### 4. Environment Variables
Create a `.env` file:
```env
PORT=3001
NODE_ENV=development
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PLATFORM_FEE_PERCENTAGE=10
```

### 5. Frontend Configuration
Update the Stripe publishable key in `src/components/Payments.jsx`:
```javascript
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');
```

## 🏃‍♂️ Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 🔗 API Endpoints

### Payment Processing
- `POST /api/create-payment-intent` - Create payment intent
- `POST /api/webhook` - Stripe webhook handler

### Owner Management
- `GET /api/payouts/:ownerId` - Get owner's payout history
- `POST /api/create-connect-account` - Create Stripe Connect account

### Health Check
- `GET /api/health` - Server health status

## 💰 Payment Flow

1. **User Books Spot** → Frontend calls `/api/create-payment-intent`
2. **Payment Processing** → Stripe handles secure payment
3. **Webhook Notification** → Backend updates database
4. **Owner Payout** → Automatic transfer to owner's account
5. **Spot Availability** → Updated to unavailable

## 🏦 Owner Payout System

### Automatic Payouts
- 90% of payment goes to owner
- 10% platform fee retained
- Direct transfer via Stripe Connect

### Manual Payouts
- For owners without Stripe accounts
- Stored in database for manual processing
- Email notifications sent

## 🔒 Security Features

- **PCI Compliance** - Stripe handles sensitive card data
- **Webhook Verification** - Ensures payment authenticity
- **Firebase Security Rules** - Database access control
- **HTTPS Required** - Secure communication

## 📊 Database Collections

### payments
```javascript
{
  paymentIntentId: "pi_xxx",
  amount: 25.00,
  status: "succeeded",
  parkingSpotId: "spot_123",
  ownerId: "user_456",
  createdAt: timestamp,
  currency: "usd"
}
```

### payouts
```javascript
{
  ownerId: "user_456",
  spotId: "spot_123",
  totalAmount: 25.00,
  platformFee: 2.50,
  ownerAmount: 22.50,
  status: "completed",
  stripeTransferId: "tr_xxx"
}
```

## 🚨 Important Notes

1. **Test Mode** - Use Stripe test keys for development
2. **Webhook URL** - Set to `https://your-domain.com/api/webhook`
3. **Firebase Rules** - Ensure proper security rules
4. **Error Handling** - Monitor logs for failed payments
5. **Compliance** - Follow local payment regulations

## 🆘 Troubleshooting

### Common Issues
- **Webhook failures** - Check endpoint secret
- **Payment failures** - Verify Stripe keys
- **Database errors** - Check Firebase credentials
- **CORS errors** - Ensure proper CORS configuration

### Support
- Check Stripe Dashboard for payment status
- Monitor server logs for errors
- Verify Firebase connection
- Test with Stripe test cards

## 📈 Monitoring

- **Payment Success Rate** - Monitor in Stripe Dashboard
- **Payout Status** - Track in database
- **Error Rates** - Check server logs
- **Performance** - Monitor response times

## 🔄 Updates

- Keep Stripe SDK updated
- Monitor Firebase Admin SDK updates
- Regular security audits
- Performance optimization

---

**⚠️ Important**: Never commit real API keys to version control. Use environment variables for production. 