// webhook-listener.js
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = 9000; // Порт для прослуховування вебхуків
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; // Встановіть свій секретний ключ
const DEPLOY_SCRIPT_PATH = './deploy.sh'; // Шлях до скрипта розгортання
/////////////////////
// Перевірка, чи встановлено секрет
if (!WEBHOOK_SECRET) {
    console.error('Webhook Error: WEBHOOK_SECRET environment variable is not set!');
    process.exit(1); // Зупиняємо скрипт, якщо секрет не знайдено
}
/////////////////////////////////

// Middleware для парсингу JSON-тіла запиту
app.use(express.json());

app.post('/webhook', (req, res) => {
    // 1. Перевірка підпису від GitHub для безпеки
    const signature = req.headers['x-hub-signature-256'];
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        console.warn('Webhook: Invalid signature. Access denied.');
        return res.status(401).send('Invalid signature');
    }

    // 2. Перевірка, що це push у головну гілку
    if (req.body.ref === 'refs/heads/main') { // Або 'master', залежно від назви вашої гілки
        console.log('Webhook: Valid push to main branch received. Starting deployment...');

        // 3. Запуск скрипта розгортання
        exec(`sh ${DEPLOY_SCRIPT_PATH}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Deployment script error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Deployment script stderr: ${stderr}`);
                return;
            }
            console.log(`Deployment script output: ${stdout}`);
        });

        res.status(200).send('Webhook received and deployment started.');
    } else {
        res.status(200).send('Push was not to the main branch, skipping deployment.');
    }
});

app.listen(PORT, () => {
    console.log(`Webhook listener started on port ${PORT}`);
});