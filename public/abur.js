// 1. Buat Akun Default Otomatis (abur / 123)
function initDefaultAccount() {
    let usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};
    if (!usersDB['abur']) {
        usersDB['abur'] = '123';
        localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
}
initDefaultAccount();

let isLoginMode = true;

// 2. Cek Akses & Navigasi Halaman
document.addEventListener("DOMContentLoaded", function() {
    const currentUser = localStorage.getItem('loggedInUser');
    const isLoginPage = document.getElementById('auth-section') !== null;
    const isDashboardPage = document.getElementById('app-section') !== null;

    if (isLoginPage && currentUser) {
        window.location.replace('./atok.html');
        return;
    }

    if (isDashboardPage) {
        if (!currentUser) {
            window.location.replace('./index.html');
            return;
        } else {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.innerText = currentUser;
            renderNotes();
            renderTables();
        }
    }
});

// --- LOGIKA LOGIN & REGISTER (index.html) ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const switchTxt = document.getElementById('auth-switch');

    if (title) title.innerText = isLoginMode ? 'Login' : 'Daftar Akun Baru';
    if (btn) btn.innerText = isLoginMode ? 'Masuk' : 'Daftar';
    if (switchTxt) switchTxt.innerText = isLoginMode ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login';
}

function handleAuth() {
    const userElem = document.getElementById('username');
    const passElem = document.getElementById('password');

    if (!userElem || !passElem) return;

    const user = userElem.value.trim();
    const pass = passElem.value.trim();

    if (!user || !pass) {
        alert("Isi Username dan Password!");
        return;
    }

    let usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};

    if (isLoginMode) {
        if (usersDB[user] && usersDB[user] === pass) {
            localStorage.setItem('loggedInUser', user);
            alert("Login Berhasil! Mengalihkan ke Dashboard...");
            window.location.replace('./atok.html');
        } else {
            alert("Username atau Password salah!");
        }
    } else {
        if (usersDB[user]) {
            alert("Username sudah terdaftar!");
        } else {
            usersDB[user] = pass;
            localStorage.setItem('usersDB', JSON.stringify(usersDB));
            localStorage.setItem('loggedInUser', user);
            alert("Daftar Akun Berhasil! Mengalihkan ke Dashboard...");
            window.location.replace('./atok.html');
        }
    }
}

// --- LOGIKA DASHBOARD (atok.html) ---
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.replace('./index.html');
}

function getTableData(tableName) {
    const currentUser = localStorage.getItem('loggedInUser');
    const db = JSON.parse(localStorage.getItem(tableName + 'DB')) || {};
    return db[currentUser] || [];
}

function saveTableData(tableName, data) {
    const currentUser = localStorage.getItem('loggedInUser');
    let db = JSON.parse(localStorage.getItem(tableName + 'DB')) || {};
    db[currentUser] = data;
    localStorage.setItem(tableName + 'DB', JSON.stringify(db));
}

function addTableData(tableName) {
    const descInput = document.getElementById(tableName + 'Desc');
    const amountInput = document.getElementById(tableName + 'Amount');

    if (!descInput || !amountInput) return;
    if (!descInput.value || !amountInput.value) {
        alert("Isi keterangan dan nominal!");
        return;
    }

    const entry = { id: Date.now(), desc: descInput.value, amount: parseInt(amountInput.value) };
    let data = getTableData(tableName);
    data.push(entry);
    saveTableData(tableName, data);

    descInput.value = "";
    amountInput.value = "";
    renderTables();
}

function deleteTableData(tableName, id) {
    let data = getTableData(tableName).filter(item => item.id !== id);
    saveTableData(tableName, data);
    renderTables();
}

function renderTables() {
    ['rusdi', 'amba'].forEach(tableName => {
        const tbody = document.getElementById(tableName + 'TableBody');
        const tfoot = document.getElementById(tableName + 'Total');
        if (!tbody || !tfoot) return;

        const data = getTableData(tableName);
        let total = 0;

        tbody.innerHTML = "";
        data.forEach(item => {
            total += item.amount;
            tbody.innerHTML += `
                <tr>
                    <td>${item.desc}</td>
                    <td>Rp ${new Intl.NumberFormat('id-ID').format(item.amount)}</td>
                    <td class="delete-td" onclick="deleteTableData('${tableName}', ${item.id})">X</td>
                </tr>
            `;
        });
        tfoot.innerText = `Rp ${new Intl.NumberFormat('id-ID').format(total)}`;
    });
}

function getNotes() {
    const currentUser = localStorage.getItem('loggedInUser');
    const db = JSON.parse(localStorage.getItem('notesDB')) || {};
    return db[currentUser] || [];
}

function saveNotes(notes) {
    const currentUser = localStorage.getItem('loggedInUser');
    let db = JSON.parse(localStorage.getItem('notesDB')) || {};
    db[currentUser] = notes;
    localStorage.setItem('notesDB', JSON.stringify(db));
}

function addNote() {
    const titleInput = document.getElementById("noteTitle");
    const contentInput = document.getElementById("noteContent");

    if (!contentInput) return;

    const title = titleInput.value.trim() || "Tanpa Judul";
    const content = contentInput.value.trim();

    if (!content) {
        alert("Isi catatan kosong!");
        return;
    }

    const nums = content.match(/\d+/g);
    const total = nums ? nums.reduce((sum, n) => sum + parseInt(n), 0) : 0;
    const note = { id: Date.now(), title, content, total, date: new Date().toLocaleString("id-ID") };

    let notes = getNotes();
    notes.unshift(note);
    saveNotes(notes);

    if (titleInput) titleInput.value = "";
    contentInput.value = "";
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById("notesContainer");
    if (!container) return;

    container.innerHTML = "";
    getNotes().forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note-card");
        div.innerHTML = `
            <button class="delete-btn" onclick="deleteNoteItem(${note.id})">X</button>
            <h3 style="margin:0 0 5px 0;">${note.title}</h3>
            <p style="white-space:pre-wrap; margin:0 0 10px 0;">${note.content}</p>
            <div class="note-stats">💰 Total Angka: <strong>Rp ${new Intl.NumberFormat('id-ID').format(note.total)}</strong></div>
        `;
        container.appendChild(div);
    });
}

function deleteNoteItem(id) {
    let notes = getNotes().filter(i => i.id !== id);
    saveNotes(notes);
    renderNotes();
}
