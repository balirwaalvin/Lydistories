// Appwrite Service Layer
// This file provides wrapper functions for all Appwrite operations

class AppwriteService {
    constructor() {
        this.client = new Appwrite.Client();
        this.account = null;
        this.databases = null;
        this.storage = null;
        this.initialized = false;
    }

    // Initialize Appwrite connection
    init() {
        try {
            this.client
                .setEndpoint(APPWRITE_CONFIG.endpoint)
                .setProject(APPWRITE_CONFIG.projectId);
            
            this.account = new Appwrite.Account(this.client);
            this.databases = new Appwrite.Databases(this.client);
            this.storage = new Appwrite.Storage(this.client);
            
            this.initialized = true;
            console.log('✅ Appwrite initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Appwrite:', error);
            return false;
        }
    }

    // Check if using Appwrite or localStorage fallback
    isEnabled() {
        return this.initialized && 
               APPWRITE_CONFIG.projectId !== 'YOUR_PROJECT_ID_HERE';
    }

    // ==================== BOOKS ====================
    
    // Get all published books
    async getAllBooks() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                [
                    Appwrite.Query.equal('published', true),
                    Appwrite.Query.limit(100)
                ]
            );
            return response.documents.map(doc => this.formatBook(doc));
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    }

    // Get all books (including unpublished - for admin)
    async getAllBooksAdmin() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                [Appwrite.Query.limit(100)]
            );
            return response.documents.map(doc => this.formatBook(doc));
        } catch (error) {
            console.error('Error fetching admin books:', error);
            throw error;
        }
    }

    // Get single book by ID
    async getBook(bookId) {
        try {
            const doc = await this.databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                bookId
            );
            return this.formatBook(doc);
        } catch (error) {
            console.error('Error fetching book:', error);
            throw error;
        }
    }

    // Create new book
    async createBook(bookData) {
        try {
            const doc = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                Appwrite.ID.unique(),
                {
                    title: bookData.title,
                    author: bookData.author,
                    category: bookData.category,
                    price: parseInt(bookData.price),
                    cover: bookData.cover,
                    description: bookData.description,
                    published: bookData.published !== false
                }
            );
            return this.formatBook(doc);
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    }

    // Update book
    async updateBook(bookId, bookData) {
        try {
            const doc = await this.databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                bookId,
                {
                    title: bookData.title,
                    author: bookData.author,
                    category: bookData.category,
                    price: parseInt(bookData.price),
                    cover: bookData.cover,
                    description: bookData.description,
                    published: bookData.published !== false
                }
            );
            return this.formatBook(doc);
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    }

    // Delete book
    async deleteBook(bookId) {
        try {
            await this.databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.books,
                bookId
            );
            return true;
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    }

    // Format book document
    formatBook(doc) {
        return {
            id: doc.$id,
            title: doc.title,
            author: doc.author,
            category: doc.category,
            price: doc.price,
            cover: doc.cover,
            description: doc.description,
            published: doc.published
        };
    }

    // ==================== CHAPTERS ====================
    
    // Get chapters for a book
    async getChapters(bookId) {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.chapters,
                [
                    Appwrite.Query.equal('bookId', bookId),
                    Appwrite.Query.orderAsc('order'),
                    Appwrite.Query.limit(100)
                ]
            );
            return response.documents.map(doc => ({
                id: doc.chapterId,
                title: doc.title,
                content: doc.content,
                order: doc.order,
                documentId: doc.$id
            }));
        } catch (error) {
            console.error('Error fetching chapters:', error);
            return [];
        }
    }

    // Save all chapters for a book
    async saveChapters(bookId, chapters) {
        try {
            // Delete existing chapters
            const existing = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.chapters,
                [Appwrite.Query.equal('bookId', bookId)]
            );
            
            for (const doc of existing.documents) {
                await this.databases.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.chapters,
                    doc.$id
                );
            }

            // Create new chapters
            for (let i = 0; i < chapters.length; i++) {
                await this.databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.chapters,
                    Appwrite.ID.unique(),
                    {
                        bookId: bookId,
                        chapterId: chapters[i].id,
                        title: chapters[i].title,
                        content: chapters[i].content,
                        order: i
                    }
                );
            }
            return true;
        } catch (error) {
            console.error('Error saving chapters:', error);
            throw error;
        }
    }

    // ==================== PURCHASES ====================
    
    // Create purchase
    async createPurchase(purchaseData) {
        try {
            const user = await this.getCurrentUser();
            const doc = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.purchases,
                Appwrite.ID.unique(),
                {
                    userId: user.$id,
                    bookId: purchaseData.bookId,
                    phoneNumber: purchaseData.phoneNumber,
                    provider: purchaseData.provider,
                    amount: purchaseData.amount,
                    status: 'completed',
                    purchaseDate: new Date().toISOString()
                }
            );
            return {
                id: doc.$id,
                bookId: doc.bookId,
                timestamp: doc.purchaseDate,
                phoneNumber: doc.phoneNumber,
                provider: doc.provider,
                amount: doc.amount
            };
        } catch (error) {
            console.error('Error creating purchase:', error);
            throw error;
        }
    }

    // Get user purchases
    async getUserPurchases() {
        try {
            const user = await this.getCurrentUser();
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.purchases,
                [
                    Appwrite.Query.equal('userId', user.$id),
                    Appwrite.Query.orderDesc('purchaseDate'),
                    Appwrite.Query.limit(100)
                ]
            );
            return response.documents.map(doc => ({
                id: doc.$id,
                bookId: doc.bookId,
                timestamp: doc.purchaseDate,
                phoneNumber: doc.phoneNumber,
                provider: doc.provider,
                amount: doc.amount
            }));
        } catch (error) {
            console.error('Error fetching purchases:', error);
            return [];
        }
    }

    // Get all purchases (admin)
    async getAllPurchases() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.purchases,
                [
                    Appwrite.Query.orderDesc('purchaseDate'),
                    Appwrite.Query.limit(100)
                ]
            );
            return response.documents.map(doc => ({
                id: doc.$id,
                userId: doc.userId,
                bookId: doc.bookId,
                timestamp: doc.purchaseDate,
                phoneNumber: doc.phoneNumber,
                provider: doc.provider,
                amount: doc.amount,
                status: doc.status
            }));
        } catch (error) {
            console.error('Error fetching all purchases:', error);
            return [];
        }
    }

    // Check if user owns book
    async userOwnsBook(bookId) {
        try {
            const user = await this.getCurrentUser();
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.purchases,
                [
                    Appwrite.Query.equal('userId', user.$id),
                    Appwrite.Query.equal('bookId', bookId),
                    Appwrite.Query.limit(1)
                ]
            );
            return response.documents.length > 0;
        } catch (error) {
            return false;
        }
    }

    // ==================== MESSAGES ====================
    
    // Create message
    async createMessage(messageData) {
        try {
            const doc = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.messages,
                Appwrite.ID.unique(),
                {
                    name: messageData.name,
                    email: messageData.email,
                    phone: messageData.phone || '',
                    message: messageData.message,
                    status: 'unread',
                    createdAt: new Date().toISOString()
                }
            );
            return doc;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    // Get all messages (admin)
    async getAllMessages() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.messages,
                [
                    Appwrite.Query.orderDesc('createdAt'),
                    Appwrite.Query.limit(100)
                ]
            );
            return response.documents.map(doc => ({
                id: doc.$id,
                name: doc.name,
                email: doc.email,
                phone: doc.phone,
                message: doc.message,
                status: doc.status,
                date: doc.createdAt
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    // ==================== AUTHENTICATION ====================
    
    // Get current logged-in user
    async getCurrentUser() {
        try {
            return await this.account.get();
        } catch (error) {
            return null;
        }
    }

    // Login
    async login(email, password) {
        try {
            // Delete any existing session
            try {
                await this.account.deleteSession('current');
            } catch (e) {
                // No existing session
            }
            
            // Create new session
            await this.account.createEmailSession(email, password);
            const user = await this.getCurrentUser();
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            await this.account.deleteSession('current');
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    // Check if user is admin
    async isAdmin() {
        try {
            const user = await this.getCurrentUser();
            return user && user.$id === APPWRITE_CONFIG.adminUserId;
        } catch (error) {
            return false;
        }
    }

    // Register new user (for future use)
    async register(email, password, name) {
        try {
            const user = await this.account.create(
                Appwrite.ID.unique(),
                email,
                password,
                name
            );
            // Auto-login after registration
            await this.login(email, password);
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
}

// Create global instance
const appwriteService = new AppwriteService();

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        appwriteService.init();
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appwriteService;
}
