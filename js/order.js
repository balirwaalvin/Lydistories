// Import Firebase service
import firebaseService from './firebase-service.js';

// Load all books on order page
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllBooksFromFirebase();
    setupSearch();
    setupCategoryFilter();
    setupPaymentOptions();
    setupPaymentForm();
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
            
            // Store selected provider
            const provider = this.dataset.provider;
            paymentForm.dataset.provider = provider;
            
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
    const phoneNumber = document.getElementById('phoneNumber').value;
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const provider = document.getElementById('paymentForm').dataset.provider;
    
    const bookId = paymentModal.dataset.bookId;
    const bookPrice = paymentModal.dataset.bookPrice;
    const bookTitle = paymentModal.dataset.bookTitle;

    // Validate phone number format (Ugandan format)
    if (!validatePhoneNumber(phoneNumber)) {
        showAlert('Please enter a valid Ugandan phone number (e.g., 0772123456)', 'error');
        return;
    }

    // Show loading state
    const submitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    // Simulate payment processing
    // In a real implementation, this would call your backend API
    // which would integrate with MTN Mobile Money or Airtel Money APIs
    
    const paymentData = {
        bookId: bookId,
        bookTitle: bookTitle,
        amount: bookPrice,
        phoneNumber: phoneNumber,
        customerName: customerName,
        customerEmail: customerEmail,
        provider: provider,
        timestamp: new Date().toISOString()
    };

    // Simulate API call with timeout
    setTimeout(() => {
        // In production, check actual payment status from API
        const paymentSuccess = true; // Simulated success
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (paymentSuccess) {
            // Store purchase in localStorage (in production, this would be in a database)
            storePurchase(paymentData);
            
            // Close payment modal
            paymentModal.style.display = 'none';
            
            // Show success message with library link
            showSuccessWithLibraryLink(bookTitle, provider);
            
            // Reset form
            document.getElementById('paymentForm').reset();
            document.getElementById('paymentForm').style.display = 'none';
            document.querySelector('.payment-methods-select').style.display = 'block';
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
        } else {
            showAlert('Payment failed. Please try again or contact support.', 'error');
        }
    }, 2000);
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
function showSuccessWithLibraryLink(bookTitle, provider) {
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
    alert.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
        <h3 style="margin-bottom: 10px;">Payment Successful!</h3>
        <p style="margin-bottom: 15px;">You now have full access to "${bookTitle}"</p>
        <p style="font-size: 0.9rem; margin-bottom: 20px;">Check your ${provider === 'mtn' ? 'MTN' : 'Airtel'} phone for the payment confirmation.</p>
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
