import { checkServerHealth, verifyToken } from './api.js';

const NUMBER_REGEX = /^[0-9]+$/;
const TELEGRAM_BOT_URL = 'https://t.me/mHelperTestTgBot';
let connected = false;
let inputField, buttonTgNumber, testButton;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Popup загружен');
    
    // Получаем элементы DOM
    inputField = document.getElementById("input_tg_number");
    buttonTgNumber = document.getElementById("button_tg_number");
    testButton = document.getElementById("button_test");

    // Проверяем авторизацию пользователя
    const isAuthorized = await checkUserAuthorization();
    
    if (isAuthorized) {
        // Пользователь авторизован - скрываем форму входа
        showAuthorizedState();
    } else {
        // Пользователь не авторизован - показываем форму входа
        showLoginForm();
        
        // Генерируем QR код (с небольшой задержкой для загрузки библиотеки)
        setTimeout(async () => {
            await generateQRCode();
        }, 100);
        
        // Проверяем состояние сервера
        await checkServerStatus();
        
        // Инициализируем обработчики событий
        initEventListeners();
    }
});

/**
 * Проверяет авторизацию пользователя
 * @returns {Promise<boolean>} true если пользователь авторизован
 */
async function checkUserAuthorization() {
    console.log('🔐 Проверяем авторизацию пользователя');
    
    try {
        const isTokenValid = await verifyToken();
        console.log('🔐 Результат проверки токена:', isTokenValid);
        return isTokenValid;
    } catch (error) {
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
            <h5>✅ Вы авторизованы!</h5>
            <p>Расширение готово к работе. Переходите на сайт закупок для сохранения данных.</p>
            <button type="button" class="btn btn-outline-danger btn-sm" id="logout-btn">Выйти</button>
        `;
        
        // Вставляем после описания
        const description = document.querySelector('.description');
        if (description) {
            description.after(authMessage);
        } else {
            container.appendChild(authMessage);
        }
        
        // Добавляем обработчик для кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
    
    connected = true;
    
    // Инициализируем кнопку тестирования для авторизованных пользователей
    if (testButton) {
        initTestButtonForAuthorizedUser();
    }
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
    
    connected = false;
}

/**
 * Обрабатывает выход пользователя
 */
async function handleLogout() {
    console.log('🔐 Выход пользователя');
    
    try {
        // Импортируем функцию удаления токена
        const { removeToken } = await import('./localStorage.js');
        await removeToken();
        
        // Перезагружаем popup
        window.location.reload();
        
    } catch (error) {
        console.error('🔐 Ошибка при выходе:', error);
        showErrorMessage("Ошибка при выходе из системы");
    }
}

/**
 * Инициализирует кнопку тестирования для авторизованных пользователей
 */
function initTestButtonForAuthorizedUser() {
    if (!testButton) return;
    
    testButton.addEventListener("click", async function() {
        testButton.textContent = "Проверка...";
        testButton.disabled = true;
        
        const isHealthy = await checkServerHealth();
        
        if (isHealthy) {
            showSuccessMessage("Сервер доступен ✅");
            testButton.classList.remove("btn-secondary");
            testButton.classList.add("btn-success");
            testButton.textContent = "Сервер доступен";
        } else {
            showErrorMessage("Сервер недоступен ❌");
            testButton.classList.remove("btn-secondary");
            testButton.classList.add("btn-danger");
            testButton.textContent = "Сервер недоступен";
        }
        
        testButton.disabled = false;
        
        // Возвращаем исходное состояние через 3 секунды
        setTimeout(() => {
            testButton.className = "btn btn-secondary";
            testButton.textContent = "Test connection";
        }, 3000);
    });
}

/**
 * Генерирует QR код для Telegram бота
 */
async function generateQRCode() {
    try {
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
            // Очищаем контейнер
            qrContainer.innerHTML = '';
            
            // Создаем QR код с помощью QRCodeJS
            new QRCode(qrContainer, {
                text: TELEGRAM_BOT_URL,
                width: 148,
                height: 148,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });
            console.log('📱 QR код успешно сгенерирован');
        } else {
            console.warn('📱 QRCode library не загружена или контейнер не найден');
            // Показываем fallback текст
            if (qrContainer) {
                qrContainer.innerHTML = '<div style="width: 148px; height: 148px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">QR код недоступен</div>';
            }
        }
    } catch (error) {
        console.error('📱 Ошибка генерации QR кода:', error);
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = '<div style="width: 148px; height: 148px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">QR код недоступен</div>';
        }
    }
}

function initEventListeners() {
    // Обработчик ввода номера
    inputField.addEventListener("input", function () {
        const value = inputField.value;

        if (NUMBER_REGEX.test(value)) {
            inputField.classList.remove("is-invalid");
            const numberCode = parseInt(value, 10);
            if (!isNaN(numberCode) && numberCode >= 1000 && numberCode <= 1000000) {
                buttonTgNumber.classList.remove("disabled", "btn-secondary");
                buttonTgNumber.classList.add("enabled", "btn-primary");
                buttonTgNumber.disabled = false;
            } else {
                buttonTgNumber.classList.remove("enabled", "btn-primary");
                buttonTgNumber.classList.add("disabled", "btn-secondary");
                buttonTgNumber.disabled = true;
            }
        } else {
            inputField.classList.add("is-invalid");
            buttonTgNumber.classList.remove("enabled", "btn-primary");
            buttonTgNumber.classList.add("disabled", "btn-secondary");
            buttonTgNumber.disabled = true;
        }
    });

    // Обработчик нажатия Enter в поле ввода
    inputField.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !buttonTgNumber.classList.contains("disabled")) {
            event.preventDefault(); // Предотвращаем стандартное поведение формы
            buttonTgNumber.click(); // Имитируем клик по кнопке
        }
    });

    // Обработчик отправки формы (дополнительная защита для Enter)
    const form = document.getElementById("form_tg_number");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Предотвращаем перезагрузку страницы
            if (!buttonTgNumber.classList.contains("disabled")) {
                buttonTgNumber.click();
            }
        });
    }

    // Обработчик кнопки авторизации
    buttonTgNumber.addEventListener("click", async function () {
        if (buttonTgNumber.classList.contains("disabled")) {
            return;
        }

        console.log('🔐 Нажата кнопка авторизации с кодом:', inputField.value);

        // Проверяем сервер перед отправкой
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
            showErrorMessage("Сервер недоступен. Попробуйте позже.");
            return;
        }

        // Показываем loading состояние
        buttonTgNumber.textContent = "Подключение...";
        buttonTgNumber.disabled = true;

        function createConnection() {
            console.log('🔐 Авторизация успешна, переключаем в авторизованное состояние');
            
            // Показываем состояние авторизованного пользователя
            showAuthorizedState();
            
            showSuccessMessage("Успешно подключено!");
        }

        function notCreatedConnection(errorMessage = "Ошибка подключения") {
            console.error('🔐 Авторизация не удалась:', errorMessage);
            inputField.classList.add("is-invalid");
            connected = false;
            showErrorMessage(errorMessage);
            
            // Восстанавливаем кнопку
            buttonTgNumber.textContent = "OK";
            buttonTgNumber.disabled = false;
        }

        sendCodeToBackend(createConnection, notCreatedConnection);
    });

    // Обработчик кнопки проверки соединения
    if (testButton) {
        testButton.addEventListener("click", async function() {
            testButton.textContent = "Проверка...";
            testButton.disabled = true;
            
            const isHealthy = await checkServerHealth();
            
            if (isHealthy) {
                showSuccessMessage("Сервер доступен ✅");
                testButton.classList.remove("btn-secondary");
                testButton.classList.add("btn-success");
                testButton.textContent = "Сервер доступен";
            } else {
                showErrorMessage("Сервер недоступен ❌");
                testButton.classList.remove("btn-secondary");
                testButton.classList.add("btn-danger");
                testButton.textContent = "Сервер недоступен";
            }
            
            testButton.disabled = false;
            
            // Возвращаем исходное состояние через 3 секунды
            setTimeout(() => {
                testButton.className = "btn btn-secondary";
                testButton.textContent = "Test connection";
            }, 3000);
        });
    }
}

async function checkServerStatus() {
    const isHealthy = await checkServerHealth();
    
    if (!isHealthy) {
        showErrorMessage("⚠️ Сервер недоступен. Проверьте подключение к интернету.");
        
        // Отключаем кнопку авторизации если сервер недоступен
        if (buttonTgNumber) {
            buttonTgNumber.classList.add("disabled");
            buttonTgNumber.disabled = true;
        }
    }
}

function sendCodeToBackend(createConnection, notCreatedConnection) {
    console.log('🔐 Отправляем код в background script');
    
    const sending = chrome.runtime.sendMessage({
        destination: "loginCode",
        data: inputField.value
    });

    sending.then(
        (response) => {
            console.log('🔐 Получен ответ от background script:', response);
            
            if (response && response.result) {
                createConnection();
            } else {
                notCreatedConnection(response?.error || "Неизвестная ошибка авторизации");
            }
        },
        (error) => {
            console.error("🔐 Ошибка отправки сообщения в background:", error);
            notCreatedConnection("Ошибка соединения с background script");
        }
    );
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