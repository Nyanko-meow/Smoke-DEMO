document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    // Update navigation based on login status
    updateNavigation(token, role);

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Update navigation based on login status
function updateNavigation(token, role) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');

    if (token) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (profileBtn) profileBtn.style.display = 'block';

        // Update user name in dropdown if available
        const userName = localStorage.getItem('userName');
        const userDropdown = document.getElementById('navbarDropdown');
        if (userName && userDropdown) {
            userDropdown.innerHTML = `<i class="fas fa-user-circle mr-1"></i> ${userName}`;
        }

        // Show/hide elements based on user role
        document.querySelectorAll('[data-role]').forEach(element => {
            const allowedRoles = element.dataset.role.split(',');
            if (allowedRoles.includes(role) || allowedRoles.includes('all')) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';

        // Hide elements that require authentication
        document.querySelectorAll('[data-role]').forEach(element => {
            const allowedRoles = element.dataset.role.split(',');
            if (allowedRoles.includes('guest') || allowedRoles.includes('all')) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }
}

// Logout function
function logout() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');

    // Show logout message
    showAlert('Đăng xuất thành công', 'success');

    // Redirect to home page after short delay
    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
}

// Show alert message
function showAlert(message, type, container = 'alert-container') {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        $(alert).alert('close');
    }, 5000);
}

// Format currency to VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format date to Vietnamese format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
} 