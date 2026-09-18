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
            // Простейший парсинг для примера (ищем дату «21 сентября» или аналоги)
            // Давай для примера привяжем к выбранной дате или распознаем фразу
            let targetDateStr = selectedDateStr;
            
            if (lowerText.includes('21 сентября')) {
                targetDateStr = `${currentDate.getFullYear()}-09-21`;
            } else if (lowerText.includes('сегодня')) {
                targetDateStr = formatDateKey(new Date());
            }

            // Выделяем текст задачи (все после ключевых слов)
            let taskContent = text
                .replace(/добавь заметку на.*?(сентября|октября|ноября|декабря|января|февраля|марта|апреля|мая|июня|июля|августа)/i, '')
                .replace(/добавь заметку/i, '')
                .replace(/запиши/i, '')
                .trim();

            if (!taskContent) taskContent = text; // Если не вырезалось, берем целиком

            // Сохраняем в общую базу заметок
            if (!notesData[targetDateStr]) notesData[targetDateStr] = [];
            notesData[targetDateStr].push(taskContent);
            localStorage.setItem('app_notes_data', JSON.stringify(notesData));

            // Обновляем календарь и список на экране
            renderCalendar();
            renderNotesForSelectedDate();
            
            // Дублируем отправку в Telegram бэкенд
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
