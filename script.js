//Reminder App working version 1.0 (frontend only)

// Reminder class to manage reminders
class Reminder {
    constructor(comment, datetime, frequency, disableTime = null) {
        this.comment = comment;
        this.datetime = new Date(datetime);
        this.frequency = frequency; // Frequency in minutes
        this.disableTime = disableTime ? new Date(disableTime) : null;
    }
}

// Array to store reminders
const reminders = [];

// Selectors for popup and buttons
const popup = document.getElementById("popup");
const saveReminderBtn = document.getElementById("save-reminder");
const closePopupBtn = document.getElementById("close-popup");
const newReminderBtn = document.getElementById("new-reminder-btn");
const frequencySelect = document.getElementById("frequency");
const customMinutesField = document.getElementById("custom-frequency");
const customMinutesInput = document.getElementById("custom-minutes");
const disableCheckbox = document.getElementById("disable-time-checkbox");
const disableDatetimeField = document.getElementById("disable-datetime-container");
const reminderList = document.getElementById("reminder-items");

// Current editing reminder (if any)
let editingReminder = null;

// Open popup
newReminderBtn.addEventListener("click", () => {
    popup.classList.remove("hidden");
    clearPopupFields();
    editingReminder = null;
});

// Close popup
closePopupBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
});

// Show/hide custom frequency field
frequencySelect.addEventListener("change", () => {
    if (frequencySelect.value === "custom") {
        customMinutesField.classList.remove("hidden");
    } else {
        customMinutesField.classList.add("hidden");
    }
});

// Show/hide disable datetime field
disableCheckbox.addEventListener("change", () => {
    // Когда чекбокс включен, показываем поле для даты выключения, иначе скрываем его
    if (disableCheckbox.checked) {
        disableDatetimeField.classList.remove("hidden");
    } else {
        disableDatetimeField.classList.add("hidden");
    }
});

// Функция для остановки запланированных таймеров
function clearReminderTimers(reminder) {
    if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
        reminder.timeoutId = null;
    }
}

// Save reminder
saveReminderBtn.addEventListener("click", () => {
    const comment = document.getElementById("comment").value;
    const datetime = document.getElementById("reminder-datetime").value;
    const frequency =
        frequencySelect.value === "custom"
            ? parseInt(customMinutesInput.value) || 60
            : parseInt(frequencySelect.value);
    const disableTime = disableCheckbox.checked
        ? document.getElementById("disable-datetime").value
        : null;

    if (!comment || !datetime) return alert("Please fill in all required fields.");

    if (editingReminder) {
        // Очистка старого таймера
        clearReminderTimers(editingReminder);

        // Обновление существующего напоминания
        editingReminder.comment = comment;
        editingReminder.datetime = new Date(datetime);
        editingReminder.frequency = frequency;
        editingReminder.disableTime = disableTime ? new Date(disableTime) : null;

        // Перезапуск напоминания
        scheduleReminder(editingReminder);
    } else {
        // Создание нового напоминания
        const newReminder = new Reminder(comment, datetime, frequency, disableTime);
        reminders.push(newReminder);

        // Запускаем его срабатывание
        scheduleReminder(newReminder);
    }

    updateReminderList(); // Обновляем список
    popup.classList.add("hidden"); // Закрываем попап
});



// Schedule reminders
function scheduleReminder(reminder) {
    const now = new Date();

    // Если время напоминания уже прошло, пропускаем его
    const timeDiff = reminder.datetime - now;
    if (timeDiff <= 0) {
        reminder.datetime = new Date(now.getTime() + reminder.frequency * 60000);
    }

    // Проверка времени выключения, если оно задано
    if (reminder.disableTime && now >= reminder.disableTime) {
        removeReminder(reminder);
        return;
    }

    // Устанавливаем таймер
    reminder.timeoutId = setTimeout(() => {
        // Отображаем уведомление
        showNotification(reminder.comment);

        // Проверяем, нужно ли остановить напоминание
        if (reminder.disableTime && new Date() >= reminder.disableTime) {
            removeReminder(reminder);
            return;
        }

        // Устанавливаем новое время напоминания
        reminder.datetime = new Date(
            reminder.datetime.getTime() + reminder.frequency * 60000
        );

        // Перезапускаем напоминание
        scheduleReminder(reminder);
        updateReminderInDOM(reminder);
    }, timeDiff);
}

// Измененная функция удаления напоминания
function removeReminder(reminder) {
    const index = reminders.indexOf(reminder);
    if (index !== -1) {
        clearReminderTimers(reminder); // Очищаем таймер
        reminders.splice(index, 1); // Удаляем из массива
        updateReminderList(); // Обновляем список
    }
}


