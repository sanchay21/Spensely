// core/static/core/main.js
// Get CSRF token
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

const editTransactionForm = document.querySelector("#editTransactionForm");
const transactionsTableBody = document.querySelector("table tbody");

document.addEventListener("DOMContentLoaded", function () {
    const addTransactionForm = document.querySelector("#addTransactionForm");
    // const transactionsTableBody = document.querySelector("table tbody");

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
                // Append new transaction row
                console.log(data.description+" - "+ data.amount)

                const amountColor = data.category === "Expense" ? "red" : "green";

                const newRow = `
                    <tr>
                        <td>${data.date}</td>
                        <td>${data.category}</td>
                        <td>${data.description}</td>
                        <td style="color:${amountColor};">₹${data.amount}</td>
                        <td>
                            <button class="btn-small btn-edit">Edit</button>
                            <button class="btn-small btn-delete" data-id="${data.id}" >Delete</button>
                        </td>
                    </tr>
                `;
                transactionsTableBody.insertAdjacentHTML("afterbegin", newRow);
                const noTmsg = document.getElementById('forNoTransactions')
                if(noTmsg){
                    noTmsg.style.display = "none";
                }

                // Reset form & hide it
                addTransactionForm.reset();
                // Shift focus away from close button
                document.activeElement.blur();
                // 🔹 Hide Bootstrap modal instead of style.display
                const modalEl = document.getElementById('addExpenseModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            } else {
                alert("Failed to add transaction.");
            }
        })
        .catch((error) => {
            alert("Error adding transaction.")
            console.error("Error = ", error)
        }); 
    });
});

document.querySelector('tbody').addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-delete')) {
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

    if(event.target.classList.contains('btn-edit')){
        const btn = event.target;
        const id = btn.dataset.id;
        const date = btn.dataset.date
        const description = btn.dataset.description
        const category = btn.dataset.category
        const amount = btn.dataset.amount
        console.log(id, date, description, category, amount);

        let inputDate = date;
        let JSdate = new Date(inputDate);
        let formattedDate = JSdate.toISOString().split("T")[0];

        document.getElementById('Editdescription').value = description;
        document.getElementById('Editdate').value = formattedDate;
        document.getElementById('Editcategory').value = category;
        document.getElementById('Editamount').value = amount;

        document.getElementById('editID').value = id;
    }
});

editTransactionForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(editTransactionForm);
    const id = formData.get("editID"); 

    console.log("Transaction to edit = ", id)

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
                // ✅ Update row in table
                const row = transactionsTableBody.querySelector(`.btn-delete[data-id="${id}"]`).closest("tr");
                row.cells[0].innerText = data.date;
                row.cells[1].innerText = data.category;
                row.cells[2].innerText = data.description;
                row.cells[3].innerHTML = `<span style="color:${data.category === "Expense" ? "red" : "green"};">₹${data.amount}</span>`;

                // Hide modal
                const modalEl = document.getElementById("editExpenseModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            } else {
                alert("Failed to update transaction.");
            }
        })
        .catch(error => {
            console.error("Error updating transaction:", error);
            alert("Error updating transaction.");
        });
});

