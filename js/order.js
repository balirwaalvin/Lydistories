// Import Firebase service
import firebaseService from './firebase-service.js';

// Load all books on order page
document.addEventListener('DOMContentLoaded', async function() {
    // Load books immediately from local storage/code
    loadAllBooksInstantly();
    
    // Then sync with Firebase in background (optional)
    await syncWithFirebaseInBackground();
    
    // Check if a specific book ID is in the URL
    checkForBookIdInURL();
    
    setupSearch();
    setupCategoryFilter();
    setupPaymentOptions();
    setupPaymentForm();
    setupCardInputFormatting();
});

// Check if URL contains a book ID and show that book's details
function checkForBookIdInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (bookId && window.booksData) {
        // Find the book in our data
        const book = window.booksData.find(b => b.id == bookId || b.id === bookId);
        
        if (book) {
            // Show the book modal automatically
            setTimeout(() => {
                showBookDetails(book);
            }, 100);
        } else {
            console.warn('Book not found with ID:', bookId);
        }
    }
}

// Show loading state immediately
function loadAllBooksInstantly() {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    // Show loading state
    booksGrid.innerHTML = '<p style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading content...</p>';
    
    // Initialize empty array
    window.booksData = [];
}

// Load all published content from Firebase
async function syncWithFirebaseInBackground() {
    const booksGrid = document.getElementById('booksGrid');
    
    try {
        const result = await firebaseService.getAllContent();
        
        if (result.success) {
            // Only show published content (published !== false)
            const publishedContent = result.content.filter(c => c.published !== false);
            
            console.log('Order page - Total content:', result.content.length);
            console.log('Order page - Published content:', publishedContent.length);
            
            window.booksData = publishedContent;
            
            if (booksGrid) {
                if (publishedContent.length === 0) {
                    booksGrid.innerHTML = '<p style="text-align: center; padding: 40px;">No content available yet.</p>';
                } else {
                    booksGrid.innerHTML = '';
                    publishedContent.forEach(item => {
                        const bookCard = createBookCard(item);
                        booksGrid.appendChild(bookCard);
                    });
                }
            }
        } else {
            throw new Error(result.error || 'Failed to load content');
        }
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        if (booksGrid) {
            booksGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Error loading content. Please refresh the page.</p>';
        }
    }
}

