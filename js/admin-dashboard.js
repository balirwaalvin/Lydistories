// Import Firebase service
import firebaseService from './firebase-service.js';

console.log('Admin dashboard script loaded');

// Check if admin is logged in
if (!sessionStorage.getItem('lydistoriesAdmin')) {
    console.log('Not authenticated, redirecting to login');
    window.location.href = 'admin-login.html';
}

let currentBookIdToDelete = null;
let currentEditingBookId = null;
let currentChapters = [];
let currentChapterIndex = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOMContentLoaded fired - starting initialization');
    try {
        console.log('Loading dashboard stats...');
        await loadDashboardStats();
        console.log('Loading books table...');
        await loadBooksTable();
        console.log('Loading orders table...');
        await loadOrdersTable();
        console.log('Loading messages...');
        await loadMessages();
        console.log('Loading writers room...');
        await loadWritersRoomBooks();
        console.log('Setting up navigation...');
        setupNavigation();
        console.log('Setting up form listeners...');
        setupFormListeners();
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading dashboard. Check console for details.');
    }
});

// Setup navigation
function setupNavigation() {
    const menuItems = document.querySelectorAll('.admin-menu li');
    console.log('Found menu items:', menuItems.length);
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Menu item clicked:', this.dataset.section);
            
            // Remove active class from all items
            menuItems.forEach(mi => mi.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const sectionName = this.dataset.section;
            const targetSection = document.getElementById(`${sectionName}-section`);
            console.log('Showing section:', sectionName, 'Element found:', !!targetSection);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    console.log('Navigation setup complete');
}

// Load dashboard statistics
async function loadDashboardStats() {
    // Load from Firebase
    const booksResult = await firebaseService.getAllBooks();
    const books = booksResult.success ? booksResult.books : JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(window.booksData || []));
    
    const purchasesResult = await firebaseService.getUserPurchases('guest'); // Get all purchases
    const purchases = purchasesResult.success ? purchasesResult.purchases : JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');
    
    const messagesResult = await firebaseService.getAllMessages();
    const messages = messagesResult.success ? messagesResult.messages : JSON.parse(localStorage.getItem('lydistoriesMessages') || '[]');
    
    document.getElementById('totalBooks').textContent = books.length;
    document.getElementById('totalOrders').textContent = purchases.length;
    
    const totalRevenue = purchases.reduce((sum, purchase) => sum + parseInt(purchase.amount || 0), 0);
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString();
    
    document.getElementById('totalMessages').textContent = messages.length;
    
    // Load recent orders
    loadRecentOrders(purchases);
}

// Load recent orders
function loadRecentOrders(purchases) {
    const recentOrders = document.getElementById('recentOrders');
    const recent = purchases.slice(-5).reverse();
    
    if (recent.length === 0) {
        recentOrders.innerHTML = '<p class="empty-state">No orders yet</p>';
        return;
    }
    
    recentOrders.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Book</th>
                    <th>Customer</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${recent.map(order => `
                    <tr>
                        <td>${new Date(order.timestamp).toLocaleDateString()}</td>
                        <td>${order.bookTitle}</td>
                        <td>${order.customerName}</td>
                        <td>${parseInt(order.amount).toLocaleString()} UGX</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load books table
async function loadBooksTable() {
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading books...</td></tr>';
    
    const result = await firebaseService.getAllBooks();
    const books = result.success ? result.books : JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(window.booksData || []));
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No books available</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.cover}" alt="${book.title}" class="book-cover-thumb"></td>
            <td>
                <strong>${book.title}</strong>
                ${!book.published ? '<br><span class="status-badge status-pending" style="font-size: 0.75rem;">Draft</span>' : ''}
            </td>
            <td>${book.author}</td>
            <td><span class="book-category">${book.category}</span></td>
            <td><strong>${parseInt(book.price).toLocaleString()}</strong></td>
            <td>
                <button onclick="editBook('${book.id}')" class="action-btn btn-edit">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="showDeleteModal('${book.id}')" class="action-btn btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Show add book modal
function showAddBookModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-book"></i> Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('bookPublished').checked = true;
    currentEditingBookId = null;
    currentChapters = [];
    
    // Reset cover upload UI
    resetCoverUploadUI();
    switchCoverTab('url');
    
    document.getElementById('bookModal').style.display = 'block';
}

// Switch between URL and Upload tabs
function switchCoverTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.upload-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.upload-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Clear the other input
    if (tab === 'url') {
        resetCoverUploadUI();
    } else {
        document.getElementById('bookCover').value = '';
    }
}

// Handle cover image selection
async function handleCoverImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.querySelector('.file-upload-label').style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // Upload to Firebase Storage
    await uploadCoverToFirebase(file);
}

// Upload cover image to Firebase Storage
async function uploadCoverToFirebase(file) {
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    
    progressDiv.style.display = 'block';
    progressText.textContent = 'Uploading...';
    
    // Generate unique filename
    const bookId = document.getElementById('bookId').value || Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `book-covers/${bookId}_${Date.now()}.${fileExtension}`;
    
    try {
        // Simulate upload progress (since Firebase doesn't provide progress easily)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 100);
        
        // Upload to Firebase
        const result = await firebaseService.uploadBookCover(file, bookId);
        
        clearInterval(progressInterval);
        
        if (result.success) {
            progressFill.style.width = '100%';
            progressText.textContent = 'Upload complete!';
            
            // Store the URL in a hidden field
            document.getElementById('bookCover').value = result.url;
            
            setTimeout(() => {
                progressDiv.style.display = 'none';
                progressFill.style.width = '0%';
            }, 1000);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressText.textContent = 'Upload failed. Please try again.';
        progressText.style.color = '#e74c3c';
        
        setTimeout(() => {
            resetCoverUploadUI();
        }, 2000);
    }
}

// Remove cover image
function removeCoverImage() {
    resetCoverUploadUI();
    document.getElementById('bookCover').value = '';
}

// Reset cover upload UI
function resetCoverUploadUI() {
    document.getElementById('bookCoverFile').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.querySelector('.file-upload-label').style.display = 'flex';
    document.getElementById('progressBarFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Uploading...';
    document.getElementById('progressText').style.color = '#666';
    document.getElementById('fileLabel').textContent = 'Choose image or drag & drop';
}


// Edit book
function editBook(bookId) {
    const books = JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(booksData));
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Book';
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookCategory').value = book.category;
    document.getElementById('bookPrice').value = book.price;
    document.getElementById('bookCover').value = book.cover;
    document.getElementById('bookDescription').value = book.description;
    document.getElementById('bookPublished').checked = book.published !== false;
    
    currentEditingBookId = bookId;
    
    // Reset cover upload UI and show URL tab with existing cover
    resetCoverUploadUI();
    switchCoverTab('url');
    
    // Load chapters if they exist
    const bookContent = JSON.parse(localStorage.getItem('lydistoriesBookContent') || '{}');
    currentChapters = bookContent[bookId]?.chapters || [];
    
    document.getElementById('bookModal').style.display = 'block';
}

// Setup form listeners
function setupFormListeners() {
    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', handleBookFormSubmit);
    }
}

// Handle book form submission
async function handleBookFormSubmit(e) {
    e.preventDefault();
    
    // Validate that we have a cover image
    const coverUrl = document.getElementById('bookCover').value;
    if (!coverUrl) {
        alert('Please provide a cover image (either URL or upload an image)');
        return;
    }
    
    const bookId = document.getElementById('bookId').value;
    const newId = bookId ? parseInt(bookId) : Date.now();
    const bookData = {
        id: newId,
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        category: document.getElementById('bookCategory').value,
        price: parseInt(document.getElementById('bookPrice').value),
        cover: coverUrl,
        description: document.getElementById('bookDescription').value,
        published: document.getElementById('bookPublished').checked
    };
    
    let books = JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(window.booksData || []));
    
    if (bookId) {
        // Update existing book
        const index = books.findIndex(b => b.id === parseInt(bookId));
        if (index !== -1) {
            books[index] = bookData;
        }
        
        // Update in Firebase
        await firebaseService.updateBook(bookId, bookData);
    } else {
        // Add new book
        books.push(bookData);
        // Update the hidden field with the new ID so chapters can be edited
        document.getElementById('bookId').value = newId;
        currentEditingBookId = newId;
        
        // Add to Firebase
        await firebaseService.addBook(bookData);
    }
    
    // Save to localStorage
    localStorage.setItem('lydistoriesBooks', JSON.stringify(books));
    
    // Save chapters if any
    if (currentChapters.length > 0) {
        const bookContent = JSON.parse(localStorage.getItem('lydistoriesBookContent') || '{}');
        bookContent[newId] = { chapters: currentChapters };
        localStorage.setItem('lydistoriesBookContent', JSON.stringify(bookContent));
    }
    
    // Update global booksData if it exists (only published books)
    if (window.booksData) {
        window.booksData.length = 0;
        window.booksData.push(...books.filter(b => b.published !== false));
    }
    
    // Reload tables
    await loadBooksTable();
    await loadDashboardStats();
    await loadWritersRoomBooks();
    
    // Don't close modal, show success message
    const status = bookData.published ? 'published' : 'saved as draft';
    showAlert(bookId ? `Book updated and ${status}! You can now edit chapters.` : `Book ${status}! You can now edit chapters.`, 'success');
}

// Show delete modal
function showDeleteModal(bookId) {
    currentBookIdToDelete = bookId;
    document.getElementById('deleteModal').style.display = 'block';
}

// Confirm delete
async function confirmDelete() {
    if (!currentBookIdToDelete) return;
    
    let books = JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(window.booksData || []));
    books = books.filter(b => b.id !== currentBookIdToDelete);
    
    // Delete from Firebase
    await firebaseService.deleteBook(currentBookIdToDelete);
    
    // Save to localStorage
    localStorage.setItem('lydistoriesBooks', JSON.stringify(books));
    
    // Update global booksData
    if (window.booksData) {
        window.booksData.length = 0;
        window.booksData.push(...books);
    }
    
    // Reload tables
    await loadBooksTable();
    await loadDashboardStats();
    await loadWritersRoomBooks();
    
    // Close modal
    closeDeleteModal();
    
    // Show success message
    showAlert('Book deleted successfully!', 'success');
}

// Close modals
function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
    currentEditingBookId = null;
    currentChapters = [];
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentBookIdToDelete = null;
}

// Chapter Editor Functions
function openChapterEditor() {
    // Get current book ID
    let bookId = document.getElementById('bookId').value;
    
    if (!bookId) {
        alert('Please save the book details first before editing chapters');
        return;
    }
    
    currentEditingBookId = parseInt(bookId);
    
    // Load chapters
    const bookContent = JSON.parse(localStorage.getItem('lydistoriesBookContent') || '{}');
    currentChapters = bookContent[bookId]?.chapters || [];
    
    // Show modal
    document.getElementById('chapterModal').style.display = 'block';
    
    // Load chapters list
    loadChaptersList();
    
    // Reset editor
    document.getElementById('chapterEditorPlaceholder').style.display = 'flex';
    document.getElementById('chapterEditor').style.display = 'none';
    currentChapterIndex = null;
}

function closeChapterModal() {
    document.getElementById('chapterModal').style.display = 'none';
    currentChapterIndex = null;
}

// Convert HTML to plain text for editing
function htmlToPlainText(html) {
    if (!html) return '';
    
    let text = html;
    
    // Convert HTML tags to plain text formatting
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n## $1\n\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n### $1\n\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n#### $1\n\n');
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<[^>]+>/g, ''); // Remove any remaining HTML tags
    text = text.replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines with double
    
    return text.trim();
}

// Convert plain text to HTML for storage and display
function plainTextToHtml(text) {
    if (!text) return '';
    
    let html = text;
    
    // Convert markdown-style formatting to HTML
    html = html.replace(/## (.*?)(\n|$)/g, '<h1>$1</h1>\n');
    html = html.replace(/### (.*?)(\n|$)/g, '<h2>$1</h2>\n');
    html = html.replace(/#### (.*?)(\n|$)/g, '<h3>$1</h3>\n');
    
    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert paragraphs - split by double newlines
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        // Don't wrap if already has HTML tags
        if (para.match(/^<(h1|h2|h3|div)/i)) {
            return para;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
}

function loadChaptersList() {
    const chaptersList = document.getElementById('chaptersList');
    
    if (currentChapters.length === 0) {
        chaptersList.innerHTML = '<li style="text-align: center; color: #999; padding: 30px;">No chapters yet. Click "Add Chapter" to create one.</li>';
        return;
    }
    
    chaptersList.innerHTML = currentChapters.map((chapter, index) => `
        <li onclick="loadChapterEditor(${index})" class="${currentChapterIndex === index ? 'active' : ''}">
            <i class="fas fa-book-open"></i>
            <span>${chapter.title || `Chapter ${index + 1}`}</span>
        </li>
    `).join('');
}

function addNewChapter() {
    const newChapter = {
        id: Date.now(),
        title: `Chapter ${currentChapters.length + 1}`,
        content: 'Start writing your chapter here...'
    };
    
    currentChapters.push(newChapter);
    loadChaptersList();
    loadChapterEditor(currentChapters.length - 1);
}

function loadChapterEditor(index) {
    currentChapterIndex = index;
    const chapter = currentChapters[index];
    
    document.getElementById('chapterEditorPlaceholder').style.display = 'none';
    document.getElementById('chapterEditor').style.display = 'block';
    
    document.getElementById('chapterTitle').value = chapter.title;
    // Convert HTML to plain text for editing
    document.getElementById('chapterContent').value = htmlToPlainText(chapter.content);
    
    loadChaptersList();
}

function saveCurrentChapter() {
    if (currentChapterIndex === null) return;
    
    currentChapters[currentChapterIndex].title = document.getElementById('chapterTitle').value;
    // Convert plain text to HTML for storage
    currentChapters[currentChapterIndex].content = plainTextToHtml(document.getElementById('chapterContent').value);
    
    loadChaptersList();
    showAlert('Chapter saved!', 'success');
}

function deleteCurrentChapter() {
    if (currentChapterIndex === null) return;
    
    if (confirm('Are you sure you want to delete this chapter?')) {
        currentChapters.splice(currentChapterIndex, 1);
        
        document.getElementById('chapterEditorPlaceholder').style.display = 'flex';
        document.getElementById('chapterEditor').style.display = 'none';
        currentChapterIndex = null;
        
        loadChaptersList();
        showAlert('Chapter deleted!', 'success');
    }
}

function saveAllChapters() {
    // Save current chapter if editing
    if (currentChapterIndex !== null) {
        saveCurrentChapter();
    }
    
    // Save to localStorage
    const bookContent = JSON.parse(localStorage.getItem('lydistoriesBookContent') || '{}');
    bookContent[currentEditingBookId] = { chapters: currentChapters };
    localStorage.setItem('lydistoriesBookContent', JSON.stringify(bookContent));
    
    // Refresh Writers Room
    loadWritersRoomBooks();
    
    closeChapterModal();
    showAlert('All chapters saved successfully!', 'success');
}

function insertFormatting(type) {
    const textarea = document.getElementById('chapterContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || 'Your text here';
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    let newText = '';
    let prefix = '';
    let suffix = '';
    
    switch(type) {
        case 'h1':
            prefix = '\n\n## ';
            suffix = '\n\n';
            newText = prefix + selectedText + suffix;
            break;
        case 'h2':
            prefix = '\n\n### ';
            suffix = '\n\n';
            newText = prefix + selectedText + suffix;
            break;
        case 'p':
            prefix = '\n\n';
            suffix = '\n\n';
            newText = prefix + selectedText + suffix;
            break;
        case 'bold':
            newText = `**${selectedText}**`;
            break;
        case 'italic':
            newText = `*${selectedText}*`;
            break;
    }
    
    textarea.value = before + newText + after;
    textarea.focus();
    textarea.setSelectionRange(start, start + newText.length);
}

// Load orders table
// Load orders table
async function loadOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading orders...</td></tr>';
    
    // Try to load from Firebase first
    const result = await firebaseService.getUserPurchases('guest');
    const purchases = result.success ? result.purchases : JSON.parse(localStorage.getItem('lydistoriesPurchases') || '[]');
    
    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.reverse().map(order => {
        const orderDate = order.purchasedAt ? order.purchasedAt.toDate() : new Date(order.timestamp);
        return `
        <tr>
            <td>${orderDate.toLocaleDateString('en-GB')}</td>
            <td>${order.bookTitle}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${order.phoneNumber || 'N/A'}</td>
            <td><strong>${parseInt(order.amount).toLocaleString()}</strong></td>
            <td><span class="book-category">${(order.provider || order.paymentMethod || 'N/A').toUpperCase()}</span></td>
            <td><span class="status-badge status-completed">Completed</span></td>
        </tr>
    `}).join('');
}

// Load messages
async function loadMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading messages...</p>';
    
    // Try to load from Firebase first
    const result = await firebaseService.getAllMessages();
    const messages = result.success ? result.messages : JSON.parse(localStorage.getItem('lydistoriesMessages') || '[]');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Messages</h3>
                <p>You haven't received any messages yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.reverse().map(msg => {
        const msgDate = msg.createdAt ? msg.createdAt.toDate() : new Date(msg.timestamp);
        return `
        <div class="message-card">
            <div class="message-header">
                <div class="message-info">
                    <h3>${msg.name}</h3>
                    <div class="message-meta">
                        <span><i class="fas fa-envelope"></i> ${msg.email}</span>
                        <span><i class="fas fa-phone"></i> ${msg.phone}</span>
                    </div>
                </div>
                <div class="message-date">
                    ${msgDate.toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>
            <div class="message-subject">
                <strong>Subject:</strong> ${msg.subject}
            </div>
            <div class="message-body">
                ${msg.message}
            </div>
        </div>
    `}).join('');
}

// Logout
function logout() {
    sessionStorage.removeItem('lydistoriesAdmin');
    sessionStorage.removeItem('adminUsername');
    window.location.href = 'admin-login.html';
}

// Alert function
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Writers Room Functions
function loadWritersRoomBooks() {
    const books = JSON.parse(localStorage.getItem('lydistoriesBooks') || JSON.stringify(booksData));
    const bookContent = JSON.parse(localStorage.getItem('lydistoriesBookContent') || '{}');
    const container = document.getElementById('writersBooksList');
    
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No books available. Add a book from the Manage Books section first.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => {
        const chapters = bookContent[book.id]?.chapters || [];
        const publishStatus = book.published ? 'Published' : 'Draft';
        const statusColor = book.published ? 'var(--success-color)' : '#f39c12';
        
        return `
            <div class="writer-book-card" onclick="openWritersChapterEditor(${book.id})">
                <img src="${book.cover}" alt="${book.title}" class="writer-book-cover">
                <div class="writer-book-info">
                    <h3>${book.title}</h3>
                    <p><i class="fas fa-user"></i> ${book.author}</p>
                    <p><i class="fas fa-tag"></i> ${book.category}</p>
                    <div class="writer-book-stats">
                        <span>
                            <i class="fas fa-book-open"></i>
                            ${chapters.length} Chapter${chapters.length !== 1 ? 's' : ''}
                        </span>
                        <span style="color: ${statusColor};">
                            <i class="fas fa-circle" style="font-size: 0.5rem;"></i>
                            ${publishStatus}
                        </span>
                    </div>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); openWritersChapterEditor(${book.id})">
                        <i class="fas fa-pen"></i> Write Chapters
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openWritersChapterEditor(bookId) {
    // Same as openChapterEditor but optimized for writers room
    openChapterEditor(bookId);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Make functions globally accessible for onclick handlers
window.logout = logout;
window.editBook = editBook;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.showAddBookModal = showAddBookModal;
window.closeBookModal = closeBookModal;
window.openChapterEditor = openChapterEditor;
window.closeChapterModal = closeChapterModal;
window.addNewChapter = addNewChapter;
window.saveCurrentChapter = saveCurrentChapter;
window.deleteCurrentChapter = deleteCurrentChapter;
window.saveAllChapters = saveAllChapters;
window.insertFormatting = insertFormatting;
window.loadChapterEditor = loadChapterEditor;
window.openWritersChapterEditor = openWritersChapterEditor;
window.loadWritersRoomBooks = loadWritersRoomBooks;
window.switchCoverTab = switchCoverTab;
window.handleCoverImageSelect = handleCoverImageSelect;
window.removeCoverImage = removeCoverImage;
