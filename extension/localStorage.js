const TOKEN_STORAGE_NAME = 'token';

export function saveToken(token) {
    if (token && token.length > 0) {
        localStorage.setItem(TOKEN_STORAGE_NAME, token);
    }
}

export function getToken() {
    return localStorage.getItem(TOKEN_STORAGE_NAME);
}