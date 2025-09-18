// Transaction Management JavaScript
let currentEditId = null;

// Get CSRF token
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

// Modal functionality
function showAddModal() {
    console.log('Attempting to show add modal...');
    const modal = document.getElementById('addTransactionModal');
    if (!modal) {
        console.error('Add transaction modal not found!');
        return;
    }
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Set today's date as default
    const dateInput = document.getElementById('addDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    console.log('Add modal shown successfully');
}

function hideAddModal() {
    const modal = document.getElementById('addTransactionModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = '';
    
    // Clear form
    const form = document.getElementById('addTransactionForm');
    if (form) {
        form.reset();
    }
}

function showEditModal(id, date, description, category, amount) {
    console.log('Showing edit modal for:', id);
    currentEditId = id;
    
    // Format date for input field
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Populate form
    const categorySelect = document.getElementById('editCategory');
    const descriptionInput = document.getElementById('editDescription');
    const amountInput = document.getElementById('editAmount');
    const dateInput = document.getElementById('editDate');
    const idInput = document.getElementById('editID');
    
    if (categorySelect) categorySelect.value = category;
    if (descriptionInput) descriptionInput.value = description;
    if (amountInput) amountInput.value = amount;
    if (dateInput) dateInput.value = formattedDate;
    if (idInput) idInput.value = id;
    
    // Show modal
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideEditModal() {
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = '';
    
    // Clear form
    const form = document.getElementById('editTransactionForm');
    if (form) {
        form.reset();
    }
    currentEditId = null;
}

// Notification functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM Content Loaded - Initializing transaction page...');
    
    const addTransactionForm = document.getElementById("addTransactionForm");
    const editTransactionForm = document.getElementById("editTransactionForm");
    const transactionsTableBody = document.querySelector("table tbody");
    
    console.log('Elements found:', {
        addForm: !!addTransactionForm,
        editForm: !!editTransactionForm,
        tableBody: !!transactionsTableBody
    });
    
    // Add transaction button
    const addButton = document.getElementById('add-transaction-trigger');
    console.log('Add button found:', !!addButton);
    if (addButton) {
        addButton.addEventListener('click', function(e) {
            console.log('Add button clicked!');
            e.preventDefault();
            showAddModal();
        });
        console.log('Add button event listener attached');
    } else {
        console.error('Add transaction button not found!');
    }
    
    // Modal close buttons
    const closeAddModal = document.getElementById('closeAddModal');
    const cancelAddModal = document.getElementById('cancelAddModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditModal = document.getElementById('cancelEditModal');
    
    if (closeAddModal) closeAddModal.addEventListener('click', hideAddModal);
    if (cancelAddModal) cancelAddModal.addEventListener('click', hideAddModal);
    if (closeEditModal) closeEditModal.addEventListener('click', hideEditModal);
    if (cancelEditModal) cancelEditModal.addEventListener('click', hideEditModal);
    
    // Click outside modal to close
    const addModal = document.getElementById('addTransactionModal');
    const editModal = document.getElementById('editTransactionModal');
    
    if (addModal) {
        addModal.addEventListener('click', function(e) {
            if (e.target === this) hideAddModal();
        });
    }
    
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) hideEditModal();
        });
    }
    
    // Add transaction form submission
    if (addTransactionForm) {
        addTransactionForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const formData = new FormData(addTransactionForm);
            
            fetch("/core/transactions/add/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken()
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const amountColor = data.category === "Expense" ? "red" : "green";
                    
                    const newRow = `
                        <tr>
                            <td>${data.date}</td>
                            <td>${data.description}</td>
                            <td>${data.category}</td>
                            <td style="color:${amountColor};">₹${data.amount}</td>
                            <td>
                                <button class="btn-small btn-edit" 
                                 data-id="${data.id}" data-date="${data.date}" data-description="${data.description}"
                                 data-category="${data.category}" data-amount="${data.amount}">
                                    Edit
                                </button>
                                <button class="btn-small btn-delete" data-id="${data.id}">Delete</button>
                            </td>
                        </tr>
                    `;
                    
                    const noTransMsg = document.getElementById('forNoTransactions');
                    if (noTransMsg) {
                        noTransMsg.parentElement.remove();
                    }
                    
                    if (transactionsTableBody) {
                        transactionsTableBody.insertAdjacentHTML("afterbegin", newRow);
                    }
                    hideAddModal();
                    showSuccess('Transaction added successfully!');
                } else {
                    showError('Failed to add transaction.');
                }
            })
            .catch((error) => {
                showError('Error adding transaction.');
                console.error("Error:", error);
            }); 
        });
    }
    
    // Edit transaction form submission
    if (editTransactionForm) {
        editTransactionForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const formData = new FormData(editTransactionForm);
            const id = currentEditId;
            
            fetch(`/core/transactions/edit/${id}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken()
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (transactionsTableBody) {
                        const row = transactionsTableBody.querySelector(`[data-id="${id}"]`).closest("tr");
                        if (row) {
                            const amountColor = data.category === "Expense" ? "red" : "green";
                            
                            row.cells[0].innerText = data.date;
                            row.cells[1].innerText = data.description;
                            row.cells[2].innerText = data.category;
                            row.cells[3].innerHTML = `<span style="color:${amountColor};">₹${data.amount}</span>`;
                            
                            const editBtn = row.querySelector('.btn-edit');
                            if (editBtn) {
                                editBtn.dataset.date = data.date;
                                editBtn.dataset.description = data.description;
                                editBtn.dataset.category = data.category;
                                editBtn.dataset.amount = data.amount;
                            }
                        }
                    }
                    
                    hideEditModal();
                    showSuccess('Transaction updated successfully!');
                } else {
                    showError('Failed to update transaction.');
                }
            })
            .catch(error => {
                showError('Error updating transaction.');
                console.error("Error:", error);
            });
        });
    }
    
    // Edit and delete button handlers
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-delete')) {
            const btn = event.target;
            const id = btn.dataset.id;
            
            if (!confirm('Are you sure you want to delete this transaction?')) {
                return;
            }
            
            fetch('/core/transactions/delete/', {
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: id })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    btn.closest("tr").remove();
                    showSuccess('Transaction deleted successfully!');
                    
                    const tbody = document.querySelector('table tbody');
                    if (tbody && tbody.children.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;" id="forNoTransactions">No transactions found</td></tr>';
                    }
                } else {
                    showError('Failed to delete transaction.');
                }
            })
            .catch(error => {
                showError('Error deleting transaction.');
                console.error("Error:", error);
            });
        }
        
        if (event.target.classList.contains('btn-edit')) {
            const btn = event.target;
            const id = btn.dataset.id;
            const date = btn.dataset.date;
            const description = btn.dataset.description;
            const category = btn.dataset.category;
            const amount = btn.dataset.amount;
            
            showEditModal(id, date, description, category, amount);
        }
    });
});

// Add CSS animations
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
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
}

