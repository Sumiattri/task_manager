let statusChart, importanceChart;
// Use config from config.js if available, otherwise fallback
function getBaseUrl() {
    return window.BASE_URL || (window.location.port === '3000' ? '' : 'http://localhost:3000');
}
function getApiBaseUrl() {
    return window.API_BASE_URL || getBaseUrl();
}

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
        window.location.href = `${getBaseUrl()}/index.html`;
        return;
    }
    
    document.getElementById('adminName').textContent = user.username;
    loadRules();
    loadCategories();
    loadPerformance();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = `${getBaseUrl()}/index.html`;
}

function showTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    const button = document.getElementById(`tab-${tab}`);
    button.classList.add('border-blue-500', 'text-blue-600');
    button.classList.remove('border-transparent', 'text-gray-500');
    
    if (tab === 'performance') {
        loadPerformance();
    }
}

// Prioritization Rules
async function loadRules() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/prioritization-rules`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const rule = await response.json();
        
        if (rule) {
            document.getElementById('deadlineWeight').value = rule.deadlineWeight || 0.5;
            document.getElementById('importanceWeight').value = rule.importanceWeight || 0.5;
            document.getElementById('lowScore').value = rule.importanceLevels?.low || 1;
            document.getElementById('mediumScore').value = rule.importanceLevels?.medium || 2;
            document.getElementById('highScore').value = rule.importanceLevels?.high || 3;
            document.getElementById('criticalScore').value = rule.importanceLevels?.critical || 4;
        }
    } catch (error) {
        console.error('Error loading rules:', error);
    }
}

document.getElementById('rulesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageDiv = document.getElementById('rulesMessage');
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/prioritization-rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                deadlineWeight: parseFloat(document.getElementById('deadlineWeight').value),
                importanceWeight: parseFloat(document.getElementById('importanceWeight').value),
                importanceLevels: {
                    low: parseInt(document.getElementById('lowScore').value),
                    medium: parseInt(document.getElementById('mediumScore').value),
                    high: parseInt(document.getElementById('highScore').value),
                    critical: parseInt(document.getElementById('criticalScore').value)
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = 'Rules configured successfully!';
            messageDiv.className = 'mt-4 text-sm text-green-600';
        } else {
            messageDiv.textContent = data.message || 'Failed to configure rules';
            messageDiv.className = 'mt-4 text-sm text-red-600';
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred';
        messageDiv.className = 'mt-4 text-sm text-red-600';
    }
});

// Task Categories
async function loadCategories() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/categories`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const categories = await response.json();
        
        const tbody = document.getElementById('categoriesBody');
        tbody.innerHTML = '';
        
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${category.description || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="deleteCategory('${category._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: document.getElementById('categoryName').value,
                description: document.getElementById('categoryDescription').value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('categoryForm').reset();
            loadCategories();
        } else {
            alert(data.message || 'Failed to create category');
        }
    } catch (error) {
        alert('An error occurred');
    }
});

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            loadCategories();
        } else {
            alert('Failed to delete category');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

// System Performance
async function loadPerformance() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/performance`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalTasks').textContent = data.totalTasks || 0;
        document.getElementById('completedTasks').textContent = data.completedTasks || 0;
        document.getElementById('totalTimeLogs').textContent = data.totalTimeLogs || 0;
        
        // Status Chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        if (statusChart) statusChart.destroy();
        
        const statusData = {};
        data.tasksByStatus?.forEach(item => {
            statusData[item._id] = item.count;
        });
        
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Completed'],
                datasets: [{
                    data: [
                        statusData.pending || 0,
                        statusData['in-progress'] || 0,
                        statusData.completed || 0
                    ],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#10B981']
                }]
            }
        });
        
        // Importance Chart
        const importanceCtx = document.getElementById('importanceChart').getContext('2d');
        if (importanceChart) importanceChart.destroy();
        
        const importanceData = {};
        data.tasksByImportance?.forEach(item => {
            importanceData[item._id] = item.count;
        });
        
        importanceChart = new Chart(importanceCtx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    label: 'Tasks',
                    data: [
                        importanceData.low || 0,
                        importanceData.medium || 0,
                        importanceData.high || 0,
                        importanceData.critical || 0
                    ],
                    backgroundColor: ['#6B7280', '#3B82F6', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        console.error('Error loading performance:', error);
    }
}

