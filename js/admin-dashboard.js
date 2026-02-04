// New Simplified Admin Dashboard
import firebaseService from './firebase-service.js';

let currentContentId = null;
let uploadedDocumentUrl = null;
let currentFilter = 'all';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllContent();
    await loadStats();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('contentForm').addEventListener('submit', handleContentSubmit);
    
    // Search
    document.getElementById('searchContent').addEventListener('input', handleSearch);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadAllContent();
        });
    });
}

// Load all content
async function loadAllContent() {
    try {
        const result = await firebaseService.getAllContent(currentFilter === 'all' ? null : currentFilter);
        
        if (result.success) {
            displayContentTable(result.content);
        } else {
            console.error('Error loading content:', result.error);
            showError('Failed to load content');
        }
    } catch (error) {
        console.error('Error loading content:', error);
        showError('Failed to load content');
    }
}

// Display content in table
function displayContentTable(content) {
    const tbody = document.getElementById('contentTableBody');
    
    if (content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-inbox"></i>
                    <p>No content found. Add your first content!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = content.map(item => `
        <tr>
            <td>
                <img src="${item.cover || item.coverImage || 'https://via.placeholder.com/60x90'}" 
                     alt="${item.title}" 
                     style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;">
            </td>
            <td><strong>${item.title}</strong></td>
            <td><span class="badge badge-${item.type}">${formatType(item.type)}</span></td>
            <td>${item.author}</td>
            <td>UGX ${(item.price || 0).toLocaleString()}</td>
            <td>
                ${item.published ? 
                    '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Published</span>' : 
                    '<span class="badge badge-warning"><i class="fas fa-clock"></i> Draft</span>'
                }
            </td>
            <td>
                <button onclick="editContent('${item.id}')" class="btn-icon" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContent('${item.id}')" class="btn-icon btn-danger" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load statistics
async function loadStats() {
    try {
        const result = await firebaseService.getAllContent();
        
        if (result.success) {
            const content = result.content;
            const published = content.filter(c => c.published === true);
            const drafts = content.filter(c => c.published !== true);
            
            document.getElementById('totalContent').textContent = content.length;
            document.getElementById('publishedContent').textContent = published.length;
            document.getElementById('draftContent').textContent = drafts.length;
        }
        
        // Load orders count
        const ordersResult = await firebaseService.getAllOrders();
        if (ordersResult.success) {
            document.getElementById('totalOrders').textContent = ordersResult.orders.length;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Open add content modal
window.openAddContentModal = function() {
    currentContentId = null;
    uploadedDocumentUrl = null;
    document.getElementById('contentForm').reset();
    document.getElementById('contentModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Content';
    document.getElementById('contentPublished').checked = true;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadSuccess').style.display = 'none';
    document.getElementById('contentModal').style.display = 'block';
};

// Close content modal
window.closeContentModal = function() {
    document.getElementById('contentModal').style.display = 'none';
};

// Update form fields based on content type
window.updateFormFields = function() {
    const contentType = document.getElementById('contentType').value;
    const categoryLabel = document.getElementById('categoryLabel');
    
    if (contentType === 'guide') {
        categoryLabel.textContent = 'Subject Area *';
    } else {
        categoryLabel.textContent = 'Category *';
    }
};

// Handle document upload
window.handleDocumentUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.includes('pdf')) {
        alert('Please upload a PDF file');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
    }
    
    // Show progress
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'block';
    
    try {
        const contentId = currentContentId || 'temp_' + Date.now();
        const contentType = document.getElementById('contentType').value;
        
        const result = await firebaseService.uploadDocument(file, contentId, contentType);
        
        if (result.success) {
            uploadedDocumentUrl = result.url;
            document.getElementById('uploadProgress').style.display = 'none';
            document.getElementById('uploadSuccess').style.display = 'block';
            document.getElementById('uploadedFileName').textContent = file.name;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        alert('Error uploading document: ' + error.message);
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadPlaceholder').style.display = 'block';
    }
};

// Handle content form submission
async function handleContentSubmit(e) {
    e.preventDefault();
    
    // Validate document upload
    if (!currentContentId && !uploadedDocumentUrl) {
        alert('Please upload a PDF document');
        return;
    }
    
    const contentData = {
        type: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value,
        author: document.getElementById('contentAuthor').value,
        category: document.getElementById('contentCategory').value,
        price: parseInt(document.getElementById('contentPrice').value),
        description: document.getElementById('contentDescription').value,
        cover: document.getElementById('contentCover').value,
        coverImage: document.getElementById('contentCover').value,
        published: document.getElementById('contentPublished').checked,
        format: 'pdf',
        documentUrl: uploadedDocumentUrl
    };
    
    try {
        let result;
        if (currentContentId) {
            result = await firebaseService.updateContent(currentContentId, contentData);
        } else {
            result = await firebaseService.addContent(contentData);
        }
        
        if (result.success) {
            alert(`Content ${currentContentId ? 'updated' : 'published'} successfully!`);
            closeContentModal();
            await loadAllContent();
            await loadStats();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Error saving content: ' + error.message);
    }
}

// Edit content
window.editContent = async function(contentId) {
    try {
        const result = await firebaseService.getContentById(contentId);
        
        if (result.success) {
            const content = result.content;
            currentContentId = contentId;
            uploadedDocumentUrl = content.documentUrl;
            
            document.getElementById('contentModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Content';
            document.getElementById('contentId').value = contentId;
            document.getElementById('contentType').value = content.type;
            document.getElementById('contentTitle').value = content.title;
            document.getElementById('contentAuthor').value = content.author;
            document.getElementById('contentCategory').value = content.category || '';
            document.getElementById('contentPrice').value = content.price;
            document.getElementById('contentDescription').value = content.description;
            document.getElementById('contentCover').value = content.cover || content.coverImage || '';
            document.getElementById('contentPublished').checked = content.published === true;
            
            if (content.documentUrl) {
                document.getElementById('uploadPlaceholder').style.display = 'none';
                document.getElementById('uploadSuccess').style.display = 'block';
                document.getElementById('uploadedFileName').textContent = content.title + '.pdf';
            }
            
            updateFormFields();
            document.getElementById('contentModal').style.display = 'block';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading content:', error);
        alert('Error loading content: ' + error.message);
    }
};

// Delete content
window.deleteContent = async function(contentId) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
        return;
    }
    
    try {
        const result = await firebaseService.deleteContent(contentId);
        
        if (result.success) {
            alert('Content deleted successfully!');
            await loadAllContent();
            await loadStats();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content: ' + error.message);
    }
};

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#contentTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Logout
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'admin-login.html';
    }
};

// Helper functions
function formatType(type) {
    const types = {
        'book': 'Book',
        'article': 'Article',
        'guide': 'Study Guide'
    };
    return types[type] || type;
}

function showError(message) {
    document.getElementById('contentTableBody').innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </td>
        </tr>
    `;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('contentModal');
    if (event.target === modal) {
        closeContentModal();
    }
};
