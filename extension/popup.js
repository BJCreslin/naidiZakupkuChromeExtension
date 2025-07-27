import { checkServerHealth } from './api.js';

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

    // Генерируем QR код (с небольшой задержкой для загрузки библиотеки)
    setTimeout(async () => {
        await generateQRCode();
    }, 100);

    // Проверяем состояние сервера
    await checkServerStatus();
    
    // Инициализируем обработчики событий
    initEventListeners();
});

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
            console.log('🔐 Авторизация успешна, скрываем форму');
            const numberDocument = document.getElementsByClassName("tg_number")[0];
            if (numberDocument) {
                numberDocument.style.display = "none";
            }
            connected = true;
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