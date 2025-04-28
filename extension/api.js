import {getToken, removeToken} from './localStorage';

const SERVER_URL = "http://localhost:9000/";
const CODE_LOGIN_URL = SERVER_URL + "api/chromeExtension/v1/login";
const POST_PROCUREMENT_URL = SERVER_URL + "api/chromeExtension/v1/procurement";

/**
 * Отправляет код авторизации для получения токена.
 * @param {string} code - Код, полученный из Telegram.
 * @returns {Promise<object>}
 */
export async function sendCodeAndReceiveToken(code) {
    const payload = {numberCode: code};
    return sendPostRequest(CODE_LOGIN_URL, payload);
}

/**
 * Отправляет данные о закупке на сервер.
 * @param {object} procurement - Данные о закупке.
 * @returns {Promise<object>}
 */
export async function sendProcurement(procurement) {
    return sendPostRequest(POST_PROCUREMENT_URL, procurement);
}

/**
 * Выполняет POST-запрос к серверу.
 * @param {string} url - Адрес запроса.
 * @param {object} body - Тело запроса.
 * @returns {Promise<object>}
 */
async function sendPostRequest(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: createHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Неавторизованный доступ. Токен будет удалён.');
                removeToken();
                // При необходимости можно добавить перенаправление:
                // window.location.href = '/login.html';
            }
            throw new Error(`Ошибка ответа: ${response.status} (${response.statusText})`);
        }

        const text = await response.text();

        if (text.trim() === "") {
            throw new Error('Пустой ответ от сервера');
        }

        try {
            const data = JSON.parse(text);
            console.log('Полученные данные:', data);
            return data;
        } catch (error) {
            throw new Error('Ошибка парсинга JSON: ' + text);
        }

    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        throw error;
    }
}

/**
 * Создает заголовки для запроса.
 * @returns {Headers}
 */
function createHeaders() {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
    });

    const token = getToken();
    if (token) {
        headers.append('Authorization', 'Bearer ' + token);
    }

    return headers;
}
