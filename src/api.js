import { getToken, removeToken } from './localStorage';
import { CONFIG, ERROR_MESSAGES } from './config';
/**
 * Проверяет доступность сервера
 * @returns Promise<boolean> - true если сервер доступен
 */
export async function checkServerHealth() {
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
export async function verifyToken() {
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
export async function sendCodeAndReceiveToken(code) {
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
export async function sendProcurement(procurement) {
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
export async function getTelegramBotInfo() {
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
