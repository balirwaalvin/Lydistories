# Lydistories - Online Book Store

Welcome to **Lydistories**, a modern online book store platform designed for the Ugandan market with integrated mobile money payment support (MTN Mobile Money and Airtel Money).

## 🌟 Features

- **Browse Books**: View book covers, titles, descriptions, and prices
- **Search & Filter**: Find books by title, author, or category
- **Mobile Money Payment**: Secure payment via MTN or Airtel Mobile Money
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **User-Friendly Interface**: Clean and intuitive design
- **Contact System**: Easy communication with customer support

## 📁 Project Structure

```
Lydiastories/
│
├── index.html          # Home page
├── order.html          # Book browsing and ordering page
├── contact.html        # Contact page
│
├── css/
│   └── style.css       # Main stylesheet
│
└── js/
    ├── main.js         # Core functionality and navigation
    ├── order.js        # Order page functionality and payment
    └── contact.js      # Contact form handling
```

## 🚀 Getting Started

### Quick Start

1. Open `index.html` in your web browser
2. Browse the book collection on the Order page
3. Click on a book to view details
4. Select your payment method (MTN or Airtel)
5. Complete the payment form

### Local Development

Simply open the `index.html` file in any modern web browser. No build process or server required for basic functionality.

## 💳 Payment Integration

Currently, the payment system is simulated for demonstration purposes. To integrate real mobile money payments:

### For Production Implementation:

1. **MTN Mobile Money API Integration**
   - Sign up for MTN MoMo API at [https://momodeveloper.mtn.com](https://momodeveloper.mtn.com)
   - Obtain API credentials (User ID, API Key)
   - Implement Collection API for receiving payments

2. **Airtel Money API Integration**
   - Contact Airtel Uganda for API access
   - Obtain API credentials
   - Implement payment collection endpoint

3. **Backend Setup Required**
   - Create a backend server (Node.js, Python, PHP, etc.)
   - Implement payment processing endpoints
   - Store transaction records in a database
   - Send confirmation emails/SMS to customers
   - Provide secure book access after payment

### Example Backend Integration Flow:

```
1. User selects book and payment method
2. Frontend sends payment request to your backend
3. Backend initiates mobile money transaction
4. User receives prompt on their phone
5. User confirms payment with PIN
6. Backend receives payment confirmation
7. Backend grants access to book
8. User receives email/SMS with access details
```

## 📖 Book Management

Books are currently stored in `js/main.js` as a JavaScript array. For production:

1. **Create a Database**
   - Store books in a database (MongoDB, MySQL, PostgreSQL)
   - Include fields: title, author, price, cover image, full content, etc.

2. **Create Admin Panel**
   - Add/edit/delete books
   - Manage book categories
   - Upload book content and covers

3. **Implement Access Control**
   - Track user purchases
   - Provide download/read access only to paid users
   - Generate unique access tokens

## 🔒 Security Considerations

For production deployment:

1. **Use HTTPS**: Ensure all pages are served over HTTPS
2. **Secure API Keys**: Never expose API keys in frontend code
3. **Backend Validation**: Validate all payments on the server
4. **User Authentication**: Implement user accounts and login
5. **Payment Verification**: Always verify payment status before granting access
6. **Data Protection**: Comply with data protection regulations

## 📱 Mobile Money Payment Formats

### MTN Mobile Money
- Phone format: 0772123456 (Uganda)
- Supports: 077X, 078X

### Airtel Money
- Phone format: 0752123456 (Uganda)
- Supports: 075X, 070X

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --accent-color: #3498db;
}
```

### Adding Books

Edit the `booksData` array in `js/main.js`:

```javascript
const booksData = [
    {
        id: 1,
        title: "Your Book Title",
        author: "Author Name",
        category: "fiction",
        price: 15000,
        cover: "image-url.jpg",
        description: "Book description..."
    }
];
```

## 📧 Contact Information

Update contact details in all HTML files:

- Email: info@lydistories.com
- Phone: +256 XXX XXX XXX
- Address: Kampala, Uganda

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- JavaScript (ES6+)
- Font Awesome Icons
- Unsplash Images (for demo book covers)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📝 Next Steps for Production

1. **Backend Development**
   - Set up server (Node.js/Express, Python/Django, PHP/Laravel)
   - Create database schema
   - Implement API endpoints

2. **Payment Gateway Integration**
   - Integrate MTN MoMo API
   - Integrate Airtel Money API
   - Implement payment webhooks

3. **User System**
   - User registration and login
   - Purchase history
   - Book library for purchased books

4. **Content Delivery**
   - Secure PDF reader or custom reader
   - Download protection
   - Watermarking

5. **Admin Dashboard**
   - Book management
   - Order tracking
   - Analytics and reports

## 📄 License

© 2026 Lydistories. All rights reserved.

## 🤝 Support

For support, email info@lydistories.com or visit the Contact page.

---

**Note**: This is a frontend demonstration. For production use, implement proper backend infrastructure, secure payment processing, and user authentication.
