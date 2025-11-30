let activeTimeLog = null;
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
    
    if (!token) {
        window.location.href = `${getBaseUrl()}/index.html`;
        return;
    }
    
    document.getElementById('userName').textContent = user.username;
    loadTasks();
    loadCategories();
    loadTimeLogs();
    loadProgress();
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
    
    if (tab === 'time') {
        loadTasksForTimeTracking();
    } else if (tab === 'progress') {
        loadProgress();
    }
}

// Tasks
async function loadTasks() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/tasks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const tasks = await response.json();
        
        const tbody = document.getElementById('tasksBody');
        tbody.innerHTML = '';
        
        tasks.forEach(task => {
            const row = document.createElement('tr');
            const deadline = new Date(task.deadline);
            const importanceColors = {
                low: 'bg-gray-100 text-gray-800',
                medium: 'bg-blue-100 text-blue-800',
                high: 'bg-orange-100 text-orange-800',
                critical: 'bg-red-100 text-red-800'
            };
            const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                'in-progress': 'bg-blue-100 text-blue-800',
                completed: 'bg-green-100 text-green-800'
            };
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${task.name}</div>
                    <div class="text-sm text-gray-500">${task.description || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${deadline.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${importanceColors[task.importanceLevel]}">
                        ${task.importanceLevel}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}">
                        ${task.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${task.priorityScore?.toFixed(2) || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(task.totalTimeSpent || 0).toFixed(2)} min</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <select onchange="updateTaskStatus('${task._id}', this.value)" class="border border-gray-300 rounded px-2 py-1">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button onclick="deleteTask('${task._id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function loadTasksForTimeTracking() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/tasks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const tasks = await response.json();
        
        const select = document.getElementById('timeTask');
        select.innerHTML = '<option value="">Select a task</option>';
        
        tasks.filter(t => t.status !== 'completed').forEach(task => {
            const option = document.createElement('option');
            option.value = task._id;
            option.textContent = task.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/categories`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const categories = await response.json();
        
        const select = document.getElementById('taskCategory');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: document.getElementById('taskName').value,
                description: document.getElementById('taskDescription').value,
                deadline: new Date(document.getElementById('taskDeadline').value).toISOString(),
                importanceLevel: document.getElementById('taskImportance').value,
                category: document.getElementById('taskCategory').value || null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('taskForm').reset();
            loadTasks();
        } else {
            alert(data.message || 'Failed to create task');
        }
    } catch (error) {
        alert('An error occurred');
    }
});

async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            loadTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

// Time Tracking
document.getElementById('timeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (activeTimeLog) {
        alert('Please stop the current time tracking first');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/time-logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                taskId: document.getElementById('timeTask').value,
                startTime: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            activeTimeLog = data.timeLog._id;
            document.getElementById('timeForm').reset();
            loadTimeLogs();
            alert('Time tracking started!');
        } else {
            alert(data.message || 'Failed to start time tracking');
        }
    } catch (error) {
        alert('An error occurred');
    }
});

async function loadTimeLogs() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/time-logs`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const timeLogs = await response.json();
        
        const tbody = document.getElementById('timeLogsBody');
        tbody.innerHTML = '';
        
        timeLogs.forEach(log => {
            const row = document.createElement('tr');
            const startTime = new Date(log.startTime);
            const endTime = log.endTime ? new Date(log.endTime) : null;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${log.taskId?.name || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${startTime.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${endTime ? endTime.toLocaleString() : 'Active'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.duration ? log.duration.toFixed(2) : 'Running...'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${log.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${log.isActive ? 'Active' : 'Stopped'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${log.isActive ? `<button onclick="stopTimeLog('${log._id}')" class="text-red-600 hover:text-red-900">Stop</button>` : '-'}
                </td>
            `;
            tbody.appendChild(row);
            
            if (log.isActive) {
                activeTimeLog = log._id;
            }
        });
    } catch (error) {
        console.error('Error loading time logs:', error);
    }
}

async function stopTimeLog(id) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/time-logs/${id}/stop`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            activeTimeLog = null;
            loadTimeLogs();
            loadTasks();
            alert('Time tracking stopped!');
        } else {
            alert('Failed to stop time tracking');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

// Progress Review
async function loadProgress() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user/progress`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        document.getElementById('progressTotalTasks').textContent = data.totalTasks || 0;
        document.getElementById('progressCompletedTasks').textContent = data.completedTasks || 0;
        document.getElementById('progressCompletionRate').textContent = `${data.completionRate || 0}%`;
        document.getElementById('progressTotalTime').textContent = `${parseFloat(data.totalTimeSpent || 0).toFixed(2)} min`;
        
        // Status Breakdown
        const statusDiv = document.getElementById('statusBreakdown');
        statusDiv.innerHTML = `
            <div class="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span class="font-medium">Pending</span>
                <span class="text-yellow-600 font-bold">${data.tasksByStatus?.pending || 0}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span class="font-medium">In Progress</span>
                <span class="text-blue-600 font-bold">${data.tasksByStatus?.['in-progress'] || 0}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-green-50 rounded">
                <span class="font-medium">Completed</span>
                <span class="text-green-600 font-bold">${data.tasksByStatus?.completed || 0}</span>
            </div>
        `;
        
        // Importance Breakdown
        const importanceDiv = document.getElementById('importanceBreakdown');
        importanceDiv.innerHTML = `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span class="font-medium">Low</span>
                <span class="text-gray-600 font-bold">${data.tasksByImportance?.low || 0}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span class="font-medium">Medium</span>
                <span class="text-blue-600 font-bold">${data.tasksByImportance?.medium || 0}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span class="font-medium">High</span>
                <span class="text-orange-600 font-bold">${data.tasksByImportance?.high || 0}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-red-50 rounded">
                <span class="font-medium">Critical</span>
                <span class="text-red-600 font-bold">${data.tasksByImportance?.critical || 0}</span>
            </div>
        `;
        
        // Recent Tasks
        const recentDiv = document.getElementById('recentTasks');
        if (data.recentTasks && data.recentTasks.length > 0) {
            recentDiv.innerHTML = data.recentTasks.map(task => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                    <div>
                        <span class="font-medium">${task.name}</span>
                        <span class="ml-2 px-2 py-1 text-xs rounded ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${task.status}</span>
                    </div>
                    <span class="text-sm text-gray-600">${parseFloat(task.timeSpent || 0).toFixed(2)} min</span>
                </div>
            `).join('');
        } else {
            recentDiv.innerHTML = '<p class="text-gray-500">No recent tasks</p>';
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

