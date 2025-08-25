import { sendCodeAndReceiveToken, sendProcurement, verifyToken } from './api';
import { saveToken } from './localStorage';
import { MESSAGE_TYPES } from './config';
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
