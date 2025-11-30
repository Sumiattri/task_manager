// Configuration file for API endpoints
// Update this file when deploying to production
// Set your backend API URL here

// For local development
const LOCAL_API_URL = 'http://localhost:3000';

// For production - UPDATE THIS with your deployed backend URL
// Example: const PRODUCTION_API_URL = 'https://your-app.onrender.com';
const PRODUCTION_API_URL = 'http://localhost:3000'; // Change this to your production URL

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? PRODUCTION_API_URL : LOCAL_API_URL;
const BASE_URL = API_BASE_URL;

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL;
    window.BASE_URL = BASE_URL;
}
