// Membuat akun default otomatis
function initDefaultAccount() {
    let usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};
    if (!usersDB['abur']) {
        usersDB['abur'] = '123'; // Username: abur, Password: 123
        localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
}
initDefaultAccount();

let isLoginMode = true;
let currentUser = null;

// --- SISTEM AKUN ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Daftar Akun Baru';
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Masuk' : 'Daftar';
    document.getElementById('auth-switch').innerText = isLoginMode ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login';
}

function handleAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return alert("Isi Username dan Password!");

    let usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};
    if (isLoginMode) {
        if (usersDB[user] === pass) login(user);
        else alert("Username/Password salah!");
    } else {
        if (usersDB[user]) alert("Username sudah terdaftar!");
        else { usersDB[user] = pass; localStorage.setItem('usersDB', JSON.stringify(usersDB)); login(user); }
    }
}

function login(username) {
    currentUser = username;
    document.getElementById('user-display').innerText = username;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    renderNotes();
    renderTables();
}

function logout() {
    currentUser = null;
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
}

// --- SISTEM TABEL RUSDI & MAS AMBA ---
function getTableData(tableName) {
    const db = JSON.parse(localStorage.getItem(tableName + 'DB')) || {};
    return db[currentUser] || [];
}

function saveTableData(tableName, data) {
    let db = JSON.parse(localStorage.getItem(tableName + 'DB')) || {};
    db[currentUser] = data;
    localStorage.setItem(tableName + 'DB', JSON.stringify(db));
}

function addTableData(tableName) {
    const descInput = document.getElementById(tableName + 'Desc');
    const amountInput = document.getElementById(tableName + 'Amount');
    if (!descInput.value || !amountInput.value) return alert("Isi keterangan dan nominal!");

    const entry = { id: Date.now(), desc: descInput.value, amount: parseInt(amountInput.value) };
    let data = getTableData(tableName);
    data.push(entry);
    saveTableData(tableName, data);
    
    descInput.value = ""; amountInput.value = "";
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

// --- SISTEM CATATAN ---
function getNotes() {
    const db = JSON.parse(localStorage.getItem('notesDB')) || {};
    return db[currentUser] || [];
}

function saveNotes(notes) {
    let db = JSON.parse(localStorage.getItem('notesDB')) || {};
    db[currentUser] = notes;
    localStorage.setItem('notesDB', JSON.stringify(db));
}

function addNote() {
    const title = document.getElementById("noteTitle").value.trim() || "Tanpa Judul";
    const content = document.getElementById("noteContent").value.trim();
    if (!content) return alert("Isi catatan kosong!");

    const nums = content.match(/\d+/g);
    const total = nums ? nums.reduce((sum, n) => sum + parseInt(n), 0) : 0;
    const note = { id: Date.now(), title, content, total, date: new Date().toLocaleString("id-ID") };

    let notes = getNotes(); notes.unshift(note); saveNotes(notes);
    document.getElementById("noteTitle").value = ""; document.getElementById("noteContent").value = "";
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = ""; 
    getNotes().forEach(note => {
        const div = document.createElement("div"); div.classList.add("note-card");
        div.innerHTML = `
            <button class="delete-btn" onclick="let n=getNotes().filter(i=>i.id!==${note.id});saveNotes(n);renderNotes()">X</button>
            <h3 style="margin:0 0 5px 0;">${note.title}</h3>
            <p style="white-space:pre-wrap; margin:0 0 10px 0;">${note.content}</p>
            <div class="note-stats">💰 Total Angka: <strong>Rp ${new Intl.NumberFormat('id-ID').format(note.total)}</strong></div>
        `;
        container.appendChild(div);
    });
}
