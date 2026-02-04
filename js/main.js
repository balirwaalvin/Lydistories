// Import Firebase service
import firebaseService from './firebase-service.js';

// Sample books data
let booksData = [
    {
        id: 1,
        title: "The Journey Home",
        author: "Sarah Mitchell",
        category: "fiction",
        price: 15000,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
        description: "A captivating story about finding one's place in the world. Follow Emma as she embarks on a journey of self-discovery across the beautiful landscapes of Uganda."
    },
    {
        id: 2,
        title: "Success Mindset",
        author: "David Okello",
        category: "self-help",
        price: 20000,
        cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop",
        description: "Transform your life with proven strategies for personal and professional growth. Learn from Uganda's top entrepreneurs and thought leaders."
    },
    {
        id: 3,
        title: "Love in Kampala",
        author: "Grace Namukasa",
        category: "romance",
        price: 18000,
        cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
        description: "A heartwarming romance set in the bustling streets of Kampala. Experience the magic of love in modern Uganda."
    },
    {
        id: 4,
        title: "Mystery of the Pearl",
        author: "James Mugisha",
        category: "mystery",
        price: 17000,
        cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
        description: "An intriguing mystery that unfolds along the shores of Lake Victoria. Detective Kato must solve the case before time runs out."
    },
    {
        id: 5,
        title: "African Tales",
        author: "Mary Nansubuga",
        category: "fiction",
        price: 16000,
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
        description: "A collection of inspiring stories from across Africa, celebrating our rich heritage and diverse cultures."
    },
    {
        id: 6,
        title: "Business Excellence",
        author: "Peter Ssemakula",
        category: "non-fiction",
        price: 25000,
        cover: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=600&fit=crop",
        description: "A comprehensive guide to building and scaling your business in East Africa. Practical insights from successful entrepreneurs."
    },
    {
        id: 7,
        title: "The Hidden Truth",
        author: "Rebecca Nakato",
        category: "mystery",
        price: 19000,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
        description: "Secrets buried deep in the past come to light in this gripping mystery thriller. Nothing is as it seems."
    },
    {
        id: 8,
        title: "Finding Purpose",
        author: "Moses Kisakye",
        category: "self-help",
        price: 22000,
        cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
        description: "Discover your true calling and live a life of meaning. Practical exercises and inspirational stories to guide your journey."
    }
];

// Navigation toggle for mobile
document.addEventListener('DOMContentLoaded', async function() {
    // Load books from localStorage if available
    const storedBooks = localStorage.getItem('lydistoriesBooks');
    if (storedBooks) {
        booksData.length = 0;
        // Only load published books for public view
        const allBooks = JSON.parse(storedBooks);
        booksData.push(...allBooks.filter(b => b.published !== false));
    } else {
        // Save default books to localStorage
        localStorage.setItem('lydistoriesBooks', JSON.stringify(booksData));
    }
    
    // Load featured books immediately
    const featuredBooksContainer = document.getElementById('featuredBooks');
    if (featuredBooksContainer) {
        loadFeaturedBooks();
    }
    
    // Sync with Firebase in background
    syncWithFirebaseInBackground();
    
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

// Sync with Firebase in background
async function syncWithFirebaseInBackground() {
    try {
        const result = await firebaseService.getAllContent();
        
        if (result.success && result.content.length > 0) {
            const publishedContent = result.content.filter(c => c.published !== false);
            
            // Update localStorage
            localStorage.setItem('lydistoriesBooks', JSON.stringify(publishedContent));
            
            // Update booksData
            booksData.length = 0;
            booksData.push(...publishedContent);
            
            // Refresh featured books if on home page
            const featuredBooksContainer = document.getElementById('featuredBooks');
            if (featuredBooksContainer && publishedContent.length > 0) {
                featuredBooksContainer.innerHTML = '';
                loadFeaturedBooks();
            }
        }
    } catch (error) {
        console.error('Error syncing with Firebase:', error);
    }
}

// Load featured books (first 6)
function loadFeaturedBooks() {
    const featuredBooksContainer = document.getElementById('featuredBooks');
    const featuredBooks = booksData.slice(0, 6);

    featuredBooks.forEach(book => {
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
            window.location.href = `reader.html?bookId=${book.id}`;
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
});

// Export books data for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { booksData };
}
