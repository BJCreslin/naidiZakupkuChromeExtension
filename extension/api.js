import {getToken, removeToken} from './localStorage.js';

const SERVER_URL = "https://naidizakupku.ru/";
const HEALTH_CHECK_URL = SERVER_URL + "api/health";
const CODE_LOGIN_URL = SERVER_URL + "api/v1/login";
const POST_PROCUREMENT_URL = SERVER_URL + "api/chromeExtension/v1/procurement";

/**
 * Проверяет доступность сервера
 * @returns {Promise<boolean>}
 */
export async function checkServerHealth() {
    try {
        const response = await fetch(HEALTH_CHECK_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Сервер недоступен:', error);
        return false;
    }
}

/**
 * Отправляет код авторизации для получения токена.
 * @param {string} code - Код, полученный из Telegram.
 * @returns {Promise<object>}
 */
export async function sendCodeAndReceiveToken(code) {
    const payload = {numberCode: code};
    console.log('🔐 Отправляем код авторизации:', payload);
    
    try {
        const data = await sendPostRequest(CODE_LOGIN_URL, payload, true); // true для режима токена
        console.log('🔐 Получен ответ от сервера авторизации:', data);
        return data;
    } catch (error) {
        console.error('🔐 Ошибка авторизации:', error);
        throw error;
    }
}

/**
 * Отправляет данные о закупке на сервер.
 * @param {object} procurement - Данные о закупке.
 * @returns {Promise<object>}
 */
export async function sendProcurement(procurement) {
    console.log('📦 Отправляем закупку:', procurement);
    
    try {
        const data = await sendPostRequest(POST_PROCUREMENT_URL, procurement, false); // false для обычного JSON
        console.log('📦 Закупка отправлена успешно:', data);
        return data;
    } catch (error) {
        console.error('📦 Ошибка отправки закупки:', error);
        throw error;
    }
}

/**
 * Выполняет POST-запрос к серверу.
 * @param {string} url - Адрес запроса.
 * @param {object} body - Тело запроса.
 * @param {boolean} isTokenRequest - Если true, ожидает строку токена, иначе JSON
 * @returns {Promise<object|string>}
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
            throw new Error('Пустой ответ от сервера');
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
        } catch (error) {
            console.log('🌐 Ответ не является JSON, возвращаем как строку:', text);
            // Если это не JSON, возвращаем строку как есть (например, номер закупки)
            return { success: true, data: text.trim() };
        }

    } catch (error) {
        console.error('🌐 Общая ошибка при отправке запроса:', error);
        throw error;
    }
}

/**
 * Создает заголовки для запроса.
 * @returns {Promise<Headers>}
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
    } else {
        console.warn('🔐 Токен отсутствует, запрос без авторизации');
    }

    return headers;
}
