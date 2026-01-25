const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin SDk is necessary since we are using admin features like authentication verification
function initFirebaseAdmin() {
    if (admin.apps.length) return admin; // Avoid re-initialization
    
    let serviceAccount = null;
    
    // Try to get service account from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
        }
    }
    
    // Try to get service account from file path
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        try {
            const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountFile);
        } catch (error) {
            console.error("Error reading Firebase service account file:", error);
        }
    }
    
    // Initialize Firebase Admin only if we have valid credentials
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully");
    } else {
        console.warn("Warning: Firebase Admin not initialized - FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH not set");
    }
    
    return admin;
}

// Initialize Firebase Admin when module loads
initFirebaseAdmin();

// Export the function so other modules can also call it if needed
module.exports = initFirebaseAdmin;