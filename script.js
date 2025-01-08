//Reminder App working version 1.0 (frontend only)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getDatabase, ref, set, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrBT42Yn4nmQ5EHzzZMLN4JJKiV4UbJD4",
    authDomain: "reminder-app-81d22.firebaseapp.com",
    databaseURL: "https://reminder-app-81d22-default-rtdb.firebaseio.com",
    projectId: "reminder-app-81d22",
    storageBucket: "reminder-app-81d22.firebasestorage.app",
    messagingSenderId: "37109372943",
    appId: "1:37109372943:web:28bf06121469faab47ab7a",
    measurementId: "G-3XZCVNSRF9"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const database = getDatabase(app);

// Функция для добавления напоминания в Firebase
function addReminder(reminder) {
    const newReminderRef = push(ref(database, 'reminders'));
    set(newReminderRef, reminder)
      .then(() => console.log('Reminder added.'))
      .catch((error) => console.error('Error adding reminder:', error));
  }
  
  // Функция для обновления напоминания в Firebase
  function updateReminder(reminder, reminderId) {
    const reminderRef = ref(database, `reminders/${reminderId}`);
    update(reminderRef, reminder)
      .then(() => console.log('Reminder updated.'))
      .catch((error) => console.error('Error updating reminder:', error));
  }
  
  // Функция для удаления напоминания из Firebase
  function deleteReminder(reminderId) {
    const reminderRef = ref(database, `reminders/${reminderId}`);
    remove(reminderRef)
      .then(() => console.log('Reminder deleted.'))
      .catch((error) => console.error('Error deleting reminder:', error));
  }



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
        // Обновление существующего напоминания
        editingReminder.comment = comment;
        editingReminder.datetime = new Date(datetime);
        editingReminder.frequency = frequency;
        editingReminder.disableTime = disableTime;
    
        // Отправка команды на обновление напоминания в Firebase
        updateReminder(editingReminder, editingReminder.id);
    } else {
        // Создание нового напоминания
        const newReminder = new Reminder(comment, datetime, frequency, disableTime);
    
        // Отправка команды на добавление напоминания в Firebase
        addReminder(newReminder);
    }

    // Очистка полей формы
    // clearPopupFields();

    popup.classList.add("hidden"); // Закрываем попап
});



// Schedule reminders
function scheduleReminder(reminder) {
    if (reminder.disableTime && reminder.disableTime <= new Date()) {
      // Если время выключения наступило, удаляем напоминание из Firebase
      deleteReminder(reminder.id);
      return;
    }
  
    const now = new Date();
    let nextReminderTime = reminder.datetime;
  
    while (nextReminderTime <= now) {
      nextReminderTime = new Date(nextReminderTime.getTime() + reminder.frequency * 60000);
    }
  
    const timeDiff = nextReminderTime - now;
  
    reminder.timeoutId = setTimeout(() => {
        showNotification(message)
        scheduleReminder(reminder); // Запланировать следующее напоминание
    }, timeDiff);
  
    updateReminderInDOM(reminder);
  }

// Измененная функция удаления напоминания
function removeReminder(reminder) {
    deleteReminder(reminder.id);
}


// Функция обновления элемента списка напоминаний
function updateReminderInDOM(reminder) {
    const reminderElement = document.getElementById(reminder.id);
  
    if (reminderElement) {
      // Обновляем существующий элемент напоминания
      const commentDiv = reminderElement.querySelector('.comment');
      const timeDiv = reminderElement.querySelector('.time');
      const timeLeftDiv = reminderElement.querySelector('.time-left');
      const disableTimeDiv = reminderElement.querySelector('.disable-time'); 
      const editBtn = reminderElement.querySelector('.edit-btn');
      const deleteBtn = reminderElement.querySelector('.delete-btn');
  
      commentDiv.textContent = reminder.comment;
      timeDiv.textContent = `Next reminder: ${reminder.datetime.toLocaleString()}`; 
  
      const now = new Date();
      let nextReminderTime = reminder.datetime;
      while (nextReminderTime <= now) {
        nextReminderTime = new Date(nextReminderTime.getTime() + reminder.frequency * 60000);
      }
      const timeDiff = nextReminderTime - now;
      timeLeftDiv.textContent = `Time left: ${formatTimeLeft(timeDiff)}`;
  
      // Обновляем время выключения, если оно задано
      if (reminder.disableTime) {
        disableTimeDiv.textContent = `Disable at: ${reminder.disableTime.toLocaleString()}`;
      } else {
        // Если время выключения не задано, можно либо скрыть элемент, либо установить пустой текст
        disableTimeDiv.textContent = ""; // Или disableTimeDiv.style.display = "none"; 
      }
  
      editBtn.onclick = () => editReminder(reminder);
      deleteBtn.onclick = () => removeReminder(reminder);
  
    } else {
      // Создаем новый элемент напоминания
      const li = document.createElement("li");
      li.id = reminder.id;
  
      li.innerHTML = `
        <div class="reminder-details">
          <div class="comment">${reminder.comment}</div>
          <div class="time">Next reminder: ${reminder.datetime.toLocaleString()}</div> 
          <div class="time-left">Time left: ${formatTimeLeft(timeDiff)}</div>
          ${reminder.disableTime ? `<div class="disable-time">Disable at: ${reminder.disableTime.toLocaleString()}</div>` : ''} 
        </div>
        <button class="edit-btn" data-index="${reminder.id}">Edit</button> 
        <button class="delete-btn" data-index="${reminder.id}">Delete</button> 
      `;
  
      reminderList.appendChild(li);
  
      // Добавляем обработчики для кнопок после добавления элемента в DOM
      li.querySelector(".edit-btn").addEventListener("click", () => {
        editReminder(reminder);
      });
      li.querySelector(".delete-btn").addEventListener("click", () => {
        removeReminder(reminder);
      });
    }
  }

// Функция для получения всех напоминаний из Firebase
function getAllReminders() {
    const remindersRef = ref(database, 'reminders');
    onValue(remindersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reminders = [];
        for (let id in data) {
          const reminderData = data[id];
          // Преобразование дат из строки в объект Date
          reminderData.datetime = new Date(reminderData.datetime);
          reminderData.disableTime = reminderData.disableTime ? new Date(reminderData.disableTime) : null;
  
          // Добавляем id к данным напоминания
          const reminder = new Reminder(reminderData.comment, reminderData.datetime, reminderData.frequency, reminderData.disableTime);
          reminder.id = id;
          reminders.push(reminder);
  
          // Запланировать напоминание
          scheduleReminder(reminder);
        }
        // Обновляем список напоминаний на странице
        updateReminderList(reminders);
      } else {
        // Если данных нет, очищаем список напоминаний
        updateReminderList([]);
      }
    });
  }
  
  // Вызываем функцию для получения всех напоминаний при загрузке страницы
  getAllReminders();


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