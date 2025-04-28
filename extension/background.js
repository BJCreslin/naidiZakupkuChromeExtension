import {sendCodeAndReceiveToken, sendProcurement} from './api';
import {saveToken} from './localStorage';

/**
 * Слушатель запросов на background.js
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log('Значение переменной: ', request)

        if (request.destination === "procurementSender") {
            senderHandler(request, sendResponse);
            return true;
        }
        if (request.destination === "loginCode") {
            loginCodeHandler(request, sendResponse);
            return true;
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
    try {
        const data = await sendCodeAndReceiveToken(request.data);
        saveToken(data);
        sendResponse({result: true});
    } catch (error) {
        console.log('Ошибка при авторизации: ', error);
        sendResponse({result: false});
    }
}

/**
 * Обработчик события destination === "procurementSender" . Посылает спарсенную закупку на сервер.
 * @param request
 * @param sendResponse
 * @returns {boolean}
 */
function senderHandler(request, sendResponse) {
    console.log('Значение переменной: ', request)
    sendProcurement(request.data)
        .then((data) => {
            sendResponse(
                {result: true});
        })
        .catch(error => {
            console.log('Ошибка при отправке закупки: ', error);
            sendResponse(
                {result: false}
            );
        })
}
