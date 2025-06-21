// auth.js - Authentication module
// This module handles user authentication and authorization

// Auth state
let currentUser = null;
let isAuthenticated = false;
let userRoles = [];

// Configuration
const AUTH_STORAGE_KEY = 'family_tree_auth';
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123'; // In a real app, use a secure password and store hashed passwords

/**
 * Initialize authentication from local storage if present
 */
export function initAuth() {
    try {
        // Try to restore session from localStorage
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            currentUser = authData.user;
            isAuthenticated = true;
            userRoles = authData.roles || [];
            console.log('Auth restored from storage for user:', currentUser.username);
        }
    } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear potentially corrupted auth data
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    // Update UI based on auth state
    updateAuthUI();
}

/**
 * Login with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<Object>} The login result
 */
export async function login(username, password) {
    try {
        // In a real app, you would make an API call to validate credentials
        // For this demo, we'll use a simple hardcoded check
        if (username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
            // Successful login
            currentUser = {
                username: username,
                displayName: 'Administrator',
                // Add other user properties as needed
            };
            userRoles = ['admin', 'editor']; // Set appropriate roles
            isAuthenticated = true;

            // Store auth info in localStorage
            const authData = {
                user: currentUser,
                roles: userRoles,
                timestamp: Date.now()
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

            // Update UI
            updateAuthUI();

            console.log('Login successful for user:', username);
            return { success: true, user: currentUser };
        } else {
            // Failed login
            console.log('Login failed for user:', username);
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Log out the current user
 */
export function logout() {
    // Clear auth state
    currentUser = null;
    isAuthenticated = false;
    userRoles = [];

    // Remove from localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);

    // Update UI
    updateAuthUI();

    console.log('User logged out');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isUserAuthenticated() {
    return isAuthenticated;
}

/**
 * Check if user has a specific role
 * @param {string} role - The role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(role) {
    return isAuthenticated && userRoles.includes(role);
}

/**
 * Get current user
 * @returns {Object|null} The current user or null if not authenticated
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
    // Find auth-related UI elements
    const authButtons = document.querySelectorAll('[data-auth-required]');
    const authUserDisplay = document.getElementById('auth-user-display');
    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');

    if (isAuthenticated) {
        // User is logged in - show elements that require auth
        authButtons.forEach(el => {
            el.style.display = 'block';
        });

        // Update user display if it exists
        if (authUserDisplay) {
            authUserDisplay.textContent = currentUser.displayName || currentUser.username;
            authUserDisplay.style.display = 'block';
        }

        // Show logout, hide login
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';

    } else {
        // User is not logged in - hide elements that require auth
        authButtons.forEach(el => {
            el.style.display = 'none';
        });

        // Hide user display
        if (authUserDisplay) {
            authUserDisplay.textContent = '';
            authUserDisplay.style.display = 'none';
        }

        // Show login, hide logout
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    // Dispatch an event so other components can react to auth changes
    document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isAuthenticated, currentUser, userRoles }
    }));
}

/**
 * Show login form modal
 */
export function showLoginForm() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="login-header">
            <h2>Login</h2>
            <button class="close-modal-btn">&times;</button>
        </div>
        <form id="login-form" class="login-form">
            <div class="form-field">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-field">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="login-message" style="display: none;"></div>
            <div class="login-actions">
                <button type="submit" class="login-button">Login</button>
            </div>
            
            <div class="demo-credentials">
                <p>Demo Credentials:</p>
                <p>Username: admin</p>
                <p>Password: admin123</p>
            </div>
        </form>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    setupLoginFormListeners(modal, backdrop);

    // Show with animation
    setTimeout(() => {
        backdrop.classList.add('visible');
        modal.classList.add('visible');
    }, 10);
}

/**
 * Set up event listeners for login form
 * @param {HTMLElement} modal - The modal element
 * @param {HTMLElement} backdrop - The backdrop element
 */
function setupLoginFormListeners(modal, backdrop) {
    // Close button
    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => {
        closeLoginModal(modal, backdrop);
    });

    // Form submission
    const form = modal.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;
        const message = form.querySelector('.login-message');
        const submitBtn = form.querySelector('.login-button');

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        message.style.display = 'none';

        try {
            // Attempt login
            await login(username, password);

            // Show success message
            message.textContent = 'Login successful!';
            message.className = 'login-message success';
            message.style.display = 'block';

            // Close modal after short delay
            setTimeout(() => {
                closeLoginModal(modal, backdrop);
            }, 1000);
        } catch (error) {
            // Show error message
            message.textContent = error.message || 'Login failed';
            message.className = 'login-message error';
            message.style.display = 'block';

            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    // Close if clicking outside
    backdrop.addEventListener('click', () => {
        closeLoginModal(modal, backdrop);
    });
    modal.addEventListener('click', e => e.stopPropagation());
}

/**
 * Close login modal
 * @param {HTMLElement} modal - The modal element
 * @param {HTMLElement} backdrop - The backdrop element
 */
function closeLoginModal(modal, backdrop) {
    backdrop.classList.remove('visible');
    modal.classList.remove('visible');

    setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 300);
}