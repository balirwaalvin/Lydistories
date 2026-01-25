// Import Firebase service
import firebaseService from './firebase-service.js';

// Load all books on order page
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllBooksFromFirebase();
    setupSearch();
    setupCategoryFilter();
    setupPaymentOptions();
    setupPaymentForm();
    setupCardInputFormatting();
});

// Load books from Firebase
async function loadAllBooksFromFirebase() {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    booksGrid.innerHTML = '<p style="text-align: center; padding: 40px;">Loading books...</p>';
    
    const result = await firebaseService.getAllBooks();
    
    if (result.success && result.books.length > 0) {
        // Use Firebase books
        window.booksData = result.books;
        booksGrid.innerHTML = '';
        result.books.forEach(book => {
            const bookCard = createBookCard(book);
            booksGrid.appendChild(bookCard);
        });
    } else {
        // Fallback to local data if Firebase fails or is empty
        if (!window.booksData || window.booksData.length === 0) {
            booksGrid.innerHTML = '<p style="text-align: center; padding: 40px;">No books available</p>';
        } else {
            booksGrid.innerHTML = '';
            window.booksData.forEach(book => {
                const bookCard = createBookCard(book);
                booksGrid.appendChild(bookCard);
            });
        }
    }
}

// Load all books
function loadAllBooks() {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    booksGrid.innerHTML = '';
    booksData.forEach(book => {
        const bookCard = createBookCard(book);
        booksGrid.appendChild(bookCard);
    });
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterBooks(searchTerm, null);
    });
}

// Category filter
function setupCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.addEventListener('change', function(e) {
        const category = e.target.value;
        filterBooks(null, category);
    });
}

// Filter books based on search and category
function filterBooks(searchTerm, category) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    const searchValue = searchTerm !== null ? searchTerm : document.getElementById('searchInput').value.toLowerCase();
    const categoryValue = category !== null ? category : document.getElementById('categoryFilter').value;

    const filteredBooks = booksData.filter(book => {
        const matchesSearch = !searchValue || 
            book.title.toLowerCase().includes(searchValue) ||
            book.author.toLowerCase().includes(searchValue) ||
            book.description.toLowerCase().includes(searchValue);

        const matchesCategory = categoryValue === 'all' || book.category === categoryValue;

        return matchesSearch && matchesCategory;
    });

    booksGrid.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: #999; font-size: 1.2rem;">No books found matching your criteria.</p>';
    } else {
        filteredBooks.forEach(book => {
            const bookCard = createBookCard(book);
            booksGrid.appendChild(bookCard);
        });
    }
}

// Payment options selection
function setupPaymentOptions() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentForm = document.getElementById('paymentForm');
    const paymentMethodsSelect = document.querySelector('.payment-methods-select');

    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Store selected provider and type
            const provider = this.dataset.provider;
            const type = this.dataset.type;
            paymentForm.dataset.provider = provider;
            paymentForm.dataset.type = type;
            
            // Hide all payment form sections
            document.getElementById('mobileMoneyForm').style.display = 'none';
            document.getElementById('cardPaymentForm').style.display = 'none';
            document.getElementById('bankTransferForm').style.display = 'none';
            
            // Show appropriate form based on type
            if (type === 'mobile') {
                document.getElementById('mobileMoneyForm').style.display = 'block';
            } else if (type === 'card') {
                document.getElementById('cardPaymentForm').style.display = 'block';
            } else if (type === 'bank') {
                document.getElementById('bankTransferForm').style.display = 'block';
            }
            
            // Show payment form
            if (paymentMethodsSelect) {
                paymentMethodsSelect.style.display = 'none';
            }
            paymentForm.style.display = 'block';
        });
    });
}

// Setup payment form submission
function setupPaymentForm() {
    const paymentForm = document.getElementById('paymentForm');
    if (!paymentForm) return;

    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        processPayment();
    });
}

