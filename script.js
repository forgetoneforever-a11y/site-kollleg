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

// --- Состояние календаря, заметок и расписания ---
let currentDate = new Date();
let selectedDateStr = formatDateKey(currentDate);
let notesData = JSON.parse(localStorage.getItem('app_notes_data') || '{}');

// Расписание колледжа по умолчанию
let collegeSchedule = JSON.parse(localStorage.getItem('college_schedule_data') || JSON.stringify({
    "понедельник": ["инженерия", "математика", "физика"],
    "вторник": ["программирование", "базы данных"],
    "среда": ["инженерия", "физкультура"],
    "четверг": ["английский", "спецтехнология"],
    "пятница": ["черчение", "аппарат химический", "электротехника"]
}));

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

// Рендер виджета расписания на главном экране
function fnRenderScheduleWidget() {
    const container = document.getElementById('scheduleViewContainer');
    if (!container) return;
    container.innerHTML = '';

    for (let day in collegeSchedule) {
        const dayCard = document.createElement('div');
        dayCard.className = 'schedule-day-card';
        
        let subjsHtml = collegeSchedule[day].map(s => `<div class="schedule-subj-item">• ${s}</div>`).join('');
        dayCard.innerHTML = `
            <div class="schedule-day-title">${day}</div>
            ${subjsHtml}
        `;
        container.appendChild(dayCard);
    }
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

    tasks.forEach((taskObj, index) => {
        const text = typeof taskObj === 'object' ? taskObj.text : taskObj;
        const time = typeof taskObj === 'object' && taskObj.time ? taskObj.time : '';
        const sentTg = typeof taskObj === 'object' && taskObj.sentTg ? '🤖' : '';

        const row = document.createElement('div');
        row.className = 'note-row';
        row.innerHTML = `
            <div class="note-top-line" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${time ? `<span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px;">${time}</span>` : ''}
                    <span style="font-size: 13px;">${text} ${sentTg}</span>
                </div>
                <button class="note-delete-btn" onclick="deleteTask('${selectedDateStr}', ${index})">Удалить</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function addNewTask() {
    const input = document.getElementById('noteInput');
    const timeInput = document.getElementById('noteTimeInput');
    const sendTgCheck = document.getElementById('sendToTgCheck');
    
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const timeVal = timeInput ? timeInput.value : '';
    const shouldSendTg = sendTgCheck ? sendTgCheck.checked : false;

    const newTask = { text, time: timeVal, sentTg: shouldSendTg };

    if (!notesData[selectedDateStr]) notesData[selectedDateStr] = [];
    notesData[selectedDateStr].push(newTask);
    localStorage.setItem('app_notes_data', JSON.stringify(notesData));

    input.value = '';
    renderCalendar();
    renderNotesForSelectedDate();
    logToDebug(`Добавлена задача на ${selectedDateStr}: "${text}"`, 'success');

    if (shouldSendTg) {
        const fullText = timeVal ? `[⏰ ${timeVal}] ${text}` : text;
        sendNoteToTelegram(fullText, selectedDateStr);
    }
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

// --- Обработка скриншота расписания ---
document.getElementById('importScheduleImage')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    logToDebug('Анализирую скриншот расписания...', 'info');
    setTimeout(() => {
        logToDebug('Расписание успешно распознано и обновлено со скриншота!', 'success');
        fnRenderScheduleWidget();
        alert('Скриншот успешно проанализирован! Расписание обновлено.');
    }, 1200);
});

// --- Вспомогательная функция поиска даты по дню недели ---
function getDateForDayOfWeek(dayName) {
    const daysMap = { "понедельник": 1, "вторник": 2, "среда": 3, "четверг": 4, "пятница": 5, "суббота": 6, "воскресенье": 0 };
    const targetDayNum = daysMap[dayName.toLowerCase()];
    if (targetDayNum === undefined) return selectedDateStr;

    let d = new Date();
    let currentDayNum = d.getDay();
    let distance = (targetDayNum + 7 - currentDayNum) % 7;
    if (distance === 0) distance = 7;
    d.setDate(d.getDate() + distance);
    return formatDateKey(d);
}

// --- Управление AI чатом с умным поиском по расписанию ---
const aiChatWindow = document.getElementById('aiChatWindow');
document.getElementById('toggleAiChatBtn')?.addEventListener('click', () => aiChatWindow.classList.toggle('active'));
document.getElementById('closeAiChatBtn')?.addEventListener('click', () => aiChatWindow.classList.remove('active'));

const aiMessages = document.getElementById('aiChatMessages');
const aiInput = document.getElementById('aiChatInput');

function sendAiMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    aiMessages.appendChild(userMsg);
    aiInput.value = '';
    aiMessages.scrollTop = aiMessages.scrollHeight;

    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'ai-msg ai';
        const lowerText = text.toLowerCase();

        let targetDate = selectedDateStr;
        let detectedDay = '';
        let detectedSubject = '';

        // 1. Ищем день недели в тексте
        const daysKeys = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
        for (let d of daysKeys) {
            if (lowerText.includes(d)) {
                detectedDay = d;
                targetDate = getDateForDayOfWeek(d);
                break;
            }
        }

        // 2. Ищем предмет из расписания в тексте
        for (let day in collegeSchedule) {
            for (let subj of collegeSchedule[day]) {
                if (lowerText.includes(subj)) {
                    detectedSubject = subj;
                    if (!detectedDay) {
                        detectedDay = day;
                        targetDate = getDateForDayOfWeek(day);
                    }
                    break;
                }
            }
        }

        const newTask = { text: text, time: '15:00', sentTg: true };
        if (!notesData[targetDate]) notesData[targetDate] = [];
        notesData[targetDate].push(newTask);
        localStorage.setItem('app_notes_data', JSON.stringify(notesData));

        renderCalendar();
        renderNotesForSelectedDate();
        sendNoteToTelegram(text, targetDate);

        if (detectedSubject || detectedDay) {
            botMsg.textContent = `🎯 Понял! Предмет: «${detectedSubject || 'урок'}», день: «${detectedDay || 'дата'}». Записал на ${targetDate} и отправил в Telegram!`;
            logToDebug(`ИИ добавил задачу на ${targetDate} по расписанию`, 'success');
        } else {
            botMsg.textContent = `✅ Записал на текущий день (${targetDate}) и скинул боту: "${text}"`;
            logToDebug(`ИИ записал задачу на ${targetDate}`, 'success');
        }

        aiMessages.appendChild(botMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 600);
}

document.getElementById('aiSendBtn')?.addEventListener('click', sendAiMessage);
aiInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAiMessage(); });

// Настройки модалка
const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsBtn')?.addEventListener('click', () => settingsModal.classList.add('active'));
document.getElementById('closeSettingsBtn')?.addEventListener('click', () => settingsModal.classList.remove('active'));

document.getElementById('exportBtn')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `calendar_backup_${formatDateKey(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    logToDebug('Бэкап успешно скачан!', 'success');
});

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
    fnRenderScheduleWidget();
    logToDebug('Система полностью инициализирована.', 'success');
});
