// --- Настройки для отправки в Telegram ---
const RENDER_BACKEND_URL = 'https://bot-kolledj.onrender.com/send-note';
const MY_TELEGRAM_ID = '8617178928'; // Твой Telegram ID

async function sendNoteToTelegram(taskText, dateStr) {
    if (!taskText || !dateStr) return;
    try {
        await fetch(RENDER_BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: taskText, date: dateStr, user_id: MY_TELEGRAM_ID })
        });
        logToDebug('Заметка успешно отправлена в Telegram!', 'success');
    } catch (err) {
        logToDebug('Сетевая ошибка отправки в ТГ', 'error');
    }
}

// --- Кастомный курсор ---
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
const cursorDot = document.createElement('div');
cursorDot.className = 'cursor-dot';
document.body.appendChild(cursor);
document.body.appendChild(cursorDot);

let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.top = `${mouseY}px`;
    cursorDot.style.left = `${mouseX}px`;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.top = `${cursorY}px`;
    cursor.style.left = `${cursorX}px`;
    requestAnimationFrame(animateCursor);
}
animateCursor();

document.addEventListener('mouseover', (e) => {
    if (e.target.matches('button, input, select, .cal-cell, a, .control-btn')) {
        document.body.classList.add('hovered');
    }
});
document.addEventListener('mouseout', (e) => {
    if (e.target.matches('button, input, select, .cal-cell, a, .control-btn')) {
        document.body.classList.remove('hovered');
    }
});

// --- Состояние календаря и заметок ---
let currentDate = new Date();
let selectedDateStr = formatDateKey(currentDate);
let notesData = JSON.parse(localStorage.getItem('app_notes_data') || '{}');

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function logToDebug(text, type = 'info') {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;
    const timeStr = new Date().toTimeString().split(' ')[0];
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = `[${timeStr}] ${text}`;
    logContent.appendChild(item);
    logContent.scrollTop = logContent.scrollHeight;
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('calendarMonthTitle');
    if (!grid || !monthTitle) return;

    grid.innerHTML = `
        <div class="cal-day-header">Пн</div>
        <div class="cal-day-header">Вт</div>
        <div class="cal-day-header">Ср</div>
        <div class="cal-day-header">Чт</div>
        <div class="cal-day-header">Пт</div>
        <div class="cal-day-header">Сб</div>
        <div class="cal-day-header">Вс</div>
    `;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthsNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    monthTitle.textContent = `${monthsNames[month]} ${year}`;

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell-empty';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cellDate = new Date(year, month, day);
        const dateStr = formatDateKey(cellDate);
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        cell.textContent = day;

        if (dateStr === selectedDateStr) cell.classList.add('active');
        if (notesData[dateStr] && notesData[dateStr].length > 0) cell.classList.add('has-note');

        cell.addEventListener('click', () => {
            selectedDateStr = dateStr;
            renderCalendar();
            renderNotesForSelectedDate();
        });
        grid.appendChild(cell);
    }
}

function renderNotesForSelectedDate() {
    const subtitle = document.getElementById('selectedDateSubtitle');
    const counter = document.getElementById('taskCounter');
    const list = document.getElementById('notesList');
    if (!subtitle || !list) return;

    subtitle.textContent = `Заметки на ${selectedDateStr}`;
    const tasks = notesData[selectedDateStr] || [];
    if (counter) counter.textContent = `${tasks.length} историй`;

    list.innerHTML = '';
    if (tasks.length === 0) {
        list.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 20px;">Нет задач на этот день ✨</div>`;
        return;
    }

    tasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'note-row';
        row.innerHTML = `
            <div class="note-top-line">
                <span style="font-size: 13px;">${task}</span>
                <button class="note-delete-btn" onclick="deleteTask('${selectedDateStr}', ${index})">Удалить</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function addNewTask() {
    const input = document.getElementById('noteInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    if (!notesData[selectedDateStr]) notesData[selectedDateStr] = [];
    notesData[selectedDateStr].push(text);
    localStorage.setItem('app_notes_data', JSON.stringify(notesData));

    input.value = '';
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug(`Добавлена заметка на ${selectedDateStr}: "${text}"`, 'success');
    sendNoteToTelegram(text, selectedDateStr);
}

window.deleteTask = function(dateStr, index) {
    if (!notesData[dateStr]) return;
    notesData[dateStr].splice(index, 1);
    if (notesData[dateStr].length === 0) delete notesData[dateStr];
    localStorage.setItem('app_notes_data', JSON.stringify(notesData));
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug(`Удалена заметка с ${dateStr}`, 'info');
};

// --- Управление модальным окном настроек (Бэкап) ---
const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsBtn')?.addEventListener('click', () => settingsModal.classList.add('active'));
document.getElementById('closeSettingsBtn')?.addEventListener('click', () => settingsModal.classList.remove('active'));

// Экспорт в JSON
document.getElementById('exportBtn')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `calendar_backup_${formatDateKey(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    logToDebug('Бэкап заметок успешно скачан!', 'success');
});

// Импорт из JSON
document.getElementById('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            notesData = JSON.parse(event.target.result);
            localStorage.setItem('app_notes_data', JSON.stringify(notesData));
            renderCalendar();
            renderNotesForSelectedDate();
            logToDebug('Заметки успешно импортированы из файла!', 'success');
            settingsModal.classList.remove('active');
        } catch (err) {
            logToDebug('Ошибка при чтении JSON файла', 'error');
        }
    };
    reader.readAsText(file);
});

