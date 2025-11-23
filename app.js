const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const jwt = require("jsonwebtoken");  // Для токенов

const app = express();
const port = 3000;
const secretKey = "mySecretKey123";  // Ключ (в prod — секретный)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS (для Authorization)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
    } else {
        next();
    }
});

const db = new Database("users.db");

db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    hobby TEXT,
    email TEXT
)`);
console.log("Таблица users готова.");

// Middleware для проверки токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Нет токена!" });

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ error: "Неверный токен!" });
        req.user = user;
        next();
    });
}

// Логин (POST /login)
app.post("/login", (req, res) => {
    const { login, password } = req.body;
    console.log("Логин:", login);
    if (login === "admin" && password === "123") {
        const token = jwt.sign({ login }, secretKey, { expiresIn: '1h' });
        res.json({ token, message: "Вход успешен!" });
    } else {
        res.status(401).json({ error: "Неверно! Попробуй admin/123" });
    }
});

// Защищённый /all
app.get("/all", authenticateToken, (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM users").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// /save (без токена)
app.post("/save", (req, res) => {
    const { name, age, hobby, email } = req.body;
    if (!name || age < 18) return res.status(400).json({ error: "Ошибка валидации!" });
    try {
        const stmt = db.prepare("INSERT INTO users (name, age, hobby, email) VALUES (?, ?, ?, ?)");
        const result = stmt.run(name, age, hobby, email);
        res.json({ id: result.lastInsertRowid, message: "Сохранено!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Главная
app.get("/", (req, res) => {
    res.send("<h1>Backend для React + JWT</h1>");
});

app.listen(port, () => {
    console.log(`Backend на http://localhost:${port}`);
});