import { checkServerHealth, verifyToken, getTelegramBotInfo } from './api';
import { removeToken } from './localStorage';
import { CONFIG, NUMBER_REGEX, MIN_CODE_VALUE, MAX_CODE_VALUE, ERROR_MESSAGES, SUCCESS_MESSAGES, MESSAGE_TYPES } from './config';
// let connected = false; // Not used in current implementation
let elements = {
    inputField: null,
    buttonTgNumber: null,
    testButton: null
};
// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Popup загружен');
    // Получаем элементы DOM
    elements.inputField = document.getElementById("input_tg_number");
    elements.buttonTgNumber = document.getElementById("button_tg_number");
    elements.testButton = document.getElementById("button_test");
    // Проверяем авторизацию пользователя
    const isAuthorized = await checkUserAuthorization();
    if (isAuthorized) {
        // Пользователь авторизован - скрываем форму входа
        showAuthorizedState();
    }
    else {
        // Пользователь не авторизован - показываем форму входа
        showLoginForm();
        // Генерируем QR код (с небольшой задержкой для загрузки библиотеки)
        setTimeout(async () => {
            await generateQRCode();
        }, 100);
        // Проверяем состояние сервера
        await checkServerStatus();
    }
    // Инициализируем обработчики событий для всех пользователей
    initEventListeners();
});
/**
 * Проверяет авторизацию пользователя
 * @returns Promise<boolean> - true если пользователь авторизован
 */
async function checkUserAuthorization() {
    console.log('🔐 Проверяем авторизацию пользователя');
    try {
        const isTokenValid = await verifyToken();
        console.log('🔐 Результат проверки токена:', isTokenValid);
        return isTokenValid;
    }
    catch (error) {
        console.error('🔐 Ошибка при проверке авторизации:', error);
        return false;
    }
}
/**
 * Показывает состояние для авторизованного пользователя
 */
