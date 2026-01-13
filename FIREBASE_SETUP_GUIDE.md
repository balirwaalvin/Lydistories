# Firebase Integration Guide for Lydistories

## ✅ Firebase is Already Configured!

Your Firebase credentials have been integrated into the website. Follow these steps to enable the Firebase services in your project.

---

## Step 1: Enable Firebase Services

### 1.1 Open Firebase Console
1. Go to https://console.firebase.google.com
2. Login with your Google account
3. You should see your project: **studio-3160139606-b516b**
4. Click on the project to open it

### 1.2 Enable Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose location: **us-central** (or closest to Uganda)
5. Click **"Enable"**

**Security Rules for Testing** (will be set automatically):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Important**: For production, update these rules to:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Books - anyone can read, only admin can write
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Chapters - anyone can read, only admin can write
    match /chapters/{chapterId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Purchases - users can only read/write their own
    match /purchases/{purchaseId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.data.userId == request.auth.uid;
    }
    
    // Messages - anyone can write, only admin can read
    match /messages/{messageId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if true;
    }
    
    // Users - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 1.3 Enable Firebase Storage (for book covers)
1. In the left sidebar, click **"Storage"**
2. Click **"Get started"**
3. Select **"Start in test mode"**
4. Click **"Next"**
5. Choose location: same as Firestore
6. Click **"Done"**

**Storage Rules for Testing**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

⚠️ **For Production**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /book-covers/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 1.4 Enable Authentication (Optional - for future)
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Click **"Save"**

---

## Step 2: Initialize Your Database

### Option A: Manual Setup (Recommended)

#### Create Collections in Firestore:

1. **Go to Firestore Database**
2. Click **"Start collection"**

##### Collection 1: `books`
- **Collection ID**: `books`
- **First Document**: Click "Auto-ID"
- **Fields**:
  ```
  title: (string) "Sample Book Title"
  author: (string) "Author Name"
  category: (string) "Fiction"
  price: (number) 15000
  cover: (string) "https://images.unsplash.com/photo-..."
  description: (string) "Book description"
  published: (boolean) true
  createdAt: (timestamp) [auto]
  updatedAt: (timestamp) [auto]
  ```

##### Collection 2: `chapters`
- **Collection ID**: `chapters`
- **First Document**: Click "Auto-ID"
- **Fields**:
  ```
  bookId: (string) "book_document_id"
  chapterNumber: (number) 1
  title: (string) "Chapter 1: The Beginning"
  content: (string) "<h2>Chapter 1</h2><p>Content here...</p>"
  createdAt: (timestamp) [auto]
  updatedAt: (timestamp) [auto]
  ```

##### Collection 3: `purchases`
- **Collection ID**: `purchases`
- **First Document**: Auto-ID
- **Fields**:
  ```
  userId: (string) "guest" or user UID
  bookId: (string) "book_document_id"
  bookTitle: (string) "Book Title"
  amount: (number) 15000
  paymentMethod: (string) "mtn" or "airtel"
  purchasedAt: (timestamp) [auto]
  status: (string) "completed"
  ```

##### Collection 4: `messages`
- **Collection ID**: `messages`
- **First Document**: Auto-ID
- **Fields**:
  ```
  name: (string) "User Name"
  email: (string) "user@example.com"
  phone: (string) "0772123456"
  subject: (string) "Subject"
  message: (string) "Message content"
  read: (boolean) false
  createdAt: (timestamp) [auto]
  ```

##### Collection 5: `users`
- **Collection ID**: `users`
- **First Document**: Auto-ID
- **Fields**:
  ```
  uid: (string) "firebase_user_id"
  email: (string) "user@example.com"
  displayName: (string) "User Name"
  role: (string) "user" or "admin"
  createdAt: (timestamp) [auto]
  ```

### Option B: Import Sample Data

1. Download the sample data JSON (create it manually):
2. In Firestore, use the import feature
3. Or add documents programmatically through the admin dashboard

---

## Step 3: Migrate Existing Data from localStorage

If you already have books in localStorage, you can migrate them to Firebase:

### Using Browser Console:

1. Open your admin dashboard: `https://your-site.com/admin-dashboard.html`
2. Login as admin
3. Open browser console (F12)
4. Run this script:

```javascript
// Get existing books from localStorage
const existingBooks = JSON.parse(localStorage.getItem('lydistoriesBooks') || '[]');

// Import Firebase service
import('./js/firebase-service.js').then(module => {
  const firebaseService = module.default;
  
  // Upload each book
  existingBooks.forEach(async (book) => {
    const result = await firebaseService.addBook(book);
    if (result.success) {
      console.log(`✅ Uploaded: ${book.title}`);
    } else {
      console.error(`❌ Failed: ${book.title}`, result.error);
    }
  });
});
```

---

## Step 4: Test Firebase Integration

### Test 1: Add a Book
1. Go to admin dashboard
2. Click "Add New Book"
3. Fill in details
4. Click "Save"
5. Check Firestore console - new document should appear in `books` collection

### Test 2: Purchase a Book
1. Go to order page
2. Click "Purchase" on a book
3. Complete payment form
4. Check Firestore console - new document in `purchases` collection

### Test 3: Send Contact Message
1. Go to contact page
2. Fill in the form
3. Submit
4. Check Firestore console - new document in `messages` collection

### Test 4: View Library
1. After purchasing a book
2. Go to "My Library" page
3. Should see purchased books loaded from Firebase

---

## Step 5: Deploy Updated Code to Digital Ocean

Since you've already deployed to Digital Ocean, push the updates:

```powershell
cd "C:\Users\EduScan\OneDrive\Documents\VS Code Programs\Lydiastories"

# Add all changes
git add .

# Commit with message
git commit -m "Add Firebase integration for database and storage"

# Push to GitHub
git push
```

Digital Ocean App Platform will automatically:
1. Detect the changes
2. Rebuild your app
3. Deploy the updated version (2-3 minutes)

---

## 🎯 What's Working Now

### ✅ Frontend Integration Complete
- ✅ Firebase SDK configured
- ✅ Firebase service layer created
- ✅ All pages updated to use Firebase
- ✅ Fallback to localStorage if Firebase fails
- ✅ Module imports configured

### 📚 Firebase Features Enabled

#### Books Management
- Admin can add/edit/delete books
- Books stored in Firestore `books` collection
- Book covers can be uploaded to Firebase Storage
- Users see books from Firebase on order page

#### Purchases
- Purchases recorded in Firestore `purchases` collection
- User-specific purchase history
- Purchase data synced across devices

#### Library
- User library loads from Firebase
- Shows all purchased books
- Works offline with localStorage backup

#### Contact Messages
- Messages saved to Firestore `messages` collection
- Admin can view all messages
- Read/unread status tracking

#### Admin Dashboard
- Real-time stats from Firebase
- Manage books directly in Firestore
- View all purchases and messages

---

## 📊 Firestore Database Structure

```
lydistories-firebase/
├── books/                    # All books in the store
│   ├── {bookId}/
│   │   ├── title: string
│   │   ├── author: string
│   │   ├── category: string
│   │   ├── price: number
│   │   ├── cover: string (URL)
│   │   ├── description: string
│   │   ├── published: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── chapters/                 # All book chapters
│   ├── {chapterId}/
│   │   ├── bookId: string
│   │   ├── chapterNumber: number
│   │   ├── title: string
│   │   ├── content: string (HTML)
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── purchases/                # User purchases
│   ├── {purchaseId}/
│   │   ├── userId: string
│   │   ├── bookId: string
│   │   ├── bookTitle: string
│   │   ├── amount: number
│   │   ├── paymentMethod: string
│   │   ├── purchasedAt: timestamp
│   │   └── status: string
│
├── messages/                 # Contact form messages
│   ├── {messageId}/
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── subject: string
│   │   ├── message: string
│   │   ├── read: boolean
│   │   └── createdAt: timestamp
│
└── users/                    # User profiles
    ├── {userId}/
    │   ├── uid: string
    │   ├── email: string
    │   ├── displayName: string
    │   ├── role: string
    │   └── createdAt: timestamp
```

---

## 🔒 Security Best Practices

### For Production:

1. **Update Firestore Security Rules** (see Step 1.2)
2. **Update Storage Security Rules** (see Step 1.3)
3. **Enable App Check** (prevents abuse):
   - Go to Firebase Console → App Check
   - Register your domain
   - Add reCAPTCHA site key

4. **Hide API Keys** (optional but recommended):
   - API keys in Firebase config are safe for public use
   - They only identify your Firebase project
   - Security is enforced by Firestore Security Rules
   - However, you can restrict key usage:
     - Go to Google Cloud Console
     - API & Services → Credentials
     - Edit your API key
     - Add "HTTP referrer" restrictions

5. **Monitor Usage**:
   - Firebase Console → Usage and billing
   - Set budget alerts
   - Monitor for unusual activity

---

## 💰 Firebase Pricing

### Free Tier (Spark Plan)
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Storage**: 1GB storage, 10GB/month transfer
- **Authentication**: Unlimited users

### Your Usage Estimate:
- **100 books** ≈ 100KB Firestore
- **1000 users/day** ≈ 30K reads/day (well within free tier)
- **Book covers** (if using Firebase Storage) ≈ 50-100MB

**Verdict**: You'll stay within the FREE tier for quite a while!

If you exceed free tier:
- **Blaze Plan** (Pay-as-you-go):
  - $0.18 per GB Firestore storage
  - $0.06 per 100K reads
  - $0.18 per 100K writes
  - Very affordable for small/medium sites

---

## 🐛 Troubleshooting

### Issue: "Firebase not defined"
**Solution**: Make sure you're using `type="module"` in script tags:
```html
<script type="module" src="js/order.js"></script>
```

### Issue: "Failed to load module"
**Solution**: Serve your site over HTTP/HTTPS (doesn't work with `file://`)
- Use Digital Ocean deployment
- Or run local server: `python -m http.server 8000`

### Issue: "Permission denied" errors
**Solution**: Check Firestore security rules are set to test mode

### Issue: "Books not showing"
**Solution**: 
1. Check browser console for errors
2. Verify Firestore has data
3. Check network tab for failed requests
4. Ensure Firebase project is active

### Issue: "CORS errors"
**Solution**: 
- Firebase automatically handles CORS
- If issues persist, check Storage CORS settings

---

## 📝 Next Steps

### Immediate:
1. ✅ Enable Firestore Database
2. ✅ Enable Firebase Storage
3. ✅ Create initial collections
4. ✅ Test adding a book
5. ✅ Push to GitHub
6. ✅ Auto-deploy to Digital Ocean

### Future Enhancements:
- [ ] Add user authentication (sign up/login)
- [ ] Implement real Mobile Money API integration
- [ ] Add email notifications for purchases
- [ ] Create admin panel for viewing analytics
- [ ] Add book reviews and ratings
- [ ] Implement book recommendations
- [ ] Add search with Algolia
- [ ] Set up automated backups

---

## 📞 Support

If you encounter any issues:

1. **Check Firebase Console Logs**:
   - Go to Firestore → Usage tab
   - Look for errors

2. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for Firebase errors

3. **Common Errors**:
   - `auth/invalid-api-key` → Check firebase-config.js
   - `permission-denied` → Update security rules
   - `Failed to fetch` → Check internet connection

---

## ✅ Summary

Your Lydistories website now has:

- ✅ **Firebase Configuration**: Complete with your credentials
- ✅ **Firebase Service Layer**: All CRUD operations ready
- ✅ **Books Management**: Add/edit/delete books via Firestore
- ✅ **Purchase Tracking**: All purchases saved to Firebase
- ✅ **Contact Messages**: Messages stored in Firestore
- ✅ **User Library**: Loads purchased books from Firebase
- ✅ **Offline Support**: Falls back to localStorage if Firebase fails
- ✅ **GitHub**: Code versioned and backed up
- ✅ **Digital Ocean**: Live deployment with auto-updates

**All you need to do is enable the Firebase services in the console!**

---

🎉 **You're Ready to Go Live with Firebase!**
