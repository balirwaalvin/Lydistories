// Content Pages Handler (books.html, articles.html, guides.html)
import firebaseService from './firebase-service.js';

// Determine content type from current page
function getCurrentContentType() {
    const path = window.location.pathname;
    if (path.includes('books.html')) return 'book';
    if (path.includes('articles.html')) return 'article';
    if (path.includes('guides.html')) return 'guide';
    return 'book'; // default
}

// Load content on page load
document.addEventListener('DOMContentLoaded', async function() {
    const contentType = getCurrentContentType();
    
    // Load content immediately from local storage/code
    loadContentInstantly(contentType);
    
    // Then sync with Firebase in background
    syncWithFirebaseInBackground(contentType);
    
    setupSearch(contentType);
    setupCategoryFilter(contentType);
    setupMobileNav();
});

// Setup mobile navigation
function setupMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });
}

// Show loading state
function loadContentInstantly(contentType) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    // Show loading message
    booksGrid.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin"></i> Loading content...</p>';
    
    // Initialize with default content as fallback
    window.contentData = getDefaultContent(contentType);
}

// Load from Firebase (primary data source)
async function syncWithFirebaseInBackground(contentType) {
    try {
        const result = await firebaseService.getAllContent(contentType);
        
        if (result.success && result.content.length > 0) {
            const publishedContent = result.content.filter(c => c.published !== false);
            window.contentData = publishedContent;
            displayContent(window.contentData);
        } else {
            // No content found, show empty state
            displayContent([]);
        }
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1/-1; color: #e74c3c;">Error loading content. Please refresh the page.</p>';
        }
    }
}

// Display content in grid
function displayContent(contentArray) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    if (contentArray && contentArray.length > 0) {
        booksGrid.innerHTML = '';
        contentArray.forEach(item => {
            const card = createContentCard(item);
            booksGrid.appendChild(card);
        });
    } else {
        const contentType = getCurrentContentType();
        const typeName = contentType === 'book' ? 'books' : contentType === 'article' ? 'articles' : 'study guides';
        booksGrid.innerHTML = `<p style="text-align: center; padding: 40px; grid-column: 1/-1;">No ${typeName} available at the moment</p>`;
    }
}

// Create content card
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const contentType = item.type || 'book';
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
            <img src="${item.cover || item.coverImage || 'https://via.placeholder.com/400x600?text=No+Cover'}" alt="${item.title}">
            <div class="content-type-badge-overlay">
                <i class="fas ${typeIcon}"></i> ${typeLabel}
            </div>
        </div>
        <div class="book-info">
            <h3 class="book-title">${item.title}</h3>
            <p class="book-author">by ${item.author}</p>
            <p class="book-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
            <div class="book-footer">
                <span class="book-price">UGX ${item.price ? item.price.toLocaleString() : '0'}</span>
                <button class="btn btn-primary" onclick="viewContent('${item.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// View content details (redirect to order page)
window.viewContent = function(contentId) {
    window.location.href = `order.html?id=${contentId}`;
};

// Setup search functionality
function setupSearch(contentType) {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        let filteredContent = window.contentData || [];
        
        // Apply search filter
        if (searchTerm) {
            filteredContent = filteredContent.filter(item =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredContent = filteredContent.filter(item => item.category === categoryFilter);
        }
        
        displayContent(filteredContent);
    });
}

// Setup category filter
function setupCategoryFilter(contentType) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.addEventListener('change', function(e) {
        const category = e.target.value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        let filteredContent = window.contentData || [];
        
        // Apply category filter
        if (category !== 'all') {
            filteredContent = filteredContent.filter(item => item.category === category);
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredContent = filteredContent.filter(item =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.author.toLowerCase().includes(searchTerm)
            );
        }
        
        displayContent(filteredContent);
    });
}

// Get default content for each type
function getDefaultContent(contentType) {
    const defaultBooks = [
        {
            id: 1,
            type: 'book',
            title: "The Journey Home",
            author: "Sarah Mitchell",
            category: "fiction",
            price: 15000,
            cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
            description: "A captivating story about finding one's place in the world."
        },
        {
            id: 2,
            type: 'book',
            title: "Success Mindset",
            author: "David Okello",
            category: "self-help",
            price: 20000,
            cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop",
            description: "Transform your life with proven strategies for growth."
        }
    ];

    return defaultBooks.filter(item => item.type === contentType);
}
