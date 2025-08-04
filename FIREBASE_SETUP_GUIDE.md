# Firebase Authentication Setup Guide for Production

## 🔧 **Step 1: Add Authorized Domains**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ps-finder-123`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   - `ps-finder-xxx.vercel.app` (your actual Vercel domain)
   - Or your custom domain if you have one

## 🔧 **Step 2: Configure Email Templates**

1. In Firebase Console, go to **Authentication** → **Templates**
2. Customize the following templates:
   - **Password reset**
   - **Email verification**
   - **Email sign-in**

### Email Template Settings:
- **Action URL**: Set to your Vercel domain
- **Sender name**: "Parking Space Finder"
- **Reply-to**: Your support email

## 🔧 **Step 3: Enable Authentication Methods**

1. Go to **Authentication** → **Sign-in method**
2. Enable these providers:
   - ✅ **Email/Password**
   - ✅ **Email link (passwordless sign-in)** (optional)

## 🔧 **Step 4: Configure Security Rules**

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read parking spots
    match /parkingSpots/{spotId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to manage their bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🔧 **Step 5: Test Authentication**

1. Deploy your app to Vercel
2. Test the following flows:
   - ✅ User registration
   - ✅ Email verification
   - ✅ Password reset
   - ✅ Login/logout

## 🔧 **Step 6: Common Issues & Solutions**

### Issue: "Password reset email not received"
**Solution:**
- Check spam folder
- Verify domain is added to authorized domains
- Check Firebase Console logs for errors

### Issue: "Invalid domain" error
**Solution:**
- Add your Vercel domain to authorized domains
- Wait 5-10 minutes for changes to propagate

### Issue: "Too many requests" error
**Solution:**
- Implement rate limiting in your app
- Add delays between requests
- Use Firebase's built-in rate limiting

## 🔧 **Step 7: Production Checklist**

- [ ] Authorized domains configured
- [ ] Email templates customized
- [ ] Authentication methods enabled
- [ ] Security rules implemented
- [ ] Error handling improved
- [ ] Tested all auth flows
- [ ] Monitoring set up

## 🔧 **Step 8: Monitoring & Analytics**

1. **Firebase Console** → **Authentication** → **Users**
2. Monitor sign-in methods and user activity
3. Set up alerts for authentication failures
4. Track email delivery rates

## 🔧 **Step 9: Support & Troubleshooting**

### Common Error Codes:
- `auth/user-not-found`: User doesn't exist
- `auth/invalid-email`: Invalid email format
- `auth/too-many-requests`: Rate limit exceeded
- `auth/network-request-failed`: Network issues
- `auth/operation-not-allowed`: Feature not enabled

### Debug Steps:
1. Check browser console for errors
2. Verify Firebase configuration
3. Test with different email providers
4. Check Firebase Console logs
5. Verify domain configuration

## 🚀 **Next Steps**

After completing this setup:
1. Test with real users
2. Monitor authentication logs
3. Set up user analytics
4. Implement additional security measures 