// Сброс данных
document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (confirm("Точно удалить все заметки?")) {
        notesData = {};
        localStorage.removeItem('app_notes_data');
        renderCalendar();
        renderNotesForSelectedDate();
        logToDebug('Все данные стерты', 'info');
        settingsModal.classList.remove('active');
    }
});

// --- Управление AI чатом (с умным парсингом команд) ---
const aiChatWindow = document.getElementById('aiChatWindow');
document.getElementById('toggleAiChatBtn')?.addEventListener('click', () => aiChatWindow.classList.toggle('active'));
document.getElementById('closeAiChatBtn')?.addEventListener('click', () => aiChatWindow.classList.remove('active'));

const aiMessages = document.getElementById('aiChatMessages');
const aiInput = document.getElementById('aiChatInput');

function sendAiMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    // Выводим сообщение пользователя в чат
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    aiMessages.appendChild(userMsg);
    aiInput.value = '';
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Имитация ответа с умным анализом текста
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'ai-msg ai';

        const lowerText = text.toLowerCase();

        // Проверяем, просит ли пользователь добавить заметку
        if (lowerText.includes('добавь заметку') || lowerText.includes('запиши') || lowerText.includes('напомни')) {
            let targetDateStr = selectedDateStr;
            
            if (lowerText.includes('21 сентября')) {
                targetDateStr = `${currentDate.getFullYear()}-09-21`;
            } else if (lowerText.includes('сегодня')) {
                targetDateStr = formatDateKey(new Date());
            }

            // Выделяем текст задачи из сообщения
            let taskContent = text
                .replace(/добавь заметку на.*?(сентября|октября|ноября|декабря|января|февраля|марта|апреля|мая|июня|июля|августа)/i, '')
                .replace(/добавь заметку/i, '')
                .replace(/запиши/i, '')
                .trim();

            if (!taskContent) taskContent = text;

            // Сохраняем в память
            if (!notesData[targetDateStr]) notesData[targetDateStr] = [];
            notesData[targetDateStr].push(taskContent);
            localStorage.setItem('app_notes_data', JSON.stringify(notesData));

            // Обновляем интерфейс
            renderCalendar();
            renderNotesForSelectedDate();
            
            // Дублируем отправку на бэкенд Telegram
            sendNoteToTelegram(taskContent, targetDateStr);

            botMsg.textContent = `Готово! 🎯 Я добавил заметку на ${targetDateStr}: "${taskContent}" и отправил её в Telegram.`;
            logToDebug(`ИИ добавил задачу на ${targetDateStr}: ${taskContent}`, 'success');
        } else {
            botMsg.textContent = `Я услышал тебя! Чтобы я добавил задачу в календарь, напиши: «Добавь заметку на [дата] [текст задачи]». 🚀`;
        }

        aiMessages.appendChild(botMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 600);
}

document.getElementById('aiSendBtn')?.addEventListener('click', sendAiMessage);
aiInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAiMessage(); });

// Навигация по месяцам
document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById('addNoteBtn')?.addEventListener('click', addNewTask);
document.getElementById('noteInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addNewTask(); });
document.getElementById('clearLogsBtn')?.addEventListener('click', () => { document.getElementById('logContent').innerHTML = ''; });

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug('Система успешно инициализирована с AI и бэкапом.', 'success');
});