function showAuthorizedState() {
    console.log('🔐 Показываем состояние авторизованного пользователя');
    // Скрываем форму входа
    const loginForm = document.getElementsByClassName("tg_number")[0];
    if (loginForm) {
        loginForm.style.display = "none";
    }
    // Показываем сообщение об успешной авторизации
    const container = document.querySelector('.container-main');
    if (container) {
        const authMessage = document.createElement('div');
        authMessage.className = 'alert alert-success mt-3';
        authMessage.innerHTML = `
      <h5>✅ ${SUCCESS_MESSAGES.AUTHORIZED}</h5>
      <p>Расширение готово к работе. <a href="https://zakupki.gov.ru/epz/order/extendedsearch/results.html" target="_blank" rel="noopener" class="procurement-link">Переходите на сайт закупок</a> для сохранения данных.</p>
      <button type="button" class="btn btn-outline-danger btn-sm" id="logout-btn">Выйти</button>
    `;
        // Вставляем после описания
        const description = document.querySelector('.description');
        if (description) {
            description.after(authMessage);
        }
        else {
            container.appendChild(authMessage);
        }
        // Добавляем обработчик для кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
    // connected = true;
}
/**
 * Показывает форму входа для неавторизованного пользователя
 */
function showLoginForm() {
    console.log('🔐 Показываем форму входа');
    // Убеждаемся что форма входа видна
    const loginForm = document.getElementsByClassName("tg_number")[0];
    if (loginForm) {
        loginForm.style.display = "block";
    }
    // connected = false;
}
/**
 * Обрабатывает выход пользователя
 */
async function handleLogout() {
    console.log('🔐 Выход пользователя');
    try {
        await removeToken();
        // Перезагружаем popup
        window.location.reload();
    }
    catch (error) {
        console.error('🔐 Ошибка при выходе:', error);
        showErrorMessage("Ошибка при выходе из системы");
    }
}
/**
 * Генерирует QR код для Telegram бота
 */
async function generateQRCode() {
    try {
        const qrContainer = document.getElementById('qr-code');
        if (!qrContainer) {
            console.warn('📱 Контейнер QR кода не найден');
            return;
        }
        // Получаем информацию о боте с сервера
        const botInfo = await getTelegramBotInfo();
        let botUrl = CONFIG.telegramBotUrl; // fallback URL
        if (botInfo.success && botInfo.botInfo?.botUrl) {
            botUrl = botInfo.botInfo.botUrl;
            console.log('📱 Используем динамический URL бота:', botUrl);
        }
        else {
            console.warn('📱 Не удалось получить информацию о боте, используем fallback URL:', botUrl);
            if (botInfo.error) {
                console.error('📱 Ошибка получения информации о боте:', botInfo.error);
            }
        }
        // Обновляем ссылку в HTML
        const telegramLink = document.querySelector('.tg_number p a');
        if (telegramLink) {
            telegramLink.href = botUrl;
            telegramLink.textContent = `Перейдите в телеграмм ${botUrl.replace('https://', '')}`;
            console.log('📱 Обновлена ссылка на бота:', botUrl);
        }
        if (typeof window.QRCode !== 'undefined') {
            // Очищаем контейнер
            qrContainer.innerHTML = '';
            // Создаем QR код с помощью QRCodeJS
            new window.QRCode(qrContainer, {
                text: botUrl,
                width: 148,
                height: 148,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: window.QRCode.CorrectLevel.M
            });
            console.log('📱 QR код успешно сгенерирован для URL:', botUrl);
        }
        else {
            console.warn('📱 QRCode library не загружена');
            // Показываем fallback текст
            qrContainer.innerHTML = '<div class="qr-fallback">QR код недоступен</div>';
        }
    }
    catch (error) {
        console.error('📱 Ошибка генерации QR кода:', error);
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = '<div class="qr-fallback">QR код недоступен</div>';
        }
    }
}
function initEventListeners() {
    if (!elements.inputField || !elements.buttonTgNumber) {
        console.error('❌ Не найдены необходимые элементы DOM');
        return;
    }
    // Обработчик ввода номера
    elements.inputField.addEventListener("input", function () {
        const value = elements.inputField.value;
        if (NUMBER_REGEX.test(value)) {
            elements.inputField.classList.remove("is-invalid");
            const numberCode = parseInt(value, 10);
            if (!isNaN(numberCode) && numberCode >= MIN_CODE_VALUE && numberCode <= MAX_CODE_VALUE) {
                elements.buttonTgNumber.classList.remove("disabled", "btn-secondary");
                elements.buttonTgNumber.classList.add("enabled", "btn-primary");
                elements.buttonTgNumber.disabled = false;
            }
            else {
                elements.buttonTgNumber.classList.remove("enabled", "btn-primary");
                elements.buttonTgNumber.classList.add("disabled", "btn-secondary");
                elements.buttonTgNumber.disabled = true;
            }
        }
        else {
            elements.inputField.classList.add("is-invalid");
            elements.buttonTgNumber.classList.remove("enabled", "btn-primary");
            elements.buttonTgNumber.classList.add("disabled", "btn-secondary");
            elements.buttonTgNumber.disabled = true;
        }
    });
    // Обработчик нажатия Enter в поле ввода
    elements.inputField.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !elements.buttonTgNumber.classList.contains("disabled")) {
            event.preventDefault(); // Предотвращаем стандартное поведение формы
            elements.buttonTgNumber.click(); // Имитируем клик по кнопке
        }
    });
    // Обработчик отправки формы (дополнительная защита для Enter)
    const form = document.getElementById("form_tg_number");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Предотвращаем перезагрузку страницы
            if (!elements.buttonTgNumber.classList.contains("disabled")) {
                elements.buttonTgNumber.click();
            }
        });
    }
    // Обработчик кнопки авторизации
    elements.buttonTgNumber.addEventListener("click", async function () {
        if (elements.buttonTgNumber.classList.contains("disabled")) {
            return;
        }
        console.log('🔐 Нажата кнопка авторизации с кодом:', elements.inputField.value);
        // Проверяем сервер перед отправкой
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
            showErrorMessage(ERROR_MESSAGES.SERVER_UNAVAILABLE);
            return;
        }
        // Показываем loading состояние
        elements.buttonTgNumber.textContent = "Подключение...";
        elements.buttonTgNumber.disabled = true;
        function createConnection() {
            console.log('🔐 Авторизация успешна, переключаем в авторизованное состояние');
            // Показываем состояние авторизованного пользователя
            showAuthorizedState();
            showSuccessMessage(SUCCESS_MESSAGES.CONNECTED);
        }
        function notCreatedConnection(errorMessage = ERROR_MESSAGES.CONNECTION_ERROR) {
            console.error('🔐 Авторизация не удалась:', errorMessage);
            elements.inputField.classList.add("is-invalid");
            // connected = false;
            showErrorMessage(errorMessage);
            // Восстанавливаем кнопку
            elements.buttonTgNumber.textContent = "OK";
            elements.buttonTgNumber.disabled = false;
        }
        sendCodeToBackend(createConnection, notCreatedConnection);
    });
    // Обработчик кнопки проверки соединения
    if (elements.testButton) {
        elements.testButton.addEventListener("click", async function () {
            elements.testButton.textContent = "Проверка...";
            elements.testButton.disabled = true;
            const isHealthy = await checkServerHealth();
            if (isHealthy) {
                showSuccessMessage(SUCCESS_MESSAGES.SERVER_AVAILABLE);
                elements.testButton.classList.remove("btn-secondary");
                elements.testButton.classList.add("btn-success");
                elements.testButton.textContent = "Сервер доступен";
            }
            else {
                showErrorMessage("Сервер недоступен ❌");
                elements.testButton.classList.remove("btn-secondary");
                elements.testButton.classList.add("btn-danger");
                elements.testButton.textContent = "Сервер недоступен";
            }
            elements.testButton.disabled = false;
            // Возвращаем исходное состояние через 3 секунды
            setTimeout(() => {
                if (elements.testButton) {
                    elements.testButton.className = "btn btn-secondary";
                    elements.testButton.textContent = "Test connection";
                }
            }, 3000);
        });
    }
}
async function checkServerStatus() {
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
        showErrorMessage("⚠️ Сервер недоступен. Проверьте подключение к интернету.");
        // Отключаем кнопку авторизации если сервер недоступен
        if (elements.buttonTgNumber) {
            elements.buttonTgNumber.classList.add("disabled");
            elements.buttonTgNumber.disabled = true;
        }
    }
}
function sendCodeToBackend(createConnection, notCreatedConnection) {
    console.log('🔐 Отправляем код в background script');
    const sending = chrome.runtime.sendMessage({
        destination: MESSAGE_TYPES.LOGIN_CODE,
        data: elements.inputField.value
    });
    sending.then((response) => {
        console.log('🔐 Получен ответ от background script:', response);
        if (response && response.result) {
            createConnection();
        }
        else {
            notCreatedConnection(response?.error || ERROR_MESSAGES.UNKNOWN_ERROR);
        }
    }, (error) => {
        console.error("🔐 Ошибка отправки сообщения в background:", error);
        notCreatedConnection(ERROR_MESSAGES.BACKGROUND_ERROR);
    });
}
function showSuccessMessage(message) {
    showMessage(message, "success");
}
function showErrorMessage(message) {
    showMessage(message, "error");
}
function showMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type === "success" ? "success" : "danger"} mt-2`;
    messageDiv.textContent = message;
    // Удаляем предыдущие сообщения
    const existingMessages = document.querySelectorAll(".alert");
    existingMessages.forEach(msg => msg.remove());
    // Добавляем новое сообщение
    const form = document.getElementById("form_tg_number");
    if (form) {
        form.appendChild(messageDiv);
        // Убираем сообщение через 5 секунд
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}
