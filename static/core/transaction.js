// core/static/core/main.js
// Get CSRF token
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

document.addEventListener("DOMContentLoaded", function () {
    const addExpenseForm = document.querySelector("#addExpenseForm form");
    const transactionsTableBody = document.querySelector("table tbody");

    addExpenseForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(addExpenseForm);

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
                // Append new transaction row
                const newRow = `
                    <tr>
                        <td>${data.date}</td>
                        <td>${data.category}</td>
                        <td>${data.description}</td>
                        <td>₹${data.amount}</td>
                        <td>
                            <button class="btn-small">Edit</button>
                            <button class="btn-small btn-danger" data-id="${data.id}">Delete</button>
                        </td>
                    </tr>
                `;
                transactionsTableBody.insertAdjacentHTML("afterbegin", newRow);

                // Reset form & hide it
                addExpenseForm.reset();
                document.getElementById('addExpenseForm').style.display = 'none';
            } else {
                alert("Failed to add transaction.");
            }
        })
        .catch(() => alert("Error adding transaction."));
    });
});

document.querySelector('tbody').addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-danger')) {
        const btn = event.target;
        const id = btn.dataset.id;
        const csrfToken = getCSRFToken();
        
        fetch('/core/transactions/delete/', {
            method: 'POST',
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => {
            if (response.ok) {
                btn.closest("tr").remove();
            } else {
                alert("Failed to delete transaction");
            }
        })
        .catch(error => console.error("Error:", error));
    }
});
