const TOKEN_STORAGE_NAME = 'token';

/**
 * Сохраняет токен в localStorage.
 * @param {string} token
 */
export function saveToken(token) {
    if (typeof token === 'string' && token.length > 0) {
        try {
            localStorage.setItem(TOKEN_STORAGE_NAME, token);
        } catch (error) {
            console.error('Ошибка при сохранении токена:', error);
        }
    }
}

/**
 * Получает токен из localStorage.
 * @returns {string|null}
 */
export function getToken() {
    try {
        return localStorage.getItem(TOKEN_STORAGE_NAME);
    } catch (error) {
        console.error('Ошибка при получении токена:', error);
        return null;
    }
}

/**
 * Удаляет токен из localStorage.
 */
export function removeToken() {
    try {
        localStorage.removeItem(TOKEN_STORAGE_NAME);
    } catch (error) {
        console.error('Ошибка при удалении токена:', error);
    }
}
