require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Підключаємо наш файл для роботи з БД

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Дозволяє запити з інших джерел (нашого фронт-енду)
app.use(express.json()); // Дозволяє серверу читати JSON з тіла запитів

// --- API для роботи з користувачами ---

// 1. Отримати всіх користувачів
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка сервера');
  }
});

// 2. Вхід користувача (або оновлення його імені)
app.post('/api/login', async (req, res) => {
    const { id, name } = req.body;
    if (!id) {
        return res.status(400).json({ message: "ID користувача є обов'язковим" });
    }

    try {
        let userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);

        if (userResult.rows.length > 0) {
            let user = userResult.rows[0];
            if (name && user.name !== name) {
                const updateResult = await db.query('UPDATE users SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
                user = updateResult.rows[0];
            }
            res.json(user);
        } else {
            res.status(403).json({ message: 'Доступ заборонено. Користувача не знайдено' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Помилка сервера');
    }
});


// 3. Додати нового користувача
app.post('/api/users', async (req, res) => {
  const { id, role, name } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO users (id, role, name) VALUES ($1, $2, $3) RETURNING *',
      [id, role, name || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка сервера: Можливо, користувач з таким ID вже існує.');
  }
});

// 4. Видалити користувача
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send(); // 204 No Content - успішне видалення
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка сервера');
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порту ${PORT}`);
});