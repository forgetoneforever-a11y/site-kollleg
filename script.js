// --- Настройки для отправки в Telegram ---
const RENDER_BACKEND_URL = 'https://bot-kolledj.onrender.com/send-note';
const MY_TELEGRAM_ID = '8617178928'; // Твой Telegram ID

// Функция отправки уведомления боту
async function sendNoteToTelegram(taskText, dateStr) {
    if (!taskText || !dateStr) return;
    
    try {
        const response = await fetch(RENDER_BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: taskText,
                date: dateStr,
                user_id: MY_TELEGRAM_ID
            })
        });

        if (response.ok) {
            logToDebug('Заметка успешно отправлена в Telegram!', 'success');
        } else {
            logToDebug('Ошибка сервера при отправке в ТГ', 'error');
        }
    } catch (err) {
        logToDebug('Сетевая ошибка отправки в ТГ', 'error');
    }
}

// --- Основной логический код приложения ---

// Кастомный курсор
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
const cursorDot = document.createElement('div');
cursorDot.className = 'cursor-dot';
document.body.appendChild(cursor);
document.body.appendChild(cursorDot);

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

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

// Добавление эффекта наведения для интерактивных элементов
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

// Состояние календаря и заметок
let currentDate = new Date();
let selectedDateStr = formatDateKey(currentDate);
let notesData = JSON.parse(localStorage.getItem('app_notes_data') || '{}');

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Логирование в интерфейсе
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

// Рендер календаря
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

    const monthsNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    monthTitle.textContent = `${monthsNames[month]} ${year}`;

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Пустые ячейки для выравнивания дней недели
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell-empty';
        grid.appendChild(emptyCell);
    }

    // Дни месяца
    for (let day = 1; day <= totalDays; day++) {
        const cellDate = new Date(year, month, day);
        const dateStr = formatDateKey(cellDate);
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        cell.textContent = day;

        if (dateStr === selectedDateStr) {
            cell.classList.add('active');
        }

        if (notesData[dateStr] && notesData[dateStr].length > 0) {
            cell.classList.add('has-note');
        }

        cell.addEventListener('click', () => {
            selectedDateStr = dateStr;
            renderCalendar();
            renderNotesForSelectedDate();
        });

        grid.appendChild(cell);
    }
}

// Рендер списка заметок на выбранную дату
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

// Добавление новой задачи
function addNewTask() {
    const input = document.getElementById('noteInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    if (!notesData[selectedDateStr]) {
        notesData[selectedDateStr] = [];
    }
    notesData[selectedDateStr].push(text);
    localStorage.setItem('app_notes_data', JSON.stringify(notesData));

    input.value = '';
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug(`Добавлена заметка на ${selectedDateStr}: "${text}"`, 'success');

    // 🚀 Отправляем задачу в Telegram-бот на Render
    sendNoteToTelegram(text, selectedDateStr);
}

// Удаление задачи
window.deleteTask = function(dateStr, index) {
    if (!notesData[dateStr]) return;
    notesData[dateStr].splice(index, 1);
    if (notesData[dateStr].length === 0) {
        delete notesData[dateStr];
    }
    localStorage.setItem('app_notes_data', JSON.stringify(notesData));
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug(`Удалена заметка с ${dateStr}`, 'info');
};

// Переключение месяцев в календаре
document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Кнопка добавления задачи по клику и Enter
document.getElementById('addNoteBtn')?.addEventListener('click', addNewTask);
document.getElementById('noteInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNewTask();
});

// Очистка логов
document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
    const logContent = document.getElementById('logContent');
    if (logContent) logContent.innerHTML = '';
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug('Система успешно инициализирована.', 'success');
});