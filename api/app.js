const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
const secretKey = "mySecretKey123";  // Ключ для JWT

app.use(cors());  // CORS для React
app.use(express.json());

const db = new Database("users.db");

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  hobby TEXT,
  email TEXT
)`);
console.log("База готова.");

// Middleware для JWT
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

// /login (POST)
app.post("/login", (req, res) => {
  const { login, password } = req.body;
  if (login === "admin" && password === "123") {
    const token = jwt.sign({ login }, secretKey, { expiresIn: '1h' });
    res.json({ token, message: "Вход успешен!" });
  } else {
    res.status(401).json({ error: "Неверно!" });
  }
});

// Защищённый /all (GET)
app.get("/all", authenticateToken, (req, res) => {
  const rows = db.prepare("SELECT * FROM users").all();
  res.json(rows);
});

// /save (POST, без защиты для простоты)
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

app.get("/", (req, res) => {
  res.send("Backend готов!");
});

app.listen(port, () => {
  console.log(`Backend на http://localhost:${port}`);
});