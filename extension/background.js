import {sendCodeAndReceiveToken, sendProcurement} from './api.js';
import {saveToken} from './localStorage.js';

/**
 * Слушатель запросов на background.js
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log('📬 Получено сообщение в background:', request)

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
    console.log('🔐 Обработка кода авторизации:', request.data);
    
    try {
        const data = await sendCodeAndReceiveToken(request.data);
        console.log('🔐 Получены данные авторизации для сохранения:', data);
        
        await saveToken(data);
        console.log('🔐 Токен сохранен, отправляем успешный ответ');
        
        sendResponse({result: true});
    } catch (error) {
        console.error('🔐 Ошибка при авторизации в background:', error);
        sendResponse({result: false, error: error.message});
    }
}

/**
 * Обработчик события destination === "procurementSender". Посылает спарсенную закупку на сервер.
 * @param request
 * @param sendResponse
 * @returns {boolean}
 */
async function senderHandler(request, sendResponse) {
    console.log('📦 Обработка отправки закупки:', request.data);
    
    try {
        const data = await sendProcurement(request.data);
        console.log('📦 Закупка успешно отправлена:', data);
        
        sendResponse({result: true, data});
    } catch (error) {
        console.error('📦 Ошибка при отправке закупки в background:', error);
        sendResponse({result: false, error: error.message});
    }
}
