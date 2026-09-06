const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

// Hubungkan ke Database Cloud (Ganti URL ini dengan URL Database PostgreSQL kamu, misal dari Supabase/Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Inisialisasi Tabel Database otomatis saat pertama kali jalan
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(50) PRIMARY KEY,
                password VARCHAR(100) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                title TEXT,
                content TEXT,
                total NUMERIC,
                date TEXT
            );
            CREATE TABLE IF NOT EXISTS tables_data (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                table_name VARCHAR(20),
                description TEXT,
                amount NUMERIC
            );
        `);
        // Buat akun default 'abur' / '123' jika belum ada
        const res = await pool.query("SELECT * FROM users WHERE username = 'abur'");
        if (res.rows.length === 0) {
            await pool.query("INSERT INTO users (username, password) VALUES ('abur', '123')");
        }
        console.log("Database siap!");
    } catch (err) {
        console.error("Gagal inisialisasi database:", err);
    }
}
initDB();

// --- API AUTH ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const check = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (check.rows.length > 0) return res.status(400).json({ error: "Username sudah terdaftar!" });

        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: "Username atau Password salah!" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API CATATAN UMUM ---
app.get('/api/notes/:username', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM notes WHERE username = $1 ORDER BY id DESC", [req.params.username]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notes', async (req, res) => {
    const { username, title, content, total, date } = req.body;
    try {
        await pool.query("INSERT INTO notes (username, title, content, total, date) VALUES ($1, $2, $3, $4, $5)", [username, title, content, total, date]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API TABEL (RUSDI & AMBA) ---
app.get('/api/tables/:username/:tableName', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tables_data WHERE username = $1 AND table_name = $2 ORDER BY id DESC", [req.params.username, req.params.tableName]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tables', async (req, res) => {
    const { username, tableName, desc, amount } = req.body;
    try {
        await pool.query("INSERT INTO tables_data (username, table_name, description, amount) VALUES ($1, $2, $3, $4)", [username, tableName, desc, amount]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tables/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM tables_data WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

module.exports = app;

-- 1. Tabel untuk menyimpan data akun pengguna
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL
);

-- 2. Tabel untuk catatan umum
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    title TEXT,
    content TEXT,
    total NUMERIC,
    date TEXT
);

-- 3. Tabel untuk data pencatatan toko (Rusdi Barbershop & Sosis Mas Amba)
CREATE TABLE IF NOT EXISTS tables_data (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    table_name VARCHAR(20),
    description TEXT,
    amount NUMERIC
);

-- Masukkan akun default 'abur' / '123'
INSERT INTO users (username, password) 
VALUES ('anjay', 'akuadmin') 
ON CONFLICT (username) DO NOTHING;
