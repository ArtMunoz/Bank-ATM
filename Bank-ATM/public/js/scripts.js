const API_URL = 'http://localhost:3000';
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    // Manejo del formulario de inicio de sesión
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const pin = document.getElementById('pin').value;
            const response = await loginUser(username, pin);
            if (response) {
                localStorage.setItem('token', response.token);
                toastr.success('Inicio de sesión exitoso', 'Éxito');
                window.location.href = 'actions.html';
            } else {
                toastr.error('Credenciales inválidas', 'Error');
            }
        });
    }

    // Manejo del formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const pin = document.getElementById('registerPin').value;
            const email = document.getElementById('registerEmail').value;
            const success = await registerUser(username, pin, email);
            if (success) {
                toastr.success('Usuario registrado con éxito', 'Éxito');
                showLoginForm();
            } else {
                toastr.error('Error al registrar el usuario', 'Error');
            }
        });
    }

    // Manejo del formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const newPin = document.getElementById('newPin').value;
            const success = await updateProfile(email, newPin);
            if (success) {
                toastr.success('Perfil actualizado con éxito', 'Éxito');
            } else {
                toastr.error('Error al actualizar el perfil', 'Error');
            }
        });
    }

    // Manejo del formulario de recuperación de PIN
    const recoverPinForm = document.getElementById('recoverPinForm');
    if (recoverPinForm) {
        recoverPinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('recoverUsername').value;
            const email = document.getElementById('recoverEmail').value;
            const success = await recoverPin(username, email);
            if (success) {
                toastr.success('Nuevo PIN enviado a su correo electrónico', 'Éxito');
                showLoginForm();
            } else {
                toastr.error('Error al recuperar el PIN', 'Error');
            }
        });
    }

    // Otras inicializaciones
    if (document.getElementById('transactionTable')) {
        displayTransactionHistory();

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', filterTransactions);
    }

    if (document.getElementById('transactionChart')) {
        displayTransactionChart();
    }

    if (document.getElementById('transactionTypeChart')) {
        displayTransactionTypeChart();
    }

    if (document.getElementById('summaryContainer')) {
        displaySummary();
    }

    const transactionFormElement = document.getElementById('transactionFormElement');
    if (transactionFormElement) {
        transactionFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('amount').value);
            const transactionType = document.getElementById('transactionType').innerText;
            handleTransaction(transactionType, amount);
            closeTransactionForm();
        });
    }
});

// Función para iniciar sesión
async function loginUser(username, pin) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
    }
    return null;
}

// Función para registrar usuario
async function registerUser(username, pin, email) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin, email })
        });
        return response.ok;
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return false;
    }
}

// Función para actualizar el perfil
async function updateProfile(email, newPin) {
    try {
        const response = await fetch(`${API_URL}/update-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, newPin })
        });
        return response.ok;
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        return false;
    }
}

// Función para recuperar el PIN
async function recoverPin(username, email) {
    try {
        const response = await fetch(`${API_URL}/recover-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        return response.ok;
    } catch (error) {
        console.error('Error al recuperar el PIN:', error);
        return false;
    }
}

// Función para mostrar el formulario de registro
function showRegisterForm() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'block';
    toastr.info('Por favor, complete el formulario de registro', 'Información');
}

// Función para mostrar el formulario de inicio de sesión
function showLoginForm() {
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.recover-pin-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
    toastr.info('Por favor, inicie sesión con sus credenciales', 'Información');
}

// Función para mostrar el formulario de recuperación de PIN
function showRecoverPinForm() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.recover-pin-container').style.display = 'block';
    toastr.info('Recupere su PIN ingresando su usuario y correo electrónico', 'Información');
}

// Función para mostrar una alerta
function showAlert(message) {
    toastr.info(message);
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    toastr.success('Sesión cerrada', 'Éxito');
    window.location.href = 'index.html';
}

// Función para manejar las transacciones
async function handleTransaction(type, amount) {
    if (amount <= 0) {
        toastr.error('El monto debe ser positivo', 'Error');
        return;
    }

    const response = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, amount })
    });

    if (response.ok) {
        const transaction = await response.json();
        toastr.success(`Transacción de ${type} realizada con éxito`, 'Éxito');
        socket.send(JSON.stringify({ type: 'new_transaction', transaction }));
        displayTransactionHistory();
    } else {
        toastr.error('Error al realizar la transacción', 'Error');
    }
}

// Función para mostrar el historial de transacciones
async function displayTransactionHistory() {
    const response = await fetch(`${API_URL}/transactions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
        const transactions = await response.json();
        const transactionTableBody = document.querySelector('#transactionTable tbody');
        transactionTableBody.innerHTML = ''; // Clear existing rows

        transactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.type}</td>
                <td>$${transaction.amount.toFixed(2)}</td>
                <td>
                    <button onclick="editTransaction(${index})">Editar</button>
                    <button onclick="deleteTransaction(${index})">Eliminar</button>
                </td>`;
            transactionTableBody.appendChild(row);
        });
    } else {
        toastr.error('Error al obtener las transacciones', 'Error');
    }
}

// Función para eliminar una transacción
async function deleteTransaction(index) {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transaction = transactions[index];

    const response = await fetch(`${API_URL}/transaction/${transaction.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        displayTransactionHistory();
    } else {
        toastr.error('Error al eliminar la transacción', 'Error');
    }
}

// Función para mostrar una gráfica de las transacciones
function displayTransactionChart() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const labels = transactions.map(transaction => transaction.date);
    const data = transactions.map(transaction => transaction.amount);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Monto de Transacciones',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const transactionChart = new Chart(
        document.getElementById('transactionChart'),
        config
    );
}

// Función para mostrar una gráfica de los tipos de transacciones
function displayTransactionTypeChart() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transactionTypes = transactions.map(transaction => transaction.type);
    const typeCounts = transactionTypes.reduce((counts, type) => {
        counts[type] = (counts[type] || 0) + 1;
        return counts;
    }, {});

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Número de Transacciones',
            data: data,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    };

    const transactionTypeChart = new Chart(
        document.getElementById('transactionTypeChart'),
        config
    );
}

// Función para mostrar el resumen de transacciones
function displaySummary() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const balance = getBalance();
    const summaryContainer = document.getElementById('summaryContainer');
    const summaryList = document.createElement('ul');
    
    transactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.innerText = `${transaction.date} - ${transaction.type}: $${transaction.amount.toFixed(2)}`;
        summaryList.appendChild(listItem);
    });

    const balanceItem = document.createElement('li');
    balanceItem.innerText = `Saldo actual: $${balance.toFixed(2)}`;
    summaryList.appendChild(balanceItem);

    summaryContainer.appendChild(summaryList);
}

// Función para cerrar el formulario de transacciones
function closeTransactionForm() {
    const transactionForm = document.getElementById('transactionForm');
    transactionForm.style.display = 'none';
}

// Función para obtener el saldo actual
function getBalance() {
    return parseFloat(localStorage.getItem('balance')) || 0;
}