// Process payment
function processPayment() {
    const paymentModal = document.getElementById('paymentModal');
    const paymentForm = document.getElementById('paymentForm');
    const provider = paymentForm.dataset.provider;
    const type = paymentForm.dataset.type;
    
    const bookId = paymentModal.dataset.bookId;
    const bookPrice = paymentModal.dataset.bookPrice;
    const bookTitle = paymentModal.dataset.bookTitle;

    let paymentData = {
        bookId: bookId,
        bookTitle: bookTitle,
        amount: bookPrice,
        provider: provider,
        type: type,
        timestamp: new Date().toISOString()
    };

    // Collect data based on payment type
    if (type === 'mobile') {
        const phoneNumber = document.getElementById('phoneNumber').value;
        const customerName = document.getElementById('customerName').value;
        const customerEmail = document.getElementById('customerEmail').value;

        // Validate phone number format (Ugandan format)
        if (!validatePhoneNumber(phoneNumber)) {
            showAlert('Please enter a valid Ugandan phone number (e.g., 0772123456)', 'error');
            return;
        }

        paymentData.phoneNumber = phoneNumber;
        paymentData.customerName = customerName;
        paymentData.customerEmail = customerEmail;

    } else if (type === 'card') {
        const cardNumber = document.getElementById('cardNumber').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVV = document.getElementById('cardCVV').value;
        const cardHolderName = document.getElementById('cardHolderName').value;
        const cardEmail = document.getElementById('cardEmail').value;

        // Validate card details
        if (!validateCardNumber(cardNumber)) {
            showAlert('Please enter a valid card number', 'error');
            return;
        }
        if (!validateCardExpiry(cardExpiry)) {
            showAlert('Please enter a valid expiry date (MM/YY)', 'error');
            return;
        }
        if (!validateCVV(cardCVV)) {
            showAlert('Please enter a valid CVV', 'error');
            return;
        }

        paymentData.cardNumber = maskCardNumber(cardNumber);
        paymentData.cardExpiry = cardExpiry;
        paymentData.cardHolderName = cardHolderName;
        paymentData.customerEmail = cardEmail;
        paymentData.customerName = cardHolderName;

    } else if (type === 'bank') {
        const bankTransferName = document.getElementById('bankTransferName').value;
        const bankTransferEmail = document.getElementById('bankTransferEmail').value;
        const bankTransferReference = document.getElementById('bankTransferReference').value;

        if (!bankTransferReference || bankTransferReference.length < 5) {
            showAlert('Please enter a valid transfer reference number', 'error');
            return;
        }

        paymentData.customerName = bankTransferName;
        paymentData.customerEmail = bankTransferEmail;
        paymentData.transferReference = bankTransferReference;
    }

    // Show loading state
    const submitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    // Simulate payment processing
    // In a real implementation, this would call your backend API
    setTimeout(() => {
        // Simulate payment success (in production, check actual payment status from API)
        const paymentSuccess = true;
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (paymentSuccess) {
            // Store purchase in localStorage (in production, this would be in a database)
            storePurchase(paymentData);
            
            // Close payment modal
            paymentModal.style.display = 'none';
            
            // Show success message with library link
            showSuccessWithLibraryLink(bookTitle, provider, type);
            
            // Reset form
            paymentForm.reset();
            paymentForm.style.display = 'none';
            document.querySelector('.payment-methods-select').style.display = 'block';
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            
            // Reset form sections
            document.getElementById('mobileMoneyForm').style.display = 'none';
            document.getElementById('cardPaymentForm').style.display = 'none';
            document.getElementById('bankTransferForm').style.display = 'none';
        } else {
            showAlert('Payment failed. Please try again or contact support.', 'error');
        }
    }, 2500);
}

// Validate Ugandan phone number
function validatePhoneNumber(phone) {
    // Remove spaces and dashes
    phone = phone.replace(/[\s-]/g, '');
    
    // Check if it matches Ugandan format
    // Formats: 0772123456, 0752123456, 0700123456, etc.
    const ugandaPattern = /^0[7][0-9]{8}$/;
    
    return ugandaPattern.test(phone);
}

