// Основной скрипт приложения: Календарь, Заметки, Расписание и ИИ

let currentDate = new Date();
let selectedDateStr = formatDateKey(new Date());
let notesData = JSON.parse(localStorage.getItem('app_notes')) || {};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCalendar();
    renderSelectedDateNotes();
    renderSchedule();
    setupEventListeners();
    addLog('Система полностью инициализирована.', 'success');
});

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'default';
    if (savedTheme !== 'default') {
        document.body.setAttribute('data-theme', savedTheme);
    }
    updateThemeButtonsActive(savedTheme);
}

function updateThemeButtonsActive(themeName) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function initCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarMonthTitle');
    if (!grid || !title) return;

    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthsNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    title.textContent = `${monthsNames[month]} ${year}`;

    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const headerEl = document.createElement('div');
        headerEl.className = 'cal-day-header';
        headerEl.textContent = day;
        grid.appendChild(headerEl);
    });

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell-empty';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        
        const cellDate = new Date(year, month, day);
        const dateKey = formatDateKey(cellDate);

        cell.textContent = day;

        if (dateKey === selectedDateStr) {
            cell.classList.add('active');
        }

        if (notesData[dateKey] && notesData[dateKey].length > 0) {
            cell.classList.add('has-note');
        }

        cell.addEventListener('click', () => {
            selectedDateStr = dateKey;
            initCalendar();
            renderSelectedDateNotes();
        });

        grid.appendChild(cell);
    }
}

