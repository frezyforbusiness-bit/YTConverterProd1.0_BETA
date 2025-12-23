// Admin Dashboard JavaScript

// API URL
let API_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000';
} else {
    API_URL = window.location.origin;
}

// Charts
let formatChart = null;
let timeChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Period buttons
    document.querySelectorAll('.btn-period').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const days = parseInt(e.target.dataset.days);
            loadStatsByDate(days);
        });
    });
});

// Authentication functions (use sessionStorage instead of localStorage)
function getToken() {
    return sessionStorage.getItem('admin_token');
}

function setToken(token) {
    sessionStorage.setItem('admin_token', token);
}

function removeToken() {
    sessionStorage.removeItem('admin_token');
}

function checkAuth() {
    const token = getToken();
    if (token) {
        // Verify token is still valid by trying to load dashboard
        loadDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    loadDashboard();
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
            return;
        }
        
        setToken(data.token);
        document.getElementById('adminUsername').textContent = data.username;
        showDashboard();
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function handleLogout() {
    removeToken();
    showLogin();
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    if (!token) {
        showLogin();
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        removeToken();
        showLogin();
        throw new Error('Session expired');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

// Load dashboard data
async function loadDashboard() {
    try {
        const stats = await apiCall('/api/admin/dashboard');
        displayStats(stats);
        
        loadRecentConversions();
        loadErrors();
        loadProfile();
        
        // Load charts
        loadFormatChart(stats.by_format);
        loadStatsByDate(7); // Default to 7 days
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        if (error.message !== 'Not authenticated' && error.message !== 'Session expired') {
            alert('Failed to load dashboard data: ' + error.message);
        }
    }
}

function displayStats(stats) {
    document.getElementById('statTotal').textContent = stats.total_conversions || 0;
    document.getElementById('statSuccessful').textContent = stats.successful_conversions || 0;
    document.getElementById('statToday').textContent = stats.conversions_today || 0;
    document.getElementById('statErrorsToday').textContent = stats.errors_today || 0;
    document.getElementById('statSuccessRate').textContent = (stats.success_rate || 0) + '%';
}

// Load format chart
function loadFormatChart(formatData) {
    const ctx = document.getElementById('formatChart');
    if (!ctx) return;
    
    if (formatChart) {
        formatChart.destroy();
    }
    
    const labels = Object.keys(formatData);
    const data = Object.values(formatData);
    
    formatChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.map(f => f.toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(128, 128, 128, 0.8)',
                    'rgba(160, 160, 160, 0.8)',
                    'rgba(192, 192, 192, 0.8)',
                    'rgba(224, 224, 224, 0.8)',
                    'rgba(200, 200, 200, 0.8)',
                    'rgba(150, 150, 150, 0.8)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            family: 'Rajdhani',
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

// Load stats by date
async function loadStatsByDate(days = 7) {
    try {
        const stats = await apiCall(`/api/admin/stats-by-date?days=${days}`);
        displayTimeChart(stats);
    } catch (error) {
        console.error('Failed to load stats by date:', error);
    }
}

function displayTimeChart(stats) {
    const ctx = document.getElementById('timeChart');
    if (!ctx) return;
    
    if (timeChart) {
        timeChart.destroy();
    }
    
    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.dates || [],
            datasets: [
                {
                    label: 'Total',
                    data: stats.totals || [],
                    borderColor: 'rgba(128, 128, 128, 1)',
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Successful',
                    data: stats.successful || [],
                    borderColor: 'rgba(107, 255, 107, 1)',
                    backgroundColor: 'rgba(107, 255, 107, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Failed',
                    data: stats.failed || [],
                    borderColor: 'rgba(255, 107, 107, 1)',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            family: 'Rajdhani',
                            size: 14
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            family: 'Rajdhani'
                        }
                    },
                    grid: {
                        color: 'rgba(100, 100, 100, 0.2)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            family: 'Rajdhani'
                        }
                    },
                    grid: {
                        color: 'rgba(100, 100, 100, 0.2)'
                    }
                }
            }
        }
    });
}

// Load recent conversions
async function loadRecentConversions() {
    try {
        const data = await apiCall('/api/admin/recent-conversions?limit=20');
        displayConversions(data.conversions || []);
    } catch (error) {
        console.error('Failed to load conversions:', error);
    }
}

function displayConversions(conversions) {
    const tbody = document.getElementById('conversionsTableBody');
    if (!tbody) return;
    
    if (conversions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No conversions yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = conversions.map(conv => {
        const date = new Date(conv.created_at);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const title = conv.video_title || 'Unknown';
        const titleShort = title.length > 40 ? title.substring(0, 40) + '...' : title;
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td title="${title}">${titleShort}</td>
                <td>${conv.format.toUpperCase()}</td>
                <td><span class="status-badge ${conv.status}">${conv.status}</span></td>
                <td>${conv.bpm || '-'}</td>
                <td>${conv.key || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Load errors
async function loadErrors() {
    try {
        const data = await apiCall('/api/admin/errors?limit=20');
        displayErrors(data.errors || []);
    } catch (error) {
        console.error('Failed to load errors:', error);
    }
}

function displayErrors(errors) {
    const tbody = document.getElementById('errorsTableBody');
    if (!tbody) return;
    
    if (errors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No errors yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = errors.map(err => {
        const date = new Date(err.created_at);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const message = err.error_message || 'No message';
        const messageShort = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const urlShort = err.youtube_url ? (err.youtube_url.length > 30 ? err.youtube_url.substring(0, 30) + '...' : err.youtube_url) : '-';
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td>${err.error_type || 'Unknown'}</td>
                <td title="${message}">${messageShort}</td>
                <td title="${err.youtube_url || ''}">${urlShort}</td>
            </tr>
        `;
    }).join('');
}

// Load profile
async function loadProfile() {
    try {
        const profile = await apiCall('/api/admin/profile');
        document.getElementById('profileUsername').textContent = profile.username || '-';
        
        if (profile.last_login) {
            const lastLogin = new Date(profile.last_login);
            document.getElementById('profileLastLogin').textContent = 
                lastLogin.toLocaleDateString() + ' ' + lastLogin.toLocaleTimeString();
        } else {
            document.getElementById('profileLastLogin').textContent = 'Never';
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