// Create book card element
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    // Determine content type badge
    const contentType = book.type || 'book';
    const typeIcons = {
        'book': 'fa-book',
        'article': 'fa-newspaper',
        'guide': 'fa-graduation-cap'
    };
    const typeLabels = {
        'book': 'Book',
        'article': 'Article',
        'guide': 'Study Guide'
    };
    const typeIcon = typeIcons[contentType] || 'fa-book';
    const typeLabel = typeLabels[contentType] || 'Book';
    
    card.innerHTML = `
        <div class="book-image">
            <img src="${book.cover || book.coverImage || 'https://via.placeholder.com/400x600?text=No+Cover'}" alt="${book.title}">
            <div class="content-type-badge-overlay ${contentType}">
                <i class="fas ${typeIcon}"></i> ${typeLabel}
            </div>
        </div>
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author"><i class="fas fa-user"></i> ${book.author}</p>
            <p class="book-description">${(book.description || '').substring(0, 100)}${book.description && book.description.length > 100 ? '...' : ''}</p>
            <div class="book-footer">
                <span class="book-price">UGX ${(book.price || 0).toLocaleString()}</span>
                <span class="book-category">${book.category || book.subject || 'General'}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        showBookDetails(book);
    });

    return card;
}

// Show book details (open modal or direct to payment)
function showBookDetails(book) {
    const paymentModal = document.getElementById('paymentModal');
    if (!paymentModal) {
        console.error('Payment modal not found');
        return;
    }

    // Update payment modal with book details
    const bookTitleElement = document.getElementById('paymentBookTitle');
    const paymentAmountElement = document.getElementById('paymentAmount');
    
    if (bookTitleElement) {
        bookTitleElement.textContent = book.title;
    }
    
    if (paymentAmountElement) {
        paymentAmountElement.textContent = (book.price || 0).toLocaleString();
    }

    // Store book data for payment processing
    paymentModal.dataset.bookId = book.id;
    paymentModal.dataset.bookPrice = book.price || 0;
    paymentModal.dataset.bookTitle = book.title;

    // Show payment modal
    paymentModal.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            
            // Hide all payment form sections and remove required from all fields
            document.getElementById('mobileMoneyForm').style.display = 'none';
            document.getElementById('cardPaymentForm').style.display = 'none';
            document.getElementById('bankTransferForm').style.display = 'none';
            
            // Remove required attribute from all payment form inputs
            document.querySelectorAll('#mobileMoneyForm input, #cardPaymentForm input, #bankTransferForm input').forEach(input => {
                input.removeAttribute('required');
            });
            
            // Show appropriate form based on type and add required to visible fields
            if (type === 'mobile') {
                document.getElementById('mobileMoneyForm').style.display = 'block';
                document.querySelectorAll('#mobileMoneyForm input').forEach(input => {
                    input.setAttribute('required', 'required');
                });
            } else if (type === 'card') {
                document.getElementById('cardPaymentForm').style.display = 'block';
                document.querySelectorAll('#cardPaymentForm input').forEach(input => {
                    input.setAttribute('required', 'required');
                });
            } else if (type === 'bank') {
                document.getElementById('bankTransferForm').style.display = 'block';
                document.querySelectorAll('#bankTransferForm input').forEach(input => {
                    input.setAttribute('required', 'required');
                });
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
    if (!paymentForm) {
        console.error('Payment form not found');
        return;
    }

    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Payment form submitted');
        processPayment();
    });
}

// Process payment
async function processPayment() {
    try {
        console.log('processPayment called');
        const paymentModal = document.getElementById('paymentModal');
        const paymentForm = document.getElementById('paymentForm');
        
        if (!paymentModal || !paymentForm) {
            console.error('Payment modal or form not found');
            showAlert('Payment form error. Please refresh the page.', 'error');
            return;
        }
        
        const provider = paymentForm.dataset.provider;
        const type = paymentForm.dataset.type;
        
        if (!provider || !type) {
            console.error('Provider or type not set', { provider, type });
            showAlert('Please select a payment method first.', 'error');
            return;
        }
        
        const bookId = paymentModal.dataset.bookId;
        const bookPrice = paymentModal.dataset.bookPrice;
        const bookTitle = paymentModal.dataset.bookTitle;

        console.log('Payment data:', { bookId, bookPrice, bookTitle, provider, type });

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
    
    // Update button text based on payment type
    if (type === 'mobile') {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending payment request to ' + (provider === 'mtn' ? 'MTN' : 'Airtel') + '...';
    } else if (type === 'card') {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing ' + (provider === 'visa' ? 'VISA' : 'MasterCard') + ' payment...';
    } else if (type === 'bank') {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying bank transfer...';
    }

    // Simulate payment processing (realistic timing for each payment type)
    // In a real implementation, this would call your backend payment API
    const processingTime = type === 'bank' ? 3000 : (type === 'card' ? 2500 : 3500);
    
    setTimeout(async () => {
        // Simulate payment success (95% success rate simulation)
        const paymentSuccess = Math.random() > 0.05; // 95% success rate
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (paymentSuccess) {
            try {
                // Store purchase in localStorage and Firebase
                await storePurchase(paymentData);
                
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
            } catch (error) {
                console.error('Error storing purchase:', error);
                showAlert('Payment successful but there was an error saving your purchase. Please contact support.', 'error');
            }
        } else {
            // Show appropriate error message
            let errorMsg = 'Payment failed. Please try again.';
            if (type === 'mobile') {
                errorMsg = 'Mobile money payment failed. Please check your balance and try again.';
            } else if (type === 'card') {
                errorMsg = 'Card payment declined. Please check your card details or try another card.';
            } else if (type === 'bank') {
                errorMsg = 'Bank transfer verification failed. Please check your reference number.';
            }
            showAlert(errorMsg, 'error');
        }
    }, processingTime);
    
    } catch (error) {
        console.error('Error in processPayment:', error);
        showAlert('An error occurred processing your payment. Please try again.', 'error');
    }
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

// Store purchase in Firebase (primary storage)
async function storePurchase(paymentData) {
    // Get or create user identifier  
    let userId = localStorage.getItem('lydistoriesUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('lydistoriesUserId', userId);
    }
    
    // Add userId to payment data
    paymentData.userId = userId;
    
    // Store in Firebase only
    const result = await firebaseService.recordPurchase(
        userId,
        paymentData.bookId,
        paymentData.bookTitle,
        paymentData.amount,
        paymentData.provider
    );
    
    if (result.success) {
        console.log('Purchase recorded in Firebase');
    } else {
        console.error('Failed to record purchase in Firebase');
        throw new Error('Failed to save purchase');
    }
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
    let successIcon = 'fa-check-circle';
    let iconColor = '#27ae60';
    
    if (type === 'mobile') {
        paymentMethodText = provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';
        successIcon = 'fa-mobile-alt';
        iconColor = provider === 'mtn' ? '#FFCB05' : '#ED1C24';
    } else if (type === 'card') {
        paymentMethodText = provider === 'visa' ? 'VISA' : 'MasterCard';
        successIcon = 'fa-credit-card';
        iconColor = provider === 'visa' ? '#1434CB' : '#EB001B';
    } else if (type === 'bank') {
        paymentMethodText = 'Bank Transfer';
        successIcon = 'fa-university';
        iconColor = '#2c3e50';
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
        color: white;
        padding: 30px 40px;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 3000;
        max-width: 600px;
        text-align: center;
        animation: slideDown 0.5s ease;
        border: 3px solid rgba(255,255,255,0.3);
    `;
    
    let additionalMessage = '';
    if (type === 'mobile') {
        additionalMessage = `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <i class="fas fa-info-circle"></i> 
                <p style="font-size: 0.9rem; margin: 5px 0;">Payment request sent to your ${paymentMethodText} account.</p>
                <p style="font-size: 0.85rem; margin: 0; opacity: 0.9;">You'll receive an SMS confirmation shortly.</p>
            </div>
        `;
    } else if (type === 'card') {
        additionalMessage = `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <i class="fas fa-shield-alt"></i> 
                <p style="font-size: 0.9rem; margin: 5px 0;">Your ${paymentMethodText} payment was processed securely.</p>
                <p style="font-size: 0.85rem; margin: 0; opacity: 0.9;">Transaction ID: TXN-${Date.now().toString().slice(-8)}</p>
            </div>
        `;
    } else if (type === 'bank') {
        additionalMessage = `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <i class="fas fa-clock"></i> 
                <p style="font-size: 0.9rem; margin: 5px 0;">Bank transfer received and verified.</p>
                <p style="font-size: 0.85rem; margin: 0; opacity: 0.9;">A receipt has been sent to your email.</p>
            </div>
        `;
    }
    
    alert.innerHTML = `
        <i class="fas ${successIcon}" style="font-size: 3.5rem; margin-bottom: 15px; color: ${iconColor === '#27ae60' ? 'white' : iconColor}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>
        <h2 style="margin-bottom: 10px; font-size: 1.8rem;">Payment Successful!</h2>
        <p style="margin-bottom: 10px; font-size: 1.1rem; font-weight: 500;">You now have full access to "${bookTitle}"</p>
        <p style="margin-bottom: 15px; font-size: 0.9rem; opacity: 0.9;">via ${paymentMethodText}</p>
        ${additionalMessage}
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
            <button onclick="window.location.href='library.html'" class="btn btn-primary" style="background: white; color: #27ae60; font-weight: 600; padding: 12px 24px;">
                <i class="fas fa-book-reader"></i> Open My Library
            </button>
            <button onclick="this.closest('.alert').remove()" class="btn btn-secondary" style="background: rgba(255,255,255,0.2); color: white; font-weight: 600; padding: 12px 24px;">
                <i class="fas fa-shopping-cart"></i> Continue Shopping
            </button>
        </div>
    `;

    document.body.appendChild(alert);

    // Auto-remove after 12 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => alert.remove(), 500);
        }
    }, 12000);
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
