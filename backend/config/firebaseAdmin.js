const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin SDk is necessary since we are using admin features like authentication verification
function initFirebaseAdmin() {
    if (admin.apps.length) return admin; // Avoid re-initialization
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON){
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); // Parse JSON from environment variable
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount) // Use the parsed JSON object
    });    
    return admin;
}

module.exports = initFirebaseAdmin();