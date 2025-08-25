import { STORAGE_KEYS } from './config';
/**
 * Сохраняет токен авторизации в локальном хранилище
 * @param data - Данные для сохранения (токен или полный ответ авторизации)
 */
export async function saveToken(data) {
    try {
        console.log('💾 Сохраняем токен в localStorage, данные:', data);
        let token;
        let userData;
        if (typeof data === 'string') {
            token = data;
            console.log('💾 Токен как строка:', token);
        }
        else {
            token = data.token;
            userData = data.user;
            console.log('💾 Токен из объекта:', token);
            console.log('💾 Данные пользователя:', userData);
        }
        const storageData = {
            [STORAGE_KEYS.TOKEN]: token,
            ...(userData && { [STORAGE_KEYS.USER]: userData })
        };
        console.log('💾 Данные для сохранения:', storageData);
        await chrome.storage.local.set(storageData);
        console.log('💾 Токен успешно сохранен');
    }
    catch (error) {
        console.error('💾 Ошибка сохранения токена:', error);
        throw new Error('Не удалось сохранить токен');
    }
}
/**
 * Получает токен авторизации из локального хранилища
 * @returns Promise<string | null> - Токен или null если не найден
 */
export async function getToken() {
    try {
        console.log('💾 Получаем токен из localStorage');
        const result = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
        console.log('💾 Результат запроса:', result);
        const token = result[STORAGE_KEYS.TOKEN];
        console.log('💾 Извлеченный токен:', token);
        if (token) {
            console.log('💾 Токен найден, длина:', token.length);
            return token;
        }
        else {
            console.log('💾 Токен не найден');
            return null;
        }
    }
    catch (error) {
        console.error('💾 Ошибка получения токена:', error);
        return null;
    }
}
/**
 * Удаляет токен авторизации из локального хранилища
 */
export async function removeToken() {
    try {
        console.log('💾 Удаляем токен из localStorage');
        await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        console.log('💾 Токен успешно удален');
    }
    catch (error) {
        console.error('💾 Ошибка удаления токена:', error);
        throw new Error('Не удалось удалить токен');
    }
}
/**
 * Получает данные пользователя из локального хранилища
 * @returns Promise<StorageData['user'] | null> - Данные пользователя или null
 */
export async function getUserData() {
    try {
        console.log('💾 Получаем данные пользователя из localStorage');
        const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
        const userData = result[STORAGE_KEYS.USER];
        if (userData) {
            console.log('💾 Данные пользователя найдены');
            return userData;
        }
        else {
            console.log('💾 Данные пользователя не найдены');
            return null;
        }
    }
    catch (error) {
        console.error('💾 Ошибка получения данных пользователя:', error);
        return null;
    }
}
/**
 * Очищает все данные авторизации из локального хранилища
 */
export async function clearAuthData() {
    try {
        console.log('💾 Очищаем все данные авторизации');
        await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        console.log('💾 Данные авторизации успешно очищены');
    }
    catch (error) {
        console.error('💾 Ошибка очистки данных авторизации:', error);
        throw new Error('Не удалось очистить данные авторизации');
    }
}
/**
 * Проверяет наличие токена в локальном хранилище
 * @returns Promise<boolean> - true если токен существует
 */
export async function hasToken() {
    const token = await getToken();
    return token !== null;
}
