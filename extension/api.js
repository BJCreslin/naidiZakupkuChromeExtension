import {getToken} from './localStorage'

const SERVER_URL = "http://localhost:9000/";
const CODE_LOGIN_URL = SERVER_URL + "api/chromeExtension/v1/login";
const POST_PROCUREMENT_URL = SERVER_URL + "api/chromeExtension/v1/procurement";

/**
 * Запрос на авторизацию с помощью телеграмм кода
 * @returns {Promise<object>}
 * @param code код полученный от телеграмма
 */
export async function sendCodeAndReceiveToken(code) {
    const numberTgCode =
        {numberCode: code};
    return sendPostRequest(CODE_LOGIN_URL, numberTgCode);
}

export async function sendProcurement(procurement){
    return sendPostRequest(POST_PROCUREMENT_URL, procurement);
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
            myHeaders.append('Authorization', 'Bearer_' + token);
        }
    }

    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=utf-8');
    myHeaders.append('Accept', 'application/json');
    addBearerToken();
    return myHeaders;
}