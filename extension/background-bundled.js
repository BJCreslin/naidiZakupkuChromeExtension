// config.js
const CONFIG = {
    serverUrl: "https://naidizakupku.ru/",
    healthCheckUrl: "https://naidizakupku.ru/api/backend/api/health",
    loginUrl: "https://naidizakupku.ru/api/backend/v1/login",
    procurementUrl: "https://naidizakupku.ru/api/backend/chromeExtension/v1/procurement",
    verifyTokenUrl: "https://naidizakupku.ru/api/backend/v1/verify-token",
    telegramBotUrl: "https://t.me/mHelperTestTgBot",
    telegramBotInfoUrl: "https://naidizakupku.ru/api/backendapi/auth/telegram-bot/info"
};
const NUMBER_REGEX = /^[0-9]+$/;
const MIN_CODE_VALUE = 1000;
const MAX_CODE_VALUE = 1000000;
const MESSAGE_TYPES = {
    PROCUREMENT_SENDER: "procurementSender",
    LOGIN_CODE: "loginCode",
    CHECK_AUTH: "checkAuth"
};
const STORAGE_KEYS = {
    TOKEN: "authToken",
    USER: "userData"
};
const ERROR_MESSAGES = {
    SERVER_UNAVAILABLE: "Сервер недоступен. Попробуйте позже.",
    CONNECTION_ERROR: "Ошибка подключения",
    UNKNOWN_ERROR: "Неизвестная ошибка авторизации",
    BACKGROUND_ERROR: "Ошибка соединения с background script",
    INVALID_TOKEN: "Токен недействителен",
    EMPTY_RESPONSE: "Пустой ответ от сервера"
};
const SUCCESS_MESSAGES = {
    CONNECTED: "Успешно подключено!",
    SERVER_AVAILABLE: "Сервер доступен ✅",
    AUTHORIZED: "Вы авторизованы!"
};


// localStorage.js
/**
 * Сохраняет токен авторизации в локальном хранилище
 * @param data - Данные для сохранения (токен или полный ответ авторизации)
 */
async function saveToken(data) {
    try {
        console.log('💾 Сохраняем токен в localStorage');
        let token;
        let userData;
        if (typeof data === 'string') {
            token = data;
        }
        else {
            token = data.token;
            userData = data.user;
        }
        const storageData = {
            token,
            ...(userData && { user: userData })
        };
        await chrome.storage.local.set(storageData);
        console.log('💾 Токен успешно сохранен');
    }
    catch (error) {
        console.error('💾 Ошибка сохранения токена:', error);
        throw new Error('Не удалось сохранить токен');
    }
}
/**
 * Получает токен авторизации из локального хранилища
 * @returns Promise<string | null> - Токен или null если не найден
 */
async function getToken() {
    try {
        console.log('💾 Получаем токен из localStorage');
        const result = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
        const token = result[STORAGE_KEYS.TOKEN];
        if (token) {
            console.log('💾 Токен найден');
            return token;
        }
        else {
            console.log('💾 Токен не найден');
            return null;
        }
    }
    catch (error) {
        console.error('💾 Ошибка получения токена:', error);
        return null;
    }
}
/**
 * Удаляет токен авторизации из локального хранилища
 */
async function removeToken() {
    try {
        console.log('💾 Удаляем токен из localStorage');
        await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        console.log('💾 Токен успешно удален');
    }
    catch (error) {
        console.error('💾 Ошибка удаления токена:', error);
        throw new Error('Не удалось удалить токен');
    }
}
/**
 * Получает данные пользователя из локального хранилища
 * @returns Promise<StorageData['user'] | null> - Данные пользователя или null
 */
async function getUserData() {
    try {
        console.log('💾 Получаем данные пользователя из localStorage');
        const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
        const userData = result[STORAGE_KEYS.USER];
        if (userData) {
            console.log('💾 Данные пользователя найдены');
            return userData;
        }
        else {
            console.log('💾 Данные пользователя не найдены');
            return null;
        }
    }
    catch (error) {
        console.error('💾 Ошибка получения данных пользователя:', error);
        return null;
    }
}
/**
 * Очищает все данные авторизации из локального хранилища
 */
async function clearAuthData() {
    try {
        console.log('💾 Очищаем все данные авторизации');
        await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        console.log('💾 Данные авторизации успешно очищены');
    }
    catch (error) {
        console.error('💾 Ошибка очистки данных авторизации:', error);
        throw new Error('Не удалось очистить данные авторизации');
    }
}
/**
 * Проверяет наличие токена в локальном хранилище
 * @returns Promise<boolean> - true если токен существует
 */
