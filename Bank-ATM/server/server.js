const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;
const wss = new WebSocket.Server({ port: 8080 });

// Datos en memoria para usuarios y la clave secreta para JWT
const users = {};
const SECRET_KEY = 'your_secret_key';

// Configuración del transporte de correo electrónico
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password'
    }
});

app.use(bodyParser.json());

// Registro de usuario
app.post('/register', async (req, res) => {
    const { username, pin, email } = req.body;
    if (users[username]) {
        return res.status(400).send('User already exists');
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    users[username] = { pin: hashedPin, email, transactions: [], balance: 0 };
    res.status(201).send('User registered');
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    const { username, pin } = req.body;
    const user = users[username];
    if (!user || !(await bcrypt.compare(pin, user.pin))) {
        return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Obtener transacciones
app.get('/transactions', authenticate, (req, res) => {
    const { username } = req.user;
    res.json(users[username].transactions);
});

// Crear una nueva transacción
app.post('/transaction', authenticate, (req, res) => {
    const { username } = req.user;
    const { type, amount } = req.body;
    const user = users[username];
    let balance = user.balance;

    if (type === 'withdraw' || type === 'pay') {
        if (amount > balance) {
            return res.status(400).send('Insufficient funds');
        }
        balance -= amount;
    } else if (type === 'deposit') {
        balance += amount;
    }

    const newTransaction = {
        date: new Date().toLocaleString(),
        type,
        amount,
    };
    user.transactions.push(newTransaction);
    user.balance = balance;

    broadcast({ type: 'new_transaction', transaction: newTransaction });
    res.status(201).json(newTransaction);
});

// Actualizar el perfil del usuario
app.post('/update-profile', authenticate, async (req, res) => {
    const { username } = req.user;
    const { email, newPin } = req.body;
    if (email) users[username].email = email;
    if (newPin) {
        const hashedPin = await bcrypt.hash(newPin, 10);
        users[username].pin = hashedPin;
    }
    res.status(200).send('Profile updated');
});

// Recuperar el PIN
app.post('/recover-pin', async (req, res) => {
    const { username, email } = req.body;
    const user = users[username];
    if (!user || user.email !== email) {
        return res.status(400).send('Invalid user or email');
    }

    const newPin = Math.random().toString(36).substring(2, 6);
    const hashedPin = await bcrypt.hash(newPin, 10);
    user.pin = hashedPin;

    const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: 'PIN Recovery',
        text: `Your new PIN is: ${newPin}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email');
        }
        res.status(200).send('New PIN sent to email');
    });
});

// Middleware de autenticación
function authenticate(req, res, next) {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send('Invalid token');
    }
}

// Broadcast para notificaciones WebSocket
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', ws => {
    console.log('Nuevo cliente conectado');
    ws.on('message', message => {
        console.log(`Mensaje recibido: ${message}`);
    });
    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
