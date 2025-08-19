# NaidiZakupku Chrome Extension

Chrome расширение для автоматического сохранения закупок с сайта zakupki.gov.ru

## 📋 Анализ проекта

### ✅ Что работает хорошо:

1. **Manifest V3** - правильно настроен для современных требований Chrome
2. **Архитектура** - четкое разделение на background, content scripts и popup
3. **Безопасность** - правильные permissions, CSP настроен
4. **Авторизация** - система токенов с проверкой валидности
5. **Обработка ошибок** - хорошее логирование и обработка исключений
6. **UI/UX** - Bootstrap, QR код, уведомления

### ⚠️ Исправленные проблемы:

1. **CSP** - убран `'unsafe-inline'` для повышения безопасности
2. **Runtime errors** - добавлена обработка `chrome.runtime.lastError`
3. **Code cleanup** - убраны пустые строки в конце файлов

### 🔧 Рекомендации по улучшению:

#### 1. Добавить иконки
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png", 
  "128": "icons/icon128.png"
}
```

#### 2. Добавить retry механизм для сетевых запросов
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

#### 3. Добавить offline поддержку
```javascript
// В background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('healthCheck', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'healthCheck') {
        await checkServerHealth();
    }
});
```

#### 4. Улучшить error handling в popup.js
```javascript
// Добавить timeout для fetch запросов
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
} catch (error) {
    if (error.name === 'AbortError') {
        showErrorMessage('Превышено время ожидания');
    }
} finally {
    clearTimeout(timeoutId);
}
```

#### 5. Добавить unit тесты
```javascript
// tests/api.test.js
describe('API Tests', () => {
    test('checkServerHealth returns boolean', async () => {
        const result = await checkServerHealth();
        expect(typeof result).toBe('boolean');
    });
});
```

## 🚀 Установка и запуск

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Developer mode"
3. Нажмите "Load unpacked" и выберите папку `extension/`
4. Расширение готово к использованию

## 📁 Структура проекта

```
extension/
├── manifest.json          # Конфигурация расширения
├── background.js          # Service Worker (MV3)
├── popup.html            # UI расширения
├── popup.js              # Логика popup
├── application.js        # Content script для zakupki.gov.ru
├── api.js               # API для взаимодействия с сервером
├── localStorage.js      # Работа с chrome.storage
├── qrcode.min.js        # Библиотека для QR кодов
└── style/
    └── style.css        # Стили расширения
```

## 🔐 Авторизация

1. Откройте расширение
2. Отсканируйте QR код или перейдите в Telegram бот
3. Получите код авторизации
4. Введите код в расширение

## 🛠️ Разработка

### Добавление новых типов закупок:

1. Создайте новый класс парсера в `application.js`
2. Наследуйтесь от `ProcurementParserInterface`
3. Реализуйте все обязательные методы
4. Добавьте условие в `initializeProcurementPage()`

### Добавление новых статусов исключений:

```javascript
// В консоли браузера на странице закупки
procurementStatusManager.addStatus("Новый статус для исключения");
procurementStatusManager.showStatuses();
```

## 📊 Мониторинг

- Логи доступны в DevTools → Console
- Background script логи в chrome://extensions/ → Details → Service Worker
- Content script логи на странице закупки

## 🔒 Безопасность

- CSP настроен без `unsafe-inline`
- Минимальные permissions
- Токены хранятся в chrome.storage.local
- Автоматическая проверка валидности токенов

## 📈 Производительность

- Service Worker не блокирует UI
- Асинхронная обработка запросов
- Кэширование токенов
- Оптимизированные DOM селекторы

## 🐛 Отладка

1. **Popup не открывается**: проверьте manifest.json и popup.html
2. **Кнопка не появляется**: проверьте авторизацию и content script
3. **Ошибки API**: проверьте логи в background script
4. **Парсинг не работает**: проверьте селекторы в application.js

## 📝 TODO

- [ ] Добавить иконки расширения
- [ ] Реализовать retry механизм
- [ ] Добавить offline поддержку
- [ ] Написать unit тесты
- [ ] Добавить TypeScript
- [ ] Улучшить error handling
- [ ] Добавить analytics
- [ ] Оптимизировать bundle size 