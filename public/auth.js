// Use config from config.js if available, otherwise fallback
const BASE_URL = window.BASE_URL || (window.location.port === '3000' ? '' : 'http://localhost:3000');
const API_BASE_URL = window.API_BASE_URL || BASE_URL;

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'admin') {
                window.location.href = `${BASE_URL}/admin.html`;
            } else {
                window.location.href = `${BASE_URL}/user.html`;
            }
        } else {
            messageDiv.textContent = data.message || 'Login failed';
            messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'admin') {
                window.location.href = `${BASE_URL}/admin.html`;
            } else {
                window.location.href = `${BASE_URL}/user.html`;
            }
        } else {
            messageDiv.textContent = data.message || 'Registration failed';
            messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
    }
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role) {
        if (user.role === 'admin') {
            window.location.href = `${BASE_URL}/admin.html`;
        } else {
            window.location.href = `${BASE_URL}/user.html`;
        }
    }
});

