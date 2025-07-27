const TOKEN_STORAGE_NAME = 'token';

/**
 * Сохраняет токен в chrome.storage.local
 * @param {string|object} token
 */
export async function saveToken(token) {
    console.log('💾 Сохраняем токен:', typeof token, token);
    
    let tokenToSave = token;
    
    // Если токен пришел как объект, попробуем извлечь строку
    if (typeof token === 'object' && token !== null) {
        console.log('💾 Токен пришел как объект, ищем поле токена');
        
        // Попробуем разные возможные поля для токена
        if (token.token) {
            tokenToSave = token.token;
            console.log('💾 Найдено поле token');
        } else if (token.access_token) {
            tokenToSave = token.access_token;
            console.log('💾 Найдено поле access_token');
        } else if (token.accessToken) {
            tokenToSave = token.accessToken;
            console.log('💾 Найдено поле accessToken');
        } else {
            console.warn('💾 Токен пришел как объект, но не найдено стандартное поле токена:', token);
            // Попробуем сохранить как строку JSON
            tokenToSave = JSON.stringify(token);
        }
    }
    
    // Проверяем что токен - валидная строка
    if (typeof tokenToSave === 'string' && tokenToSave.length > 0) {
        try {
            await chrome.storage.local.set({ [TOKEN_STORAGE_NAME]: tokenToSave });
            console.log('💾 Токен успешно сохранен, длина:', tokenToSave.length);
            
            // Логируем начало токена для отладки (без раскрытия полного токена)
            const preview = tokenToSave.length > 20 ? 
                tokenToSave.substring(0, 20) + '...' : 
                tokenToSave;
            console.log('💾 Превью токена:', preview);
            
        } catch (error) {
            console.error('💾 Ошибка при сохранении токена:', error);
        }
    } else {
        console.warn('💾 Невалидный токен для сохранения:', tokenToSave);
    }
}

/**
 * Получает токен из chrome.storage.local
 * @returns {Promise<string|null>}
 */
export async function getToken() {
    try {
        const result = await chrome.storage.local.get([TOKEN_STORAGE_NAME]);
        const token = result[TOKEN_STORAGE_NAME] || null;
        
        if (token) {
            const preview = token.length > 20 ? 
                token.substring(0, 20) + '...' : 
                token;
            console.log('💾 Токен получен из хранилища, длина:', token.length, 'превью:', preview);
        } else {
            console.log('💾 Токен отсутствует в хранилище');
        }
        
        return token;
    } catch (error) {
        console.error('💾 Ошибка при получении токена:', error);
        return null;
    }
}

/**
 * Удаляет токен из chrome.storage.local
 */
export async function removeToken() {
    try {
        await chrome.storage.local.remove([TOKEN_STORAGE_NAME]);
        console.log('💾 Токен удален из хранилища');
    } catch (error) {
        console.error('💾 Ошибка при удалении токена:', error);
    }
}
