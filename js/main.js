// Import Firebase service
import firebaseService from './firebase-service.js';

// Books data - loaded from Firebase
let booksData = [];

// Navigation toggle for mobile
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    const featuredBooksContainer = document.getElementById('featuredBooks');
    if (featuredBooksContainer) {
        featuredBooksContainer.innerHTML = '<p style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading featured content...</p>';
    }
    
    // Load from Firebase
    await syncWithFirebaseInBackground();
    
    // Check if there's a bookId in URL or sessionStorage (from preview redirect)
    checkForBookSelection();
    
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });
});

// Load all published content from Firebase
async function syncWithFirebaseInBackground() {
    const featuredBooksContainer = document.getElementById('featuredBooks');
    
    try {
        const result = await firebaseService.getAllContent();
        
        if (result.success) {
            // Only show published content (published === true or published is not explicitly false)
            const publishedContent = result.content.filter(c => c.published !== false);
            
            console.log('Total content from Firebase:', result.content.length);
            console.log('Published content:', publishedContent.length);
            
            booksData.length = 0;
            booksData.push(...publishedContent);
            
            // Display all published content
            if (featuredBooksContainer) {
                featuredBooksContainer.innerHTML = '';
                if (publishedContent.length > 0) {
                    loadAllContent();
                } else {
                    featuredBooksContainer.innerHTML = '<p style="text-align: center; padding: 40px;">No content available yet. Check back soon!</p>';
                }
            }
        } else {
            throw new Error(result.error || 'Failed to load content');
        }
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        if (featuredBooksContainer) {
            featuredBooksContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Error loading content. Please refresh the page.</p>';
        }
    }
}

// Check for book selection from URL or sessionStorage
function checkForBookSelection() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    
    // Check sessionStorage for book data from preview mode
    const selectedBookData = sessionStorage.getItem('selectedBook');
    
    if (selectedBookData) {
        try {
            const book = JSON.parse(selectedBookData);
            // Show the book modal and payment modal automatically
            setTimeout(() => {
                showBookModal(book);
                // Also show payment modal directly after a short delay
                setTimeout(() => {
                    showPaymentModal(book);
                }, 500);
            }, 100);
            // Clear the sessionStorage after use
            sessionStorage.removeItem('selectedBook');
            return;
        } catch (e) {
            console.error('Error parsing selected book data:', e);
        }
    }
    
    if (bookId && booksData.length > 0) {
        // Find the book in our data
        const book = booksData.find(b => b.id == bookId || b.id === bookId);
        
        if (book) {
            // Show the book modal automatically
            setTimeout(() => {
                showBookModal(book);
            }, 100);
        }
    }
}

// Load all content (not just first 6)
function loadAllContent() {
    const featuredBooksContainer = document.getElementById('featuredBooks');
    
    booksData.forEach(book => {
        const bookCard = createBookCard(book);
        featuredBooksContainer.appendChild(bookCard);
    });
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
        <div class="content-type-badge-overlay ${contentType}">
            <i class="fas ${typeIcon}"></i> ${typeLabel}
        </div>
        <div class="preview-badge-corner">
            <i class="fas fa-eye"></i> Preview
        </div>
        <img src="${book.cover}" alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3>${book.title}</h3>
            <p class="book-author"><i class="fas fa-user"></i> ${book.author}</p>
            <p class="book-description">${book.description.substring(0, 100)}...</p>
            <p class="book-price">${book.price.toLocaleString()} UGX</p>
            <span class="book-category">${book.category || book.subject || 'General'}</span>
        </div>
    `;

    card.addEventListener('click', () => {
        // Show modal with book details and options to preview or purchase
        showBookModal(book);
    });

    return card;
}

// Show book details modal
function showBookModal(book) {
    const modal = document.getElementById('bookModal');
    if (!modal) return;

    document.getElementById('modalBookCover').src = book.cover;
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = book.author;
    document.getElementById('modalBookCategory').textContent = book.category;
    document.getElementById('modalBookPrice').textContent = book.price.toLocaleString();
    document.getElementById('modalBookDescription').textContent = book.description;

    modal.style.display = 'block';

    // Store current book data for payment
    const purchaseBtn = document.getElementById('purchaseBtn');
    if (purchaseBtn) {
        purchaseBtn.onclick = () => {
            modal.style.display = 'none';
            showPaymentModal(book);
        };
    }
    
    // Add preview button functionality
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.onclick = () => {
            modal.style.display = 'none';
            window.location.href = `reader.html?bookId=${book.id}&preview=true`;
        };
    }
}

// Show payment modal
function showPaymentModal(book) {
    const paymentModal = document.getElementById('paymentModal');
    if (!paymentModal) return;

    document.getElementById('paymentBookTitle').textContent = book.title;
    document.getElementById('paymentAmount').textContent = book.price.toLocaleString();

    paymentModal.style.display = 'block';

    // Store book data for payment processing
    paymentModal.dataset.bookId = book.id;
    paymentModal.dataset.bookPrice = book.price;
    paymentModal.dataset.bookTitle = book.title;
}

// Close modals
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.close, .payment-close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Reset payment form
                const paymentForm = document.getElementById('paymentForm');
                if (paymentForm) {
                    paymentForm.style.display = 'none';
                    paymentForm.reset();
                }
                const paymentMethodsSelect = document.querySelector('.payment-methods-select');
                if (paymentMethodsSelect) {
                    paymentMethodsSelect.style.display = 'block';
                }
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            // Reset payment form
            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) {
                paymentForm.style.display = 'none';
                paymentForm.reset();
            }
            const paymentMethodsSelect = document.querySelector('.payment-methods-select');
            if (paymentMethodsSelect) {
                paymentMethodsSelect.style.display = 'block';
            }
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Add scroll animation to elements when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Animate sections on scroll
    const animatedElements = document.querySelectorAll('.book-card, .step, .payment-card, .feature-item, .contact-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        animateOnScroll.observe(el);
    });

    // Add parallax effect to hero section
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.pageYOffset;
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Add counter animation for stats if they exist
    const animateCounter = (element, target) => {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 20);
    };

    // Observe stat numbers
    const statNumbers = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target || entry.target.textContent);
                animateCounter(entry.target, target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => statObserver.observe(stat));

    // Create and add scroll-to-top button
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollBtn);

    // Show/hide scroll button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Page loader
    window.addEventListener('load', () => {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 500);
        }
    });
    
    // Setup search and filter functionality
    setupSearchAndFilters();
});

// Search and Filter Functionality
function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterBooks);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterBooks);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterBooks);
    }
}

function filterBooks() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    
    const filteredBooks = booksData.filter(book => {
        const matchesSearch = 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.description && book.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = categoryFilter === 'all' || 
            (book.category && book.category.toLowerCase() === categoryFilter.toLowerCase()) ||
            (book.subject && book.subject.toLowerCase() === categoryFilter.toLowerCase());
        
        const matchesType = typeFilter === 'all' || 
            (book.type && book.type.toLowerCase() === typeFilter.toLowerCase());
        
        return matchesSearch && matchesCategory && matchesType;
    });
    
    displayFilteredBooks(filteredBooks);
}

function displayFilteredBooks(books) {
    const featuredBooksContainer = document.getElementById('featuredBooks');
    if (!featuredBooksContainer) return;
    
    featuredBooksContainer.innerHTML = '';
    
    if (books.length === 0) {
        featuredBooksContainer.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1/-1;">No content found matching your search.</p>';
        return;
    }
    
    books.forEach(book => {
        const bookCard = createBookCard(book);
        featuredBooksContainer.appendChild(bookCard);
    });
}

// Export books data for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { booksData };
}