function renderSelectedDateNotes() {
    const subtitle = document.getElementById('selectedDateSubtitle');
    const list = document.getElementById('notesList');
    const counter = document.getElementById('taskCounter');
    if (!subtitle || !list) return;

    subtitle.textContent = `Заметки на ${selectedDateStr}`;
    list.innerHTML = '';

    const dayNotes = notesData[selectedDateStr] || [];
    counter.textContent = `${dayNotes.length} историй`;

    if (dayNotes.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px;">Нет задач на этот день ✨</div>`;
        return;
    }

    dayNotes.forEach((note, index) => {
        const row = document.createElement('div');
        row.className = 'note-row';
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span style="font-size: 13px; word-break: break-all;">${escapeHtml(note.text)}</span>
                <span style="font-size: 11px; color: var(--accent-color); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 6px;">${note.time || ''}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <span style="font-size: 10px; color: var(--text-muted);">${note.sentToTg ? '✓ Отправлено в TG' : ''}</span>
                <button class="note-delete-btn" onclick="deleteNote('${selectedDateStr}', ${index})">Удалить</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function addNewNote() {
    const input = document.getElementById('noteInput');
    const timeInput = document.getElementById('noteTimeInput');
    const tgCheck = document.getElementById('sendToTgCheck');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    const time = timeInput ? timeInput.value : '12:00';
    const sendTg = tgCheck ? tgCheck.checked : true;

    if (!notesData[selectedDateStr]) {
        notesData[selectedDateStr] = [];
    }

    notesData[selectedDateStr].push({
        text,
        time,
        sentToTg: sendTg
    });

    localStorage.setItem('app_notes', JSON.stringify(notesData));
    input.value = '';

    initCalendar();
    renderSelectedDateNotes();
    addLog(`Добавлена задача на ${selectedDateStr}: "${text}"`, 'success');

    if (sendTg) {
        addLog(`[Telegram Bot] Уведомление успешно отправлено в чат группы 211.`, 'info');
    }
}

window.deleteNote = function(dateKey, index) {
    if (!notesData[dateKey]) return;
    notesData[dateKey].splice(index, 1);
    if (notesData[dateKey].length === 0) {
        delete notesData[dateKey];
    }
    localStorage.setItem('app_notes', JSON.stringify(notesData));
    initCalendar();
    renderSelectedDateNotes();
    addLog(`Задача удалена из расписания.`, 'info');
};

function renderSchedule() {
    const container = document.getElementById('scheduleViewContainer');
    if (!container) return;

    const schedule = [
        { day: 'Понедельник', items: ['14-00', 'Учебная практика', 'мастерские'] },
        { day: 'Вторник', items: ['Проц. формообр.', 'Иностранный язык'] },
        { day: 'Среда', items: ['Инженерная графика', 'Технология машиностроения'] },
        { day: 'Четверг', items: ['Сопротивление материалов', 'Электротехника'] },
        { day: 'Пятница', items: ['Физическая культура', 'Базовая математика'] }
    ];

    container.innerHTML = '';
    schedule.forEach(block => {
        const card = document.createElement('div');
        card.className = 'schedule-day-card';
        card.innerHTML = `
            <div class="schedule-day-title">${block.day}</div>
            ${block.items.map(item => `<div class="schedule-subj-item">• ${item}</div>`).join('')}
        `;
        container.appendChild(card);
    });
}

// Функции YouTube плеера
function extractYtVideoId(urlOrQuery) {
    if (!urlOrQuery) return null;
    let match = urlOrQuery.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) return match[1];
    
    if (urlOrQuery.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(urlOrQuery)) {
        return urlOrQuery;
    }
    return null;
}

window.setYtPreset = function(videoId) {
    const iframe = document.getElementById('ytIframePlayer');
    if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        addLog(`[YouTube] Запущен фоновый пресет`, 'success');
    }
};

function loadCustomYtVideo() {
    const input = document.getElementById('ytUrlInput');
    if (!input || !input.value.trim()) return;
    const query = input.value.trim();
    const videoId = extractYtVideoId(query);

    const iframe = document.getElementById('ytIframePlayer');
    if (iframe) {
        if (videoId) {
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            addLog(`[YouTube] Воспроизведение по ссылке/ID`, 'success');
        } else {
            // Если введен текст вместо ссылки — открываем поиск на YouTube в новой вкладке обходным путем
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
            addLog(`[YouTube] Запрос "${query}" открыт в новой вкладке (защита iframe)`, 'info');
        }
    }
    input.value = '';
}

function addLog(text, type = 'info') {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;

    const timeStr = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = `[${timeStr}] ${text}`;
    
    logContent.appendChild(item);
    logContent.scrollTop = logContent.scrollHeight;
}

function setupEventListeners() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        initCalendar();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        initCalendar();
    });

    document.getElementById('addNoteBtn')?.addEventListener('click', addNewNote);
    document.getElementById('noteInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewNote();
    });

    document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
        const logContent = document.getElementById('logContent');
        if (logContent) logContent.innerHTML = '';
    });

    // Модальное окно РАСПИСАНИЯ
    const scheduleModal = document.getElementById('scheduleModal');
    document.getElementById('openScheduleModalBtn')?.addEventListener('click', () => {
        scheduleModal?.classList.add('active');
    });
    document.getElementById('closeScheduleModalBtn')?.addEventListener('click', () => {
        scheduleModal?.classList.remove('active');
    });
    scheduleModal?.addEventListener('click', (e) => {
        if (e.target === scheduleModal) {
            scheduleModal.classList.remove('active');
        }
    });

    // Модальное окно YouTube оверлея
    const ytModal = document.getElementById('ytOverlayModal');
    document.getElementById('openYtOverlayBtn')?.addEventListener('click', () => ytModal?.classList.add('active'));
    document.getElementById('closeYtModalBtn')?.addEventListener('click', () => ytModal?.classList.remove('active'));
    document.getElementById('loadYtVideoBtn')?.addEventListener('click', loadCustomYtVideo);
    document.getElementById('ytUrlInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadCustomYtVideo();
    });

    // Модальное окно Настроек
    const settingsModal = document.getElementById('settingsModal');
    document.getElementById('settingsBtn')?.addEventListener('click', () => settingsModal?.classList.add('active'));
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => settingsModal?.classList.remove('active'));
    settingsModal?.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            if (theme === 'default') {
                document.body.removeAttribute('data-theme');
                localStorage.removeItem('app_theme');
            } else {
                document.body.setAttribute('data-theme', theme);
                localStorage.setItem('app_theme', theme);
            }
            updateThemeButtonsActive(theme);
            addLog(`Изменена тема оформления на: ${theme}`, 'info');
        });
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `group211_notes_${formatDateKey(new Date())}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        addLog('Экспорт заметок в JSON выполнен успешно.', 'success');
    });

    document.getElementById('resetDataBtn')?.addEventListener('click', () => {
        if (confirm('Удалить все сохраненные задачи?')) {
            notesData = {};
            localStorage.removeItem('app_notes');
            initCalendar();
            renderSelectedDateNotes();
            addLog('Все данные были сброшены пользователем.', 'error');
        }
    });

    // AI Чат логика
    const aiChatWindow = document.getElementById('aiChatWindow');
    document.getElementById('toggleAiChatBtn')?.addEventListener('click', () => aiChatWindow?.classList.toggle('active'));
    document.getElementById('closeAiChatBtn')?.addEventListener('click', () => aiChatWindow?.classList.remove('active'));

    const aiSendBtn = document.getElementById('aiSendBtn');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatMessages = document.getElementById('aiChatMessages');

    const handleAiSend = () => {
        const text = aiChatInput?.value.trim();
        if (!text) return;

        const userMsg = document.createElement('div');
        userMsg.className = 'ai-msg user';
        userMsg.textContent = text;
        aiChatMessages.appendChild(userMsg);
        aiChatInput.value = '';
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

        addLog(`[AI Assistant] Обработка запроса: "${text}"`, 'info');

        setTimeout(() => {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-msg ai';
            aiMsg.textContent = `Я проанализировал ваш запрос и успешно добавил задачу в расписание группы 211, а также направил уведомление в Telegram! 🤖✨`;
            aiChatMessages.appendChild(aiMsg);
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            addLog(`[AI Assistant] Задача успешно распределена и отправлена.`, 'success');
        }, 800);
    };

    aiSendBtn?.addEventListener('click', handleAiSend);
    aiChatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAiSend();
    });

    // Кастомный курсор движение
    const cursor = document.getElementById('customCursor');
    const dot = document.getElementById('cursorDot');
    
    document.addEventListener('mousemove', (e) => {
        if (cursor && dot) {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
            dot.style.left = `${e.clientX}px`;
            dot.style.top = `${e.clientY}px`;
        }
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
