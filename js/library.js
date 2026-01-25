// Import Firebase service
import firebaseService from './firebase-service.js';

// Load user's library
document.addEventListener('DOMContentLoaded', async function() {
    await syncPurchasesFromFirebase();
    await loadLibrary();
});

// Sync purchases from Firebase to localStorage
async function syncPurchasesFromFirebase() {
    try {
        // Get user identifier
        let userId = localStorage.getItem('lydistoriesUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('lydistoriesUserId', userId);
        }
        
        // Get purchases from Firebase
        const result = await firebaseService.getUserPurchases(userId);
        
        if (result.success && result.purchases.length > 0) {
            // Merge with local purchases
            const localPurchases = JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');
            const allPurchases = [...localPurchases];
            
            // Add Firebase purchases that aren't already local
            result.purchases.forEach(fbPurchase => {
                const exists = allPurchases.some(p => 
                    p.bookId == fbPurchase.bookId && p.userId === userId
                );
                if (!exists) {
                    allPurchases.push({
                        bookId: fbPurchase.bookId,
                        bookTitle: fbPurchase.bookTitle,
                        amount: fbPurchase.amount,
                        provider: fbPurchase.paymentMethod,
                        userId: userId,
                        timestamp: fbPurchase.purchasedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                    });
                }
            });
            
            // Save merged purchases
            localStorage.setItem('lydistoriesPurchases', JSON.stringify(allPurchases));
        }
    } catch (error) {
        console.log('Firebase sync not available:', error);
    }
}

async function loadLibrary() {
    const libraryContent = document.getElementById('libraryContent');
    libraryContent.innerHTML = '<p style="text-align: center; padding: 40px;">Loading your library...</p>';
    
    // Get user identifier
    let userId = localStorage.getItem('lydistoriesUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('lydistoriesUserId', userId);
    }
    
    // Load purchases from localStorage (already synced)
    const purchases = JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');

    if (purchases.length === 0) {
        libraryContent.innerHTML = `
            <div class="library-empty">
                <i class="fas fa-book"></i>
                <h2>Your Library is Empty</h2>
                <p>You haven't purchased any books yet. Browse our collection to get started!</p>
                <a href="order.html" class="btn btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }

    // Load books from Firebase
    const booksResult = await firebaseService.getAllBooks();
    const booksData = booksResult.success ? booksResult.books : window.booksData || [];

    // Get unique books (in case of duplicate purchases)
    const uniqueBooks = [];
    const bookIds = new Set();
    
    purchases.forEach(purchase => {
        if (!bookIds.has(purchase.bookId)) {
            bookIds.add(purchase.bookId);
            uniqueBooks.push(purchase);
        }
    });

    // Sort by purchase date (most recent first)
    uniqueBooks.sort((a, b) => {
        const dateA = a.purchasedAt ? a.purchasedAt.toDate() : new Date(a.timestamp);
        const dateB = b.purchasedAt ? b.purchasedAt.toDate() : new Date(b.timestamp);
        return dateB - dateA;
    });

    libraryContent.innerHTML = '<div class="library-books" id="libraryBooks"></div>';
    const libraryBooks = document.getElementById('libraryBooks');

    uniqueBooks.forEach(purchase => {
        const book = booksData.find(b => b.id == purchase.bookId);
        if (book) {
            const bookCard = createLibraryBookCard(book, purchase);
            libraryBooks.appendChild(bookCard);
        }
    });
}

function createLibraryBookCard(book, purchase) {
    const card = document.createElement('div');
    card.className = 'library-book-card';
    
    const purchaseDate = new Date(purchase.timestamp).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    card.innerHTML = `
        <div class="library-book-cover">
            <img src="${book.cover}" alt="${book.title}">
            <span class="owned-badge"><i class="fas fa-check-circle"></i></span>
        </div>
        <div class="library-book-details">
            <div class="library-book-header">
                <div>
                    <h3>${book.title}</h3>
                    <p class="library-author"><i class="fas fa-user"></i> ${book.author}</p>
                </div>
                <span class="library-category">${book.category}</span>
            </div>
            <p class="library-description">${book.description.substring(0, 120)}...</p>
            <div class="library-book-footer">
                <span class="library-purchase-date">
                    <i class="fas fa-calendar-check"></i> ${purchaseDate}
                </span>
                <button class="btn btn-primary library-read-btn" onclick="readBook(${book.id})">
                    <i class="fas fa-book-open"></i> Read
                </button>
            </div>
        </div>
    `;

    return card;
}

function readBook(bookId) {
    // Check if user has access (double-check)
    const purchases = JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');
    const hasAccess = purchases.some(purchase => purchase.bookId == bookId);
    
    if (!hasAccess) {
        alert('Access denied. Please purchase this book first.');
        return;
    }

    // Redirect to reader
    window.location.href = `reader.html?bookId=${bookId}`;
}

// Make readBook function globally accessible
window.readBook = readBook;
