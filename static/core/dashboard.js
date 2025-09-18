// Dashboard JavaScript functionality
let currentChart = null;
let currentPeriod = 'monthly';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeEventListeners();
    loadInitialData();
});

// Initialize the spending chart
function initializeChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dashboardData.monthsData || [],
            datasets: [{
                label: 'Expenses (₹)',
                data: dashboardData.spendingData || [],
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1a202c',
                    bodyColor: '#4a5568',
                    borderColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.6)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Toggle buttons for chart period
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.dataset.period;
            if (period !== currentPeriod) {
                switchChartPeriod(period);
            }
        });
    });

    // AI Insights button
    const insightsBtn = document.getElementById('generate-insights');
    if (insightsBtn) {
        insightsBtn.addEventListener('click', generateAIInsights);
    }

    // Add reminder button
    const addReminderBtn = document.getElementById('add-reminder-btn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', showReminderModal);
    }

    // Modal controls
    const modal = document.getElementById('reminderModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('reminderForm');

    if (closeBtn) closeBtn.addEventListener('click', hideReminderModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideReminderModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideReminderModal();
        });
    }
    if (form) form.addEventListener('submit', handleReminderSubmit);
}

// Load initial data
function loadInitialData() {
    // Any initial data loading can go here
    console.log('Dashboard initialized with data:', dashboardData);
}

// Switch chart period (monthly/weekly)
function switchChartPeriod(period) {
    currentPeriod = period;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    // Show loading
    showChartLoading();

    // Fetch new data
    fetch(`/core/api/chart-data/?period=${period}`)
        .then(response => response.json())
        .then(data => {
            updateChart(data);
            hideChartLoading();
        })
        .catch(error => {
            console.error('Error loading chart data:', error);
            hideChartLoading();
            showError('Failed to load chart data');
        });
}

// Update chart with new data
function updateChart(data) {
    if (currentChart) {
        currentChart.data.labels = data.labels;
        currentChart.data.datasets[0].data = data.data;
        currentChart.update('active');
    }
}

// Show/hide chart loading
function showChartLoading() {
    const loading = document.getElementById('chartLoading');
    if (loading) loading.style.display = 'block';
}

function hideChartLoading() {
    const loading = document.getElementById('chartLoading');
    if (loading) loading.style.display = 'none';
}

// Generate AI Insights
function generateAIInsights() {
    const insightsElement = document.getElementById('ai-insights');
    const loadingElement = document.getElementById('insights-loading');
    const btn = document.getElementById('generate-insights');

    // Show loading state
    if (insightsElement) insightsElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'block';
    if (btn) btn.disabled = true;

    fetch('/core/api/ai-insights/')
        .then(response => response.json())
        .then(data => {
            console.log('AI Insights Response:', data);
            if (data.success) {
                displayInsights(data.insights);
            } else {
                console.error('AI Insights Error:', data.error, data.details);
                displayInsights(`❌ Error: ${data.error}${data.details ? '\n\nDetails: ' + data.details : ''}`);
                showError(data.error || 'Failed to generate insights');
            }
        })
        .catch(error => {
            console.error('Error generating insights:', error);
            showError('Failed to generate insights. Please try again.');
        })
        .finally(() => {
            // Hide loading state
            if (loadingElement) loadingElement.style.display = 'none';
            if (insightsElement) insightsElement.style.display = 'block';
            if (btn) btn.disabled = false;
        });
}

// Display AI insights
function displayInsights(insights) {
    const insightsElement = document.getElementById('ai-insights');
    if (insightsElement) {
        // Format the insights text to make it more readable
        const formattedInsights = insights
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                // Convert *text* to <strong>text</strong> for bold formatting
                let formattedLine = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
                
                if (formattedLine.trim().startsWith('•') || formattedLine.trim().startsWith('-')) {
                    return `<li>${formattedLine.trim().substring(1).trim()}</li>`;
                }
                return `<p>${formattedLine.trim()}</p>`;
            })
            .join('');

        insightsElement.innerHTML = `
            <div class="insights-content">
                <h4 style="margin: 0 0 15px 0; color: #1a202c; font-size: 16px;">💡 Personalized Insights</h4>
                <div style="margin: 0; line-height: 1.6;">
                    ${formattedInsights}
                </div>
            </div>
        `;
    }
}

// Show/hide reminder modal
function showReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Clear form
        const form = document.getElementById('reminderForm');
        if (form) form.reset();
    }
}

// Handle reminder form submission
function handleReminderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    fetch('/core/api/reminders/add/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addReminderToList(data.reminder);
            hideReminderModal();
            showSuccess('Reminder added successfully!');
        } else {
            showError(data.error || 'Failed to add reminder');
        }
    })
    .catch(error => {
        console.error('Error adding reminder:', error);
        showError('Failed to add reminder. Please try again.');
    });
}

// Add reminder to the list
function addReminderToList(reminder) {
    const reminderList = document.getElementById('reminder-list');
    const noReminders = reminderList.querySelector('.no-reminders');
    
    if (noReminders) {
        noReminders.remove();
    }
    
    const reminderItem = document.createElement('li');
    reminderItem.className = 'reminder-item pending';
    reminderItem.dataset.id = reminder.id;
    
    const dateText = reminder.due_date 
        ? ` – ${new Date(reminder.due_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` 
        : '';
    
    reminderItem.innerHTML = `
        <div class="reminder-content">
            <div class="reminder-text">
                <span class="reminder-icon">📋</span>
                <span class="reminder-title">${reminder.title}</span>
                <span class="reminder-date">${dateText}</span>
            </div>
            <div class="reminder-actions">
                <button class="reminder-toggle" onclick="toggleReminder(${reminder.id})">⭕</button>
                <button class="reminder-delete" onclick="deleteReminder(${reminder.id})">🗑️</button>
            </div>
        </div>
    `;
    
    reminderList.appendChild(reminderItem);
}

// Toggle reminder completion
function toggleReminder(reminderId) {
    fetch(`/core/api/reminders/${reminderId}/toggle/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const reminderItem = document.querySelector(`[data-id="${reminderId}"]`);
            const toggleBtn = reminderItem.querySelector('.reminder-toggle');
            
            if (data.done) {
                reminderItem.classList.remove('pending');
                reminderItem.classList.add('completed');
                toggleBtn.textContent = '✅';
            } else {
                reminderItem.classList.remove('completed');
                reminderItem.classList.add('pending');
                toggleBtn.textContent = '⭕';
            }
        } else {
            showError('Failed to update reminder');
        }
    })
    .catch(error => {
        console.error('Error toggling reminder:', error);
        showError('Failed to update reminder');
    });
}

// Delete reminder
function deleteReminder(reminderId) {
    if (!confirm('Are you sure you want to delete this reminder?')) {
        return;
    }
    
    fetch(`/core/api/reminders/${reminderId}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const reminderItem = document.querySelector(`[data-id="${reminderId}"]`);
            reminderItem.remove();
            
            // Check if list is empty
            const reminderList = document.getElementById('reminder-list');
            if (reminderList.children.length === 0) {
                reminderList.innerHTML = '<li class="no-reminders"><p>No reminders yet. Add your first reminder!</p></li>';
            }
            
            showSuccess('Reminder deleted successfully!');
        } else {
            showError('Failed to delete reminder');
        }
    })
    .catch(error => {
        console.error('Error deleting reminder:', error);
        showError('Failed to delete reminder');
    });
}

// Utility functions for notifications
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
