export const CONFIG = {
    serverUrl: "https://naidizakupku.ru/",
    healthCheckUrl: "https://naidizakupku.ru/api/backend/api/health",
    loginUrl: "https://naidizakupku.ru/api/backend/api/v1/login",
    procurementUrl: "https://naidizakupku.ru/api/backend/chromeExtension/v1/procurement",
    verifyTokenUrl: "https://naidizakupku.ru/api/backend/v1/verify-token",
    telegramBotUrl: "https://t.me/mHelperTestTgBot",
    telegramBotInfoUrl: "https://naidizakupku.ru/api/backend/api/auth/telegram-bot/info"
};
export const NUMBER_REGEX = /^[0-9]+$/;
export const MIN_CODE_VALUE = 1000;
export const MAX_CODE_VALUE = 1000000;
export const MESSAGE_TYPES = {
    PROCUREMENT_SENDER: "procurementSender",
    LOGIN_CODE: "loginCode",
    CHECK_AUTH: "checkAuth"
};
export const STORAGE_KEYS = {
    TOKEN: "authToken",
    USER: "userData"
};
export const ERROR_MESSAGES = {
    SERVER_UNAVAILABLE: "Сервер недоступен. Попробуйте позже.",
    CONNECTION_ERROR: "Ошибка подключения",
    UNKNOWN_ERROR: "Неизвестная ошибка авторизации",
    BACKGROUND_ERROR: "Ошибка соединения с background script",
    INVALID_TOKEN: "Токен недействителен",
    EMPTY_RESPONSE: "Пустой ответ от сервера"
};
export const SUCCESS_MESSAGES = {
    CONNECTED: "Успешно подключено!",
    SERVER_AVAILABLE: "Сервер доступен ✅",
    AUTHORIZED: "Вы авторизованы!"
};
