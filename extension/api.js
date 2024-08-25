const CODE_LOGIN_URL = SERVER_URL + "api/chromeExtension/v1/login";

export function sendCode(numberTgCode) {
    fetch(CODE_LOGIN_URL, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(numberTgCode)
    }).then((response) => {
        console.log('Статус ответа на login: ', response.status, response.statusText);
        debugger;
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
        sendResponse(200);
    }).catch((error) => {
        console.error('Ошибка при отправке запроса: ', error);
        sendResponse({error: error.message});
    });
    return true;
}