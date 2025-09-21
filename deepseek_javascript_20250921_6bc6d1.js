document.addEventListener('DOMContentLoaded', function() {
    // Authentication elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginFormElement = document.getElementById('login-form-element');
    const signupFormElement = document.getElementById('signup-form-element');
    const switchToSignupBtn = document.getElementById('switch-to-signup');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    
    // Check URL parameters to show login or signup form
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'signup') {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    } else {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    }
    
    // Switch between login and signup forms
    if (switchToSignupBtn) {
        switchToSignupBtn.addEventListener('click', function() {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            window.history.replaceState({}, '', '?action=signup');
        });
    }
    
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', function() {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            window.history.replaceState({}, '', '?action=login');
        });
    }
    
    // Login form submission
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Clear previous errors
            document.getElementById('login-email-error').textContent = '';
            document.getElementById('login-password-error').textContent = '';
            
            // Validate credentials
            const users = JSON.parse(localStorage.getItem('tradingCalendarUsers')) || [];
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('tradingCalendarCurrentUser', JSON.stringify(user));
                window.location.href = 'calendar.html';
            } else {
                document.getElementById('login-password-error').textContent = 'Invalid email or password';
            }
        });
    }
    
    // Signup form submission
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Clear previous errors
            document.getElementById('signup-name-error').textContent = '';
            document.getElementById('signup-email-error').textContent = '';
            document.getElementById('signup-password-error').textContent = '';
            document.getElementById('signup-confirm-password-error').textContent = '';
            
            // Validate form
            let isValid = true;
            
            if (name.length < 2) {
                document.getElementById('signup-name-error').textContent = 'Name must be at least 2 characters';
                isValid = false;
            }
            
            if (!validateEmail(email)) {
                document.getElementById('signup-email-error').textContent = 'Please enter a valid email';
                isValid = false;
            }
            
            const users = JSON.parse(localStorage.getItem('tradingCalendarUsers')) || [];
            if (users.some(u => u.email === email)) {
                document.getElementById('signup-email-error').textContent = 'Email already registered';
                isValid = false;
            }
            
            if (password.length < 6) {
                document.getElementById('signup-password-error').textContent = 'Password must be at least 6 characters';
                isValid = false;
            }
            
            if (password !== confirmPassword) {
                document.getElementById('signup-confirm-password-error').textContent = 'Passwords do not match';
                isValid = false;
            }
            
            if (isValid) {
                // Create new user
                const newUser = { name, email, password };
                users.push(newUser);
                localStorage.setItem('tradingCalendarUsers', JSON.stringify(users));
                
                localStorage.setItem('tradingCalendarCurrentUser', JSON.stringify(newUser));
                window.location.href = 'calendar.html';
            }
        });
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('tradingCalendarCurrentUser');
    if (savedUser && window.location.pathname.endsWith('auth.html')) {
        window.location.href = 'calendar.html';
    }
    
    // Check if user is not logged in but trying to access calendar
    if (!savedUser && window.location.pathname.endsWith('calendar.html')) {
        window.location.href = 'auth.html';
    }
});