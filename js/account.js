import { db } from './firebase-service.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Get or create user identifier
function getUserIdentifier() {
    let userId = localStorage.getItem('lydistoriesUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('lydistoriesUserId', userId);
    }
    return userId;
}

// Display current user ID
function displayUserId() {
    const userId = getUserIdentifier();
    document.getElementById('userIdDisplay').textContent = userId;
}

// Copy user ID to clipboard
function copyUserId() {
    const userId = getUserIdentifier();
    navigator.clipboard.writeText(userId).then(() => {
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Restore purchases from a different device
async function restorePurchases() {
    const restoreId = document.getElementById('restoreId').value.trim();
    const successMessage = document.getElementById('restoreSuccess');
    const errorMessage = document.getElementById('restoreError');
    const errorText = document.getElementById('errorText');
    const restoreBtn = document.getElementById('restoreBtn');

    // Hide previous messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    if (!restoreId) {
        errorText.textContent = 'Please enter your Account ID';
        errorMessage.style.display = 'block';
        return;
    }

    // Validate ID format
    if (!restoreId.startsWith('user_')) {
        errorText.textContent = 'Invalid Account ID format';
        errorMessage.style.display = 'block';
        return;
    }

    // Show loading state
    restoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
    restoreBtn.disabled = true;

    try {
        // Query Firebase for purchases with this user ID
        const purchasesRef = collection(db, 'purchases');
        const q = query(purchasesRef, where('userId', '==', restoreId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            errorText.textContent = 'No purchases found for this Account ID';
            errorMessage.style.display = 'block';
            restoreBtn.innerHTML = '<i class="fas fa-sync"></i> Restore My Purchases';
            restoreBtn.disabled = false;
            return;
        }

        // Store the new user ID
        localStorage.setItem('lydistoriesUserId', restoreId);

        // Get existing purchases
        let existingPurchases = [];
        try {
            const stored = localStorage.getItem('purchasedBooks');
            if (stored) {
                existingPurchases = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading existing purchases:', e);
        }

        // Add Firebase purchases
        let newPurchasesCount = 0;
        querySnapshot.forEach((doc) => {
            const purchase = doc.data();
            if (!existingPurchases.includes(purchase.bookId)) {
                existingPurchases.push(purchase.bookId);
                newPurchasesCount++;
            }
        });

        // Save updated purchases
        localStorage.setItem('purchasedBooks', JSON.stringify(existingPurchases));

        // Update display
        displayUserId();

        // Show success message
        successMessage.innerHTML = `<i class="fas fa-check-circle"></i> Successfully restored ${newPurchasesCount} purchase(s)! Visit <a href="library.html">My Library</a> to see your books.`;
        successMessage.style.display = 'block';

        // Clear input
        document.getElementById('restoreId').value = '';

        // Reset button
        restoreBtn.innerHTML = '<i class="fas fa-sync"></i> Restore My Purchases';
        restoreBtn.disabled = false;

    } catch (error) {
        console.error('Error restoring purchases:', error);
        errorText.textContent = 'Error restoring purchases: ' + error.message;
        errorMessage.style.display = 'block';
        restoreBtn.innerHTML = '<i class="fas fa-sync"></i> Restore My Purchases';
        restoreBtn.disabled = false;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    displayUserId();

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', copyUserId);

    // Restore button
    document.getElementById('restoreBtn').addEventListener('click', restorePurchases);

    // Allow Enter key to restore
    document.getElementById('restoreId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            restorePurchases();
        }
    });
});
