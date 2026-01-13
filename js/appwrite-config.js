// Appwrite Configuration
// INSTRUCTIONS: Replace these values with your actual Appwrite project details
// Get these from your Appwrite Console: https://cloud.appwrite.io/

const APPWRITE_CONFIG = {
    // Your Appwrite API Endpoint
    // Cloud: 'https://cloud.appwrite.io/v1'
    // Self-hosted: 'http://localhost/v1' or your domain
    endpoint: 'https://cloud.appwrite.io/v1',
    
    // Your Project ID (from Appwrite Console → Settings)
    projectId: 'YOUR_PROJECT_ID_HERE',
    
    // Your Database ID (from Databases section)
    databaseId: 'YOUR_DATABASE_ID_HERE',
    
    // Collection IDs (from each collection's settings)
    collections: {
        books: 'YOUR_BOOKS_COLLECTION_ID_HERE',
        chapters: 'YOUR_CHAPTERS_COLLECTION_ID_HERE',
        purchases: 'YOUR_PURCHASES_COLLECTION_ID_HERE',
        messages: 'YOUR_MESSAGES_COLLECTION_ID_HERE'
    },
    
    // Storage Bucket IDs (optional - if using Appwrite Storage)
    buckets: {
        bookCovers: 'YOUR_BUCKET_ID_HERE'
    },
    
    // Admin User ID (from Auth → Users)
    adminUserId: 'YOUR_ADMIN_USER_ID_HERE'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APPWRITE_CONFIG;
}