// Validate card number (basic Luhn algorithm)
function validateCardNumber(cardNumber) {
    // Remove spaces
    cardNumber = cardNumber.replace(/\s/g, '');
    
    // Check if only digits and correct length
    if (!/^\d{13,19}$/.test(cardNumber)) {
        return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return (sum % 10) === 0;
}

// Validate card expiry date
function validateCardExpiry(expiry) {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return false;
    }
    
    const [month, year] = expiry.split('/').map(num => parseInt(num, 10));
    
    if (month < 1 || month > 12) {
        return false;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    
    return true;
}

// Validate CVV
function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

// Mask card number for storage
function maskCardNumber(cardNumber) {
    cardNumber = cardNumber.replace(/\s/g, '');
    return '**** **** **** ' + cardNumber.slice(-4);
}

// Store purchase in Firebase and localStorage
async function storePurchase(paymentData) {
    // Store in Firebase
    const user = firebaseService.getCurrentUser();
    const userId = user ? user.uid : 'guest';
    
    const result = await firebaseService.recordPurchase(
        userId,
        paymentData.bookId,
        paymentData.bookTitle,
        paymentData.amount,
        paymentData.provider
    );
    
    if (result.success) {
        console.log('Purchase recorded in Firebase');
    }
    
    // Also store in localStorage for offline access
    let purchases = JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');
    purchases.push(paymentData);
    localStorage.setItem('lydistoriesPurchases', JSON.stringify(purchases));
}

// Show alert message
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        max-width: 500px;
        text-align: center;
        animation: slideDown 0.3s ease;
    `;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
    `;

    document.body.appendChild(alert);

    // Remove alert after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Show success message with library link
function showSuccessWithLibraryLink(bookTitle, provider, type) {
    let paymentMethodText = '';
    
    if (type === 'mobile') {
        paymentMethodText = provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';
    } else if (type === 'card') {
        paymentMethodText = provider === 'visa' ? 'VISA' : 'MasterCard';
    } else if (type === 'bank') {
        paymentMethodText = 'Bank Transfer';
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #27ae60;
        color: white;
        padding: 25px 35px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        max-width: 600px;
        text-align: center;
        animation: slideDown 0.3s ease;
    `;
    
    let additionalMessage = '';
    if (type === 'mobile') {
        additionalMessage = `<p style="font-size: 0.9rem; margin-bottom: 20px;">Check your ${paymentMethodText} phone for the payment confirmation.</p>`;
    } else if (type === 'card') {
        additionalMessage = `<p style="font-size: 0.9rem; margin-bottom: 20px;">Your ${paymentMethodText} payment has been processed successfully.</p>`;
    } else if (type === 'bank') {
        additionalMessage = `<p style="font-size: 0.9rem; margin-bottom: 20px;">Your bank transfer will be verified within 24 hours. You'll receive email confirmation.</p>`;
    }
    
    alert.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
        <h3 style="margin-bottom: 10px;">Payment Successful!</h3>
        <p style="margin-bottom: 15px;">You now have full access to "${bookTitle}"</p>
        ${additionalMessage}
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="window.location.href='library.html'" class="btn btn-primary" style="background: white; color: #27ae60;">
                <i class="fas fa-book-reader"></i> Go to My Library
            </button>
            <button onclick="this.closest('.alert').remove()" class="btn btn-secondary" style="background: rgba(255,255,255,0.2);">
                Continue Shopping
            </button>
        </div>
    `;

    document.body.appendChild(alert);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }
    }, 10000);
}

// Setup card input formatting
function setupCardInputFormatting() {
    // Format card number with spaces
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date as MM/YY
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Only allow numbers in CVV
    const cardCVVInput = document.getElementById('cardCVV');
    if (cardCVVInput) {
        cardCVVInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