async function hasToken() {
    const token = await getToken();
    return token !== null;
}


// api.js
/**
 * Проверяет доступность сервера
 * @returns Promise<boolean> - true если сервер доступен
 */
async function checkServerHealth() {
    try {
        const response = await fetch(CONFIG.healthCheckUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.ok;
    }
    catch (error) {
        console.error('Сервер недоступен:', error);
        return false;
    }
}
/**
 * Проверяет валидность токена авторизации
 * @returns Promise<boolean> - true если токен валиден
 */
async function verifyToken() {
    const token = await getToken();
    if (!token) {
        console.log('🔐 Токен отсутствует, авторизация не требуется');
        return false;
    }
    try {
        console.log('🔐 Проверяем валидность токена на сервере');
        const headers = new Headers({
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        });
        const response = await fetch(CONFIG.verifyTokenUrl, {
            method: 'GET',
            headers: headers
        });
        console.log('🔐 Ответ проверки токена:', {
            status: response.status,
            statusText: response.statusText
        });
        if (response.status === 401) {
            console.warn('🔐 Токен недействителен, удаляем его');
            await removeToken();
            return false;
        }
        if (!response.ok) {
            console.warn('🔐 Ошибка при проверке токена:', response.statusText);
            return false;
        }
        console.log('🔐 Токен валиден');
        return true;
    }
    catch (error) {
        console.error('🔐 Ошибка при проверке токена:', error);
        // Если сервер недоступен, но токен есть, предполагаем что он валиден
        return true;
    }
}
/**
 * Отправляет код авторизации для получения токена
 * @param code - Код, полученный из Telegram
 * @returns Promise<string> - Токен авторизации
 */
async function sendCodeAndReceiveToken(code) {
    const payload = { numberCode: code };
    console.log('🔐 Отправляем код авторизации:', payload);
    try {
        const data = await sendPostRequest(CONFIG.loginUrl, payload, true);
        console.log('🔐 Получен ответ от сервера авторизации:', data);
        return data;
    }
    catch (error) {
        console.error('🔐 Ошибка авторизации:', error);
        throw error;
    }
}
/**
 * Отправляет данные о закупке на сервер
 * @param procurement - Данные о закупке
 * @returns Promise<ApiResponse> - Ответ сервера
 */
async function sendProcurement(procurement) {
    console.log('📦 Отправляем закупку:', procurement);
    try {
        const data = await sendPostRequest(CONFIG.procurementUrl, procurement, false);
        console.log('📦 Закупка отправлена успешно:', data);
        return data;
    }
    catch (error) {
        console.error('📦 Ошибка отправки закупки:', error);
        throw error;
    }
}
/**
 * Получает информацию о Telegram боте с сервера
 * @returns Promise<BotInfoResponse> - Информация о боте
 */
async function getTelegramBotInfo() {
    console.log('🤖 Запрашиваем информацию о Telegram боте');
    try {
        const response = await fetch(CONFIG.telegramBotInfoUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('🤖 Ответ от сервера бота:', {
            status: response.status,
            statusText: response.statusText
        });
        if (!response.ok) {
            console.error('🤖 Ошибка получения информации о боте:', response.statusText);
            return {
                success: false,
                error: `Ошибка сервера: ${response.status}`
            };
        }
        const data = await response.json();
        console.log('🤖 Получена информация о боте:', data);
        return data;
    }
    catch (error) {
        console.error('🤖 Ошибка при получении информации о боте:', error);
        return {
            success: false,
            error: 'Ошибка сети при получении информации о боте'
        };
    }
}
/**
 * Выполняет POST-запрос к серверу
 * @param url - Адрес запроса
 * @param body - Тело запроса
 * @param isTokenRequest - Если true, ожидает строку токена, иначе JSON
 * @returns Promise<object|string> - Ответ сервера
 */
async function sendPostRequest(url, body, isTokenRequest = false) {
    console.log('🌐 Отправляем POST запрос:', url, isTokenRequest ? '(режим токена)' : '(режим JSON)');
    try {
        const headers = await createHeaders();
        console.log('🌐 Заголовки запроса:', Object.fromEntries(headers.entries()));
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        console.log('🌐 Получен ответ:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        if (!response.ok) {
            const responseText = await response.text();
            console.error('🌐 Ошибка ответа:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });
            if (response.status === 401) {
                console.warn('🔐 Неавторизованный доступ. Токен будет удалён.');
                await removeToken();
            }
            throw new Error(`Ошибка ответа: ${response.status} (${response.statusText})`);
        }
        const text = await response.text();
        console.log('🌐 Текст ответа:', text);
        if (text.trim() === "") {
            throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE);
        }
        // Если это запрос токена, возвращаем строку как есть
        if (isTokenRequest) {
            console.log('🔐 Возвращаем токен как строку');
            return text.trim();
        }
        // Для обычных запросов пытаемся парсить JSON
        try {
            const data = JSON.parse(text);
            console.log('🌐 Распарсенные данные:', data);
            return data;
        }
        catch (error) {
            console.log('🌐 Ответ не является JSON, возвращаем как строку:', text);
            // Если это не JSON, возвращаем строку как есть (например, номер закупки)
            return { success: true, data: text.trim() };
        }
    }
    catch (error) {
        console.error('🌐 Общая ошибка при отправке запроса:', error);
        throw error;
    }
}
/**
 * Создает заголовки для запроса
 * @returns Promise<Headers> - Заголовки запроса
 */
async function createHeaders() {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
    });
    const token = await getToken();
    if (token) {
        const preview = token.length > 20 ? `${token.substring(0, 20)}...` : token;
        console.log('🔐 Используем токен для авторизации, превью:', preview);
        headers.append('Authorization', 'Bearer ' + token);
    }
    else {
        console.warn('🔐 Токен отсутствует, запрос без авторизации');
    }
    return headers;
}


// background.js
/**
 * Слушатель запросов на background.js
 */
chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
    console.log('📬 Получено сообщение в background:', request);
    // Проверяем на ошибки runtime
    if (chrome.runtime.lastError) {
        console.error('❌ Runtime error:', chrome.runtime.lastError);
        sendResponse({ result: false, error: chrome.runtime.lastError.message || 'Unknown error' });
        return true;
    }
    switch (request.destination) {
        case MESSAGE_TYPES.PROCUREMENT_SENDER:
            senderHandler(request, sendResponse);
            return true;
        case MESSAGE_TYPES.LOGIN_CODE:
            loginCodeHandler(request, sendResponse);
            return true;
        case MESSAGE_TYPES.CHECK_AUTH:
            checkAuthHandler(request, sendResponse);
            return true;
        default:
            console.warn('❌ Неизвестный тип сообщения:', request.destination);
            sendResponse({ result: false, error: 'Неизвестный тип сообщения' });
            return true;
    }
});
/**
 * Обработчик события destination === "checkAuth". Проверяет авторизацию пользователя.
 * @param request - Входящее сообщение
 * @param sendResponse - Функция для отправки ответа
 */
async function checkAuthHandler(_request, sendResponse) {
    console.log('🔐 Проверка авторизации пользователя');
    try {
        const isAuthorized = await verifyToken();
        console.log('🔐 Результат проверки авторизации:', isAuthorized);
        sendResponse({ isAuthorized });
    }
    catch (error) {
        console.error('🔐 Ошибка при проверке авторизации:', error);
        sendResponse({ isAuthorized: false });
    }
}
/**
 * Обработчик события destination === "loginCode". Посылает код авторизации на сервер.
 * @param request - Входящее сообщение
 * @param sendResponse - Функция для отправки ответа
 */
async function loginCodeHandler(request, sendResponse) {
    console.log('🔐 Обработка кода авторизации:', request.data);
    try {
        if (!request.data || typeof request.data !== 'string') {
            throw new Error('Неверный формат кода авторизации');
        }
        const data = await sendCodeAndReceiveToken(request.data);
        console.log('🔐 Получены данные авторизации для сохранения:', data);
        await saveToken(data);
        console.log('🔐 Токен сохранен, отправляем успешный ответ');
        sendResponse({ result: true });
    }
    catch (error) {
        console.error('🔐 Ошибка при авторизации в background:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        sendResponse({ result: false, error: errorMessage });
    }
}
/**
 * Обработчик события destination === "procurementSender". Посылает спарсенную закупку на сервер.
 * @param request - Входящее сообщение
 * @param sendResponse - Функция для отправки ответа
 */
async function senderHandler(request, sendResponse) {
    console.log('📦 Обработка отправки закупки:', request.data);
    try {
        if (!request.data || typeof request.data !== 'object') {
            throw new Error('Неверный формат данных закупки');
        }
        const data = await sendProcurement(request.data);
        console.log('📦 Закупка успешно отправлена:', data);
        sendResponse({ result: true, data });
    }
    catch (error) {
        console.error('📦 Ошибка при отправке закупки в background:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        sendResponse({ result: false, error: errorMessage });
    }
}