// Функция обновления элемента списка напоминаний
function updateReminderInDOM(reminder) {
    const index = reminders.indexOf(reminder);
    if (index !== -1) {
        const listItem = reminderList.children[index];

        const now = new Date();
        const timeDiff = reminder.datetime - now;
        const timeLeft = formatTimeLeft(timeDiff);

        // Обновляем содержимое элемента списка
        listItem.innerHTML = `
            <div class="reminder-details">
                <div class="comment">${reminder.comment}</div>
                <div class="time">Next reminder: ${reminder.datetime.toLocaleString()}</div>
                <div class="time-left">Time left: ${timeLeft}</div>
                ${
                    reminder.disableTime
                        ? `<div class="disable-time">Disable at: ${reminder.disableTime.toLocaleString()}</div>`
                        : ""
                }
            </div>
            <button class="edit-btn" data-index="${index}">Edit</button>
            <button class="delete-btn" data-index="${index}">Delete</button>
        `;

        // Добавляем обработчики кнопок
        listItem.querySelector(".edit-btn").addEventListener("click", () => {
            editReminder(reminder);
        });
        listItem.querySelector(".delete-btn").addEventListener("click", () => {
            removeReminder(reminder);
        });
    }
}


// Show Windows notification
function showNotification(message) {
    if (Notification.permission === "granted") {
        new Notification("Reminder", { body: message });
    } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification("Reminder", { body: message });
            } else {
                console.warn("Notifications denied by the user.");
            }
        });
    } else {
        console.warn("Notifications are blocked. Please enable them in your browser settings.");
    }
}

// Update the reminder list in the UI
// Обновление списка напоминаний, добавляем все параметры сразу
function updateReminderList() {
    reminderList.innerHTML = ""; // Clear the list

    reminders.forEach((reminder, index) => {
        const now = new Date();
        const timeDiff = reminder.datetime - now;
        const disableTime = reminder.disableTime
            ? `Until ${reminder.disableTime.toLocaleString()}`
            : "No limit";

        const timeLeft = formatTimeLeft(timeDiff);

        // Обновляем содержимое элемента списка
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <div class="reminder-details">
                <div class="comment">${reminder.comment}</div>
                <div class="time">${reminder.datetime.toLocaleString()}</div>
                <div class="time-left">Time left: ${timeLeft}</div>
                ${reminder.disableTime ? `<div class="disable-time">Disable at: ${reminder.disableTime.toLocaleString()}</div>` : ''}
            </div>
            <button class="edit-btn" data-index="${index}">Edit</button>
            <button class="delete-btn" data-index="${index}">Delete</button>
        `;

        reminderList.appendChild(listItem);
    });

    // Повторно добавляем обработчики для кнопок
    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            editReminder(reminders[index]);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            reminders.splice(index, 1);
            updateReminderList();
        });
    });
}


// Edit reminder
function editReminder(reminder) {
    editingReminder = reminder; // Сохраняем редактируемое напоминание

    // Устанавливаем комментарий
    document.getElementById("comment").value = reminder.comment;

    // Устанавливаем дату и время напоминания (в локальной временной зоне)
    const localDatetime = new Date(reminder.datetime.getTime() - reminder.datetime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16); // Формат для <input type="datetime-local">
    document.getElementById("reminder-datetime").value = localDatetime;

    // Устанавливаем частоту повторений
    if (reminder.frequency && reminder.frequency !== 60 && reminder.frequency !== 120) {
        // Если частота кастомная
        frequencySelect.value = "custom";
        customMinutesField.classList.remove("hidden");
        customMinutesInput.value = reminder.frequency; // Устанавливаем пользовательское значение
    } else {
        // Если частота стандартная (60 минут или 120 минут)
        frequencySelect.value = reminder.frequency.toString();
        customMinutesField.classList.add("hidden");
        customMinutesInput.value = ""; // Очищаем поле для пользовательской частоты
    }

    // Устанавливаем дату и время выключения напоминания (если есть)
    if (reminder.disableTime) {
        disableCheckbox.checked = true;
        disableDatetimeField.classList.remove("hidden");
        const localDisableDatetime = new Date(reminder.disableTime.getTime() - reminder.disableTime.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16); // Формат для <input type="datetime-local">
        document.getElementById("disable-datetime").value = localDisableDatetime;
    } else {
        disableCheckbox.checked = false;
        disableDatetimeField.classList.add("hidden");
        document.getElementById("disable-datetime").value = ""; // Очищаем поле, если выключение не установлено
    }

    // Показываем попап
    popup.classList.remove("hidden");
}

// Format time left
function formatTimeLeft(timeDiff) {
    const minutes = Math.floor(timeDiff / (1000 * 60)) % 60;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Clear popup fields
function clearPopupFields() {
    document.getElementById("comment").value = "";
    document.getElementById("reminder-datetime").value = "";
    frequencySelect.value = "60";
    customMinutesField.classList.add("hidden");
    customMinutesInput.value = "";
    disableCheckbox.checked = false;
    disableDatetimeField.classList.add("hidden");
    document.getElementById("disable-datetime").value = "";
}