/*
 * BACKEND INTEGRATION GUIDE FOR LYDISTORIES
 * 
 * This file provides guidance for integrating real mobile money payment APIs
 * Replace the simulated payment processing in order.js with actual API calls
 */

// ====================================================================
// MTN MOBILE MONEY API INTEGRATION
// ====================================================================

/*
 * Step 1: Sign up at https://momodeveloper.mtn.com
 * Step 2: Subscribe to Collections product
 * Step 3: Get your API credentials
 */

// Example: MTN MoMo Collection Request
async function processMTNPayment(paymentData) {
    const apiUrl = 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay';
    
    // First, get access token
    const token = await getMTNAccessToken();
    
    const requestBody = {
        amount: paymentData.amount.toString(),
        currency: "UGX",
        externalId: generateUniqueId(),
        payer: {
            partyIdType: "MSISDN",
            partyId: paymentData.phoneNumber.replace(/^0/, '256') // Convert to international format
        },
        payerMessage: `Payment for ${paymentData.bookTitle}`,
        payeeNote: "Lydistories Book Purchase"
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Reference-Id': generateUUID(),
                'X-Target-Environment': 'sandbox', // Change to 'production' for live
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': 'YOUR_SUBSCRIPTION_KEY'
            },
            body: JSON.stringify(requestBody)
        });

        // Check payment status
        const referenceId = response.headers.get('X-Reference-Id');
        return await checkMTNPaymentStatus(referenceId, token);
    } catch (error) {
        console.error('MTN Payment Error:', error);
        return { success: false, error: error.message };
    }
}

async function getMTNAccessToken() {
    const tokenUrl = 'https://sandbox.momodeveloper.mtn.com/collection/token/';
    
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa('YOUR_USER_ID:YOUR_API_KEY'),
            'Ocp-Apim-Subscription-Key': 'YOUR_SUBSCRIPTION_KEY'
        }
    });

    const data = await response.json();
    return data.access_token;
}

async function checkMTNPaymentStatus(referenceId, token) {
    const statusUrl = `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${referenceId}`;
    
    const response = await fetch(statusUrl, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': 'sandbox',
            'Ocp-Apim-Subscription-Key': 'YOUR_SUBSCRIPTION_KEY'
        }
    });

    const data = await response.json();
    return {
        success: data.status === 'SUCCESSFUL',
        status: data.status,
        referenceId: referenceId
    };
}

// ====================================================================
// AIRTEL MONEY API INTEGRATION
// ====================================================================

/*
 * Contact Airtel Uganda Business Team for API access
 * Email: businesssupport@ug.airtel.com
 */

async function processAirtelPayment(paymentData) {
    const apiUrl = 'https://openapiuat.airtel.africa/merchant/v1/payments/'; // UAT URL
    
    // Get access token
    const token = await getAirtelAccessToken();
    
    const requestBody = {
        reference: generateUniqueId(),
        subscriber: {
            country: "UG",
            currency: "UGX",
            msisdn: paymentData.phoneNumber.replace(/^0/, '256')
        },
        transaction: {
            amount: paymentData.amount,
            country: "UG",
            currency: "UGX",
            id: generateUniqueId()
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        return {
            success: data.status.code === '200',
            transactionId: data.data.transaction.id,
            status: data.status
        };
    } catch (error) {
        console.error('Airtel Payment Error:', error);
        return { success: false, error: error.message };
    }
}

async function getAirtelAccessToken() {
    const authUrl = 'https://openapiuat.airtel.africa/auth/oauth2/token';
    
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: 'YOUR_CLIENT_ID',
            client_secret: 'YOUR_CLIENT_SECRET',
            grant_type: 'client_credentials'
        })
    });

    const data = await response.json();
    return data.access_token;
}

// ====================================================================
// DATABASE SCHEMA SUGGESTIONS
// ====================================================================

/*
 * Books Table
 */
const booksSchema = {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    title: 'VARCHAR(255) NOT NULL',
    author: 'VARCHAR(255) NOT NULL',
    description: 'TEXT',
    category: 'VARCHAR(100)',
    price: 'DECIMAL(10,2) NOT NULL',
    cover_image: 'VARCHAR(500)',
    content_file: 'VARCHAR(500)', // Path to PDF or book content
    isbn: 'VARCHAR(50)',
    published_date: 'DATE',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
};

/*
 * Users Table
 */
const usersSchema = {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    name: 'VARCHAR(255) NOT NULL',
    phone: 'VARCHAR(20)',
    password_hash: 'VARCHAR(255) NOT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
};

/*
 * Purchases/Transactions Table
 */
const purchasesSchema = {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    user_id: 'INTEGER',
    book_id: 'INTEGER',
    amount: 'DECIMAL(10,2) NOT NULL',
    phone_number: 'VARCHAR(20) NOT NULL',
    payment_provider: 'ENUM("mtn", "airtel") NOT NULL',
    transaction_ref: 'VARCHAR(100) UNIQUE',
    status: 'ENUM("pending", "completed", "failed") DEFAULT "pending"',
    payment_date: 'TIMESTAMP',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    // Foreign keys
    'FOREIGN KEY (user_id)': 'REFERENCES users(id)',
    'FOREIGN KEY (book_id)': 'REFERENCES books(id)'
};

/*
 * Access Tokens Table (for book access)
 */
const accessTokensSchema = {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    user_id: 'INTEGER NOT NULL',
    book_id: 'INTEGER NOT NULL',
    token: 'VARCHAR(255) UNIQUE NOT NULL',
    expires_at: 'TIMESTAMP NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    // Foreign keys
    'FOREIGN KEY (user_id)': 'REFERENCES users(id)',
    'FOREIGN KEY (book_id)': 'REFERENCES books(id)'
};

// ====================================================================
// BACKEND API ENDPOINTS NEEDED
// ====================================================================

/*
 * Required API Endpoints:
 * 
 * 1. POST /api/books - Get all books (with pagination)
 * 2. GET /api/books/:id - Get single book details
 * 3. POST /api/payment/initiate - Initiate payment
 * 4. POST /api/payment/callback - Payment webhook/callback
 * 5. GET /api/payment/status/:transactionId - Check payment status
 * 6. POST /api/users/register - User registration
 * 7. POST /api/users/login - User login
 * 8. GET /api/users/purchases - Get user's purchased books
 * 9. GET /api/books/:id/read/:token - Access book content (with auth)
 * 10. POST /api/contact - Handle contact form submissions
 */

// ====================================================================
// EXAMPLE: Node.js/Express Backend Structure
// ====================================================================

/*
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initiate payment endpoint
app.post('/api/payment/initiate', async (req, res) => {
    const { bookId, amount, phoneNumber, customerName, customerEmail, provider } = req.body;
    
    try {
        // Validate inputs
        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }
        
        // Create transaction record in database
        const transaction = await createTransaction({
            bookId,
            amount,
            phoneNumber,
            provider,
            status: 'pending'
        });
        
        // Process payment based on provider
        let paymentResult;
        if (provider === 'mtn') {
            paymentResult = await processMTNPayment({
                amount,
                phoneNumber,
                bookTitle: transaction.bookTitle,
                referenceId: transaction.id
            });
        } else if (provider === 'airtel') {
            paymentResult = await processAirtelPayment({
                amount,
                phoneNumber,
                bookTitle: transaction.bookTitle,
                referenceId: transaction.id
            });
        }
        
        // Update transaction status
        await updateTransactionStatus(transaction.id, paymentResult.status);
        
        // If successful, create access token
        if (paymentResult.success) {
            const accessToken = await createBookAccessToken(transaction.userId, bookId);
            await sendAccessEmail(customerEmail, accessToken);
        }
        
        res.json({
            success: paymentResult.success,
            message: paymentResult.success ? 'Payment successful' : 'Payment failed',
            transactionId: transaction.id
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    }
});

// Payment callback/webhook endpoint
app.post('/api/payment/callback', async (req, res) => {
    // Handle payment provider callback
    // Update transaction status
    // Send notifications to user
});

app.listen(3000, () => console.log('Server running on port 3000'));
*/

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function validatePhoneNumber(phone) {
    phone = phone.replace(/[\s-]/g, '');
    const ugandaPattern = /^0[7][0-9]{8}$/;
    return ugandaPattern.test(phone);
}

// ====================================================================
// SECURITY BEST PRACTICES
// ====================================================================

/*
 * 1. Never expose API keys in frontend code
 * 2. Use environment variables for sensitive data
 * 3. Implement rate limiting on payment endpoints
 * 4. Validate all inputs on the server side
 * 5. Use HTTPS for all communications
 * 6. Implement proper authentication and authorization
 * 7. Log all transactions for audit trail
 * 8. Implement webhook signature verification
 * 9. Use prepared statements to prevent SQL injection
 * 10. Encrypt sensitive data in database
 */

// ====================================================================
// TESTING
// ====================================================================

/*
 * MTN MoMo Sandbox Test Numbers:
 * - 46733123450 (for testing)
 * 
 * Airtel Money Test Environment:
 * - Use UAT environment provided by Airtel
 * 
 * Test thoroughly before going to production!
 */
