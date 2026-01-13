// Firebase Service Layer for Lydistories
import { auth, db, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

// Firebase Service Class
class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    // ============ Authentication ============
    
    // Initialize auth state listener
    initAuthListener() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('User logged in:', user.email);
            } else {
                console.log('User logged out');
            }
        });
    }

    // Register new user
    async registerUser(email, password, displayName = '') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user profile in Firestore
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                createdAt: serverTimestamp(),
                role: 'user'
            });
            
            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logoutUser() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    }

    // ============ Books Management ============
    
    // Add a new book
    async addBook(bookData) {
        try {
            const docRef = await addDoc(collection(db, 'books'), {
                ...bookData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding book:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all books
    async getAllBooks() {
        try {
            const querySnapshot = await getDocs(collection(db, 'books'));
            const books = [];
            querySnapshot.forEach((doc) => {
                books.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, books };
        } catch (error) {
            console.error('Error getting books:', error);
            return { success: false, error: error.message, books: [] };
        }
    }

    // Get book by ID
    async getBookById(bookId) {
        try {
            const docRef = doc(db, 'books', bookId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { success: true, book: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, error: 'Book not found' };
            }
        } catch (error) {
            console.error('Error getting book:', error);
            return { success: false, error: error.message };
        }
    }

    // Update book
    async updateBook(bookId, bookData) {
        try {
            const docRef = doc(db, 'books', bookId);
            await updateDoc(docRef, {
                ...bookData,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating book:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete book
    async deleteBook(bookId) {
        try {
            await deleteDoc(doc(db, 'books', bookId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting book:', error);
            return { success: false, error: error.message };
        }
    }

    // ============ Purchases Management ============
    
    // Record a purchase
    async recordPurchase(userId, bookId, bookTitle, amount, paymentMethod) {
        try {
            const docRef = await addDoc(collection(db, 'purchases'), {
                userId: userId || 'guest',
                bookId,
                bookTitle,
                amount,
                paymentMethod,
                purchasedAt: serverTimestamp(),
                status: 'completed'
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error recording purchase:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user's purchased books
    async getUserPurchases(userId) {
        try {
            const q = query(
                collection(db, 'purchases'),
                where('userId', '==', userId || 'guest'),
                orderBy('purchasedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const purchases = [];
            querySnapshot.forEach((doc) => {
                purchases.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, purchases };
        } catch (error) {
            console.error('Error getting purchases:', error);
            return { success: false, error: error.message, purchases: [] };
        }
    }

    // Check if user has purchased a book
    async hasPurchasedBook(userId, bookId) {
        try {
            const q = query(
                collection(db, 'purchases'),
                where('userId', '==', userId || 'guest'),
                where('bookId', '==', bookId)
            );
            const querySnapshot = await getDocs(q);
            return { success: true, hasPurchased: !querySnapshot.empty };
        } catch (error) {
            console.error('Error checking purchase:', error);
            return { success: false, error: error.message, hasPurchased: false };
        }
    }

    // ============ Chapters Management ============
    
    // Add chapter to a book
    async addChapter(bookId, chapterData) {
        try {
            const docRef = await addDoc(collection(db, 'chapters'), {
                bookId,
                ...chapterData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding chapter:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all chapters for a book
    async getBookChapters(bookId) {
        try {
            const q = query(
                collection(db, 'chapters'),
                where('bookId', '==', bookId),
                orderBy('chapterNumber', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const chapters = [];
            querySnapshot.forEach((doc) => {
                chapters.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, chapters };
        } catch (error) {
            console.error('Error getting chapters:', error);
            return { success: false, error: error.message, chapters: [] };
        }
    }

    // Update chapter
    async updateChapter(chapterId, chapterData) {
        try {
            const docRef = doc(db, 'chapters', chapterId);
            await updateDoc(docRef, {
                ...chapterData,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating chapter:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete chapter
    async deleteChapter(chapterId) {
        try {
            await deleteDoc(doc(db, 'chapters', chapterId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting chapter:', error);
            return { success: false, error: error.message };
        }
    }

    // ============ Contact Messages ============
    
    // Save contact message
    async saveContactMessage(messageData) {
        try {
            const docRef = await addDoc(collection(db, 'messages'), {
                ...messageData,
                createdAt: serverTimestamp(),
                read: false
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving message:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all contact messages
    async getAllMessages() {
        try {
            const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, messages };
        } catch (error) {
            console.error('Error getting messages:', error);
            return { success: false, error: error.message, messages: [] };
        }
    }

    // ============ Image Upload ============
    
    // Upload book cover image
    async uploadBookCover(file, bookId) {
        try {
            const storageRef = ref(storage, `book-covers/${bookId}_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export a single instance
const firebaseService = new FirebaseService();
export default firebaseService;
