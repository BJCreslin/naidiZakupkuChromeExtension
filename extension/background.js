import {sendCodeAndReceiveToken} from './api';
import {saveToken} from './localStorage';

const SERVER_URL = "http://localhost:9000/";
const POST_PROCUREMENT_URL = SERVER_URL + "api/chromeExtension/v1/procurement";


/**
 * Слушатель запросов на background.js
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log('Значение переменной: ', request)

        if (request.destination === "procurementSender") {
            return senderHandler(request, sendResponse);
        }
        if (request.destination === "loginCode") {
            return loginCodeHandler(request, sendResponse);
        }
    }
);

/**
 * Обработчик события destination === "loginCode". Посылает код авторизации на сервер.
 * @param request
 * @param sendResponse
 * @returns {undefined}
 */
async function loginCodeHandler(request, sendResponse) {
    debugger;
    const numberTgCode =
        {numberCode: request.data};
    sendCodeAndReceiveToken(numberTgCode)
        .then((data) => {
            saveToken(data);
            sendResponse(
                {result: true});
        })
        .catch(error => {
            console.log('Ошибка при авторизации: ', error);
            sendResponse(
                {result: false}
            );
        });
}

/**
 * Обработчик события destination === "procurementSender" . Посылает спарсенную закупку на сервер.
 * @param request
 * @param sendResponse
 * @returns {boolean}
 */
function senderHandler(request, sendResponse) {
    console.log('Значение переменной: ', request)
    fetch(POST_PROCUREMENT_URL, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(request.data)
    }).then((response) => {
        console.log('Статус ответа: ', response.status, response.statusText);

        if (!response.ok) {
            return Promise.reject(new Error(
                'Response failed: ' + response.status + ' (' + response.statusText + ')'
            ));
        }

        return response.text().then(text => {
            if (text.trim() === "") {
                throw new Error('Пустой ответ');
            }

            try {
                return JSON.parse(text);
            } catch (error) {
                throw new Error('Ошибка парсинга JSON: ' + text);
            }
        });
    }).then((data) => {
        console.log('Полученные данные: ', data);
        sendResponse(201);
    }).catch((error) => {
        console.error('Ошибка при отправке запроса: ', error);
        sendResponse({error: error.message});
    });

    return true;
}

/**
 * Создает заголовки
 */
function createHeaders() {
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=utf-8');
    myHeaders.append('Accept', 'application/json');
    return myHeaders;
}