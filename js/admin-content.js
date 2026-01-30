// Content Management Module for Admin Dashboard
import firebaseService from './firebase-service.js';

let currentContentId = null;
let uploadedDocumentUrl = null;
let uploadedCoverUrl = null;
let currentContentFilter = 'all';

// ============ Content Loading ============

// Load all content
export async function loadAllContent(filterType = 'all') {
    try {
        currentContentFilter = filterType;
        const result = await firebaseService.getAllContent(filterType === 'all' ? null : filterType);
        
        if (result.success) {
            displayContentTable(result.content);
            updateContentStats(result.content);
        } else {
            console.error('Error loading content:', result.error);
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Display content in table
function displayContentTable(content) {
    const tbody = document.getElementById('contentTableBody');
    if (!tbody) return;

    if (content.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No content found. Add your first content!</td></tr>';
        return;
    }

    tbody.innerHTML = content.map(item => `
        <tr>
            <td><img src="${item.cover || 'https://via.placeholder.com/60x90'}" alt="${item.title}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 5px;"></td>
            <td><strong>${item.title}</strong></td>
            <td><span class="content-type-badge ${item.type}">${item.type.toUpperCase()}</span></td>
            <td>${item.author}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${formatPrice(item.price)}</td>
            <td><span class="format-badge ${item.format}">${formatBadge(item.format)}</span></td>
            <td>
                <button onclick="window.editContent('${item.id}')" class="btn btn-sm btn-secondary" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="window.deleteContent('${item.id}')" class="btn btn-sm btn-danger" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ${item.format === 'chapters' ? `
                <button onclick="window.openWritersRoom('${item.id}')" class="btn btn-sm btn-primary" title="Edit Chapters">
                    <i class="fas fa-pen"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Update content statistics
function updateContentStats(content) {
    const books = content.filter(c => c.type === 'book').length;
    const articles = content.filter(c => c.type === 'article').length;
    const guides = content.filter(c => c.type === 'guide').length;

    document.getElementById('totalBooks').textContent = books;
    document.getElementById('totalArticles').textContent = articles;
    document.getElementById('totalGuides').textContent = guides;
}

// Load content by type for specific sections
export async function loadContentByType(type) {
    try {
        const result = await firebaseService.getAllContent(type);
        
        if (result.success) {
            const tableBodyId = `${type}sTableBody`;
            const tbody = document.getElementById(tableBodyId);
            
            if (tbody) {
                if (result.content.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No ${type}s found. Add your first ${type}!</td></tr>`;
                } else {
                    tbody.innerHTML = result.content.map(item => `
                        <tr>
                            <td><img src="${item.cover || 'https://via.placeholder.com/60x90'}" alt="${item.title}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 5px;"></td>
                            <td><strong>${item.title}</strong></td>
                            <td>${item.author}</td>
                            <td>${item.category || item.subject || 'N/A'}</td>
                            <td>${formatPrice(item.price)}</td>
                            <td><span class="format-badge ${item.format}">${formatBadge(item.format)}</span></td>
                            <td>
                                <button onclick="window.editContent('${item.id}')" class="btn btn-sm btn-secondary" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="window.deleteContent('${item.id}')" class="btn btn-sm btn-danger" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${item.format === 'chapters' ? `
                                <button onclick="window.openWritersRoom('${item.id}')" class="btn btn-sm btn-primary" title="Edit Chapters">
                                    <i class="fas fa-pen"></i>
                                </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error(`Error loading ${type}s:`, error);
    }
}

// ============ Modal Functions ============

// Show add content modal
export function showAddContentModal(defaultType = null) {
    const modal = document.getElementById('contentModal');
    const form = document.getElementById('contentForm');
    
    form.reset();
    currentContentId = null;
    uploadedDocumentUrl = null;
    uploadedCoverUrl = null;
    
    document.getElementById('contentModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Content';
    
    if (defaultType) {
        document.getElementById('contentType').value = defaultType;
        updateContentFormFields();
    }
    
    modal.style.display = 'block';
}

// Close content modal
export function closeContentModal() {
    document.getElementById('contentModal').style.display = 'none';
}

// Edit content
export async function editContent(contentId) {
    try {
        const result = await firebaseService.getContentById(contentId);
        
        if (result.success) {
            const content = result.content;
            currentContentId = contentId;
            
            document.getElementById('contentModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Content';
            document.getElementById('contentId').value = contentId;
            document.getElementById('contentType').value = content.type;
            document.getElementById('contentTitle').value = content.title;
            document.getElementById('contentAuthor').value = content.author;
            document.getElementById('contentCategory').value = content.category || '';
            document.getElementById('contentPrice').value = content.price;
            document.getElementById('contentFormat').value = content.format;
            document.getElementById('contentCover').value = content.cover || '';
            document.getElementById('contentDescription').value = content.description;
            document.getElementById('contentPublished').checked = content.published !== false;
            
            if (content.type === 'guide') {
                document.getElementById('guideLevel').value = content.level || '';
                document.getElementById('guideSubject').value = content.subject || '';
            }
            
            if (content.documentUrl) {
                uploadedDocumentUrl = content.documentUrl;
                showDocumentInfo(content.documentName || 'Document', content.documentSize || 0);
            }
            
            updateContentFormFields();
            updateFormatFields();
            
            document.getElementById('contentModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading content:', error);
        alert('Error loading content');
    }
}

// Delete content
export async function deleteContent(contentId) {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
        const result = await firebaseService.deleteContent(contentId);
        
        if (result.success) {
            alert('Content deleted successfully!');
            loadAllContent(currentContentFilter);
            loadContentByType('book');
            loadContentByType('article');
            loadContentByType('guide');
        } else {
            alert('Error deleting content: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content');
    }
}

// ============ Form Handlers ============

// Update form fields based on content type
export function updateContentFormFields() {
    const contentType = document.getElementById('contentType').value;
    const guideFields = document.getElementById('guideFields');
    const categoryLabel = document.getElementById('categoryLabel');
    
    if (contentType === 'guide') {
        guideFields.style.display = 'block';
        categoryLabel.textContent = 'Subject Area *';
    } else {
        guideFields.style.display = 'none';
        categoryLabel.textContent = 'Category *';
    }
}

// Update format fields
export function updateFormatFields() {
    const format = document.getElementById('contentFormat').value;
    const docSection = document.getElementById('documentUploadSection');
    
    if (format === 'pdf' || format === 'document') {
        docSection.style.display = 'block';
    } else {
        docSection.style.display = 'none';
    }
}

// Handle content form submission
export async function handleContentFormSubmit(e) {
    e.preventDefault();
    
    const contentData = {
        type: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value,
        author: document.getElementById('contentAuthor').value,
        category: document.getElementById('contentCategory').value,
        price: parseInt(document.getElementById('contentPrice').value),
        format: document.getElementById('contentFormat').value,
        cover: uploadedCoverUrl || document.getElementById('contentCover').value,
        description: document.getElementById('contentDescription').value,
        published: document.getElementById('contentPublished').checked
    };
    
    // Add document URL if uploaded
    if (uploadedDocumentUrl) {
        contentData.documentUrl = uploadedDocumentUrl;
    }
    
    // Add study guide specific fields
    if (contentData.type === 'guide') {
        contentData.level = document.getElementById('guideLevel').value;
        contentData.subject = document.getElementById('guideSubject').value;
    }
    
    try {
        let result;
        if (currentContentId) {
            result = await firebaseService.updateContent(currentContentId, contentData);
        } else {
            result = await firebaseService.addContent(contentData);
        }
        
        if (result.success) {
            alert(`Content ${currentContentId ? 'updated' : 'added'} successfully!`);
            closeContentModal();
            loadAllContent(currentContentFilter);
            loadContentByType(contentData.type);
        } else {
            alert('Error saving content: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Error saving content');
    }
}

// ============ File Upload Handlers ============

// Handle document upload
export async function handleDocumentSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
    }
    
    showDocumentUploadProgress();
    
    try {
        const contentId = currentContentId || 'temp_' + Date.now();
        const contentType = document.getElementById('contentType').value || 'document';
        
        const result = await firebaseService.uploadDocument(file, contentId, contentType);
        
        if (result.success) {
            uploadedDocumentUrl = result.url;
            showDocumentInfo(result.fileName, result.fileSize);
        } else {
            alert('Error uploading document: ' + result.error);
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        alert('Error uploading document');
    } finally {
        hideDocumentUploadProgress();
    }
}

// Handle content cover image upload
export async function handleContentCoverSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showContentUploadProgress();
    
    try {
        const contentId = currentContentId || 'temp_' + Date.now();
        const result = await firebaseService.uploadCoverImage(file, contentId);
        
        if (result.success) {
            uploadedCoverUrl = result.url;
            showContentImagePreview(result.url);
        } else {
            alert('Error uploading image: ' + result.error);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image');
    } finally {
        hideContentUploadProgress();
    }
}

// ============ UI Helper Functions ============

function showDocumentUploadProgress() {
    document.getElementById('docUploadProgress').style.display = 'block';
}

function hideDocumentUploadProgress() {
    document.getElementById('docUploadProgress').style.display = 'none';
}

function showDocumentInfo(fileName, fileSize) {
    const docInfo = document.getElementById('documentInfo');
    document.getElementById('docFileName').textContent = fileName;
    document.getElementById('docFileSize').textContent = formatFileSize(fileSize);
    docInfo.style.display = 'flex';
    document.getElementById('documentUploadSection').querySelector('.file-upload-label').style.display = 'none';
}

export function removeDocument() {
    uploadedDocumentUrl = null;
    document.getElementById('documentInfo').style.display = 'none';
    document.getElementById('documentUploadSection').querySelector('.file-upload-label').style.display = 'flex';
    document.getElementById('contentDocument').value = '';
}

function showContentUploadProgress() {
    document.getElementById('contentUploadProgress').style.display = 'block';
}

function hideContentUploadProgress() {
    document.getElementById('contentUploadProgress').style.display = 'none';
}

function showContentImagePreview(url) {
    document.getElementById('contentPreviewImg').src = url;
    document.getElementById('contentImagePreview').style.display = 'block';
    document.getElementById('contentUploadTab').querySelector('.file-upload-label').style.display = 'none';
}

export function removeContentCover() {
    uploadedCoverUrl = null;
    document.getElementById('contentImagePreview').style.display = 'none';
    document.getElementById('contentUploadTab').querySelector('.file-upload-label').style.display = 'flex';
    document.getElementById('contentCoverFile').value = '';
}

export function switchContentCoverTab(tab) {
    const urlTab = document.getElementById('contentUrlTab');
    const uploadTab = document.getElementById('contentUploadTab');
    const tabs = document.querySelectorAll('#contentModal .upload-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    event.target.closest('.upload-tab').classList.add('active');
    
    if (tab === 'url') {
        urlTab.classList.add('active');
        uploadTab.classList.remove('active');
    } else {
        urlTab.classList.remove('active');
        uploadTab.classList.add('active');
    }
}

// ============ Utility Functions ============

function formatPrice(price) {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0
    }).format(price);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatBadge(format) {
    const badges = {
        'chapters': 'Chapters',
        'pdf': 'PDF',
        'document': 'Document'
    };
    return badges[format] || format;
}

// ============ Filter Tab Handler ============

export function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            loadAllContent(filter);
        });
    });
}

// Export functions to window for onclick handlers
window.editContent = editContent;
window.deleteContent = deleteContent;
window.updateContentFormFields = updateContentFormFields;
window.updateFormatFields = updateFormatFields;
window.handleDocumentSelect = handleDocumentSelect;
window.handleContentCoverSelect = handleContentCoverSelect;
window.removeDocument = removeDocument;
window.removeContentCover = removeContentCover;
window.switchContentCoverTab = switchContentCoverTab;
