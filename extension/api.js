import {getToken} from './localStorage'

const SERVER_URL = "http://localhost:9000/";
const CODE_LOGIN_URL = SERVER_URL + "api/chromeExtension/v1/login";

/**
 * Запрос на авторизацию с помощью телеграмм кода
 * @param numberTgCode - объект с данными для авторизации по телеграмм коду
 * @returns {Promise<object>}
 */
export async function sendCodeAndReceiveToken(numberTgCode) {
    return sendPostRequest(CODE_LOGIN_URL, numberTgCode);
}


async function sendPostRequest(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: createHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Response failed: ' + response.status + ' (' + response.statusText + ')');
        }

        const text = await response.text();

        if (text.trim() === "") {
            throw new Error('Пустой ответ');
        }

        try {
            const data = JSON.parse(text);
            console.log('Полученные данные: ', data);
            return data;
        } catch (error) {
            throw new Error('Ошибка парсинга JSON: ' + text);
        }

    } catch (error) {
        console.error('Ошибка при отправке запроса: ', error);
        throw error;
    }
}

/**
 * Создает заголовки
 */
function createHeaders() {

    function addBearerToken() {
        const token = getToken();
        if (token && token.length > 0) {
            myHeaders.append('Authorization', 'Bearer' + token);
        }
    }

    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=utf-8');
    myHeaders.append('Accept', 'application/json');
    addBearerToken();
    return myHeaders;
}