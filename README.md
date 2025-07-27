# naidiZakupku Chrome Extension

Расширение для парсинга закупок с сайта zakupki.gov.ru и отправки в Telegram бот.

## 🔧 Исправленные проблемы

### ✅ **КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ**

1. **Заменил localStorage на chrome.storage.local API**
   - localStorage не работает в Service Worker (Manifest V3)
   - Добавлена поддержка async/await

2. **Добавлен Content Security Policy (CSP)**
   - Защита от XSS атак
   - Контроль внешних ресурсов

3. **Исправлен production код**
   - Убран `debugger` statement
   - Добавлены TODO для HTTPS

4. **Улучшена безопасность и UX**
   - Добавлен локальный QR код генератор
   - Добавлен `rel="noopener"` для внешних ссылок

### ⚡ **УЛУЧШЕНИЯ АРХИТЕКТУРЫ**

1. **Обработка ошибок DOM**
   - Добавлена функция `safeGetText()` 
   - Защита от null/undefined элементов

2. **Улучшен UX**
   - Loading состояния кнопок
   - Сообщения об ошибках/успехе  
   - Валидация input полей
   - QR код для быстрого доступа к боту

3. **Безопасность запросов**
   - Async/await вместо callbacks
   - Правильная обработка 401 ошибок
   - Логирование ошибок

## 🚨 **ОСТАЮЩИЕСЯ РЕКОМЕНДАЦИИ**

### 1. **✅ HTTPS настроен**
```javascript
// Production сервер настроен
const SERVER_URL = "https://naidizakupku.ru/";
```

### 2. **Улучшить CSS селекторы**
Текущие селекторы хрупкие. Рекомендую:
- Использовать data-атрибуты
- Создать более устойчивые селекторы
- Добавить fallback логику

### 3. **Добавить TypeScript**
```bash
npm install typescript @types/chrome
```

### 4. **✅ QR код библиотека локализована**
```bash
# qrcode.min.js теперь включен локально в расширение
# Решена проблема с CSP для Manifest V3
```

### 5. **Миграция на функциональное программирование**
- Убрать классы в пользу функций
- Использовать модульную архитектуру

## 📋 **Структура проекта**

```
extension/
├── manifest.json          # Manifest V3 конфигурация
├── background.js          # Service Worker
├── popup.html/js          # Popup интерфейс  
├── application.js         # Content Script
├── api.js                 # HTTP API модуль
├── localStorage.js        # chrome.storage API
└── style/
    └── style.css          # Стили
```

## 🔒 **Безопасность**

- ✅ CSP настроен
- ✅ chrome.storage.local вместо localStorage  
- ✅ Валидация пользовательского ввода
- ✅ Безопасная обработка внешних ссылок
- ✅ HTTPS production сервер настроен
- ✅ Health check endpoint для проверки доступности
- ✅ Локальная генерация QR кода (qrcode.min.js включен в расширение)
- ✅ CSP исправлен для MV3 совместимости
- ✅ API endpoints обновлены: `/api/v1/login` для авторизации
- ✅ JWT токен обрабатывается как строка (не JSON)

## 🚀 **Установка**

1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `extension/`

## 🐛 **Отладка**

### Консоли для проверки
- **Background script**: `chrome://extensions` → "background page" 
- **Content script**: DevTools на сайте zakupki.gov.ru
- **Popup**: Правый клик на иконке → "Проверить элемент"

### Отладка ошибки 401 (авторизация)
1. Откройте консоль background script
2. Введите код авторизации в popup
3. Проверьте логи с эмодзи:
   - 🔐 `Отправляем код авторизации`
   - 🔐 `Возвращаем токен как строку`
   - 💾 `Токен успешно сохранен, длина: XXX`
   - 💾 `Превью токена: eyJhbGciOi...`

### Типичные проблемы
- **✅ Исправлено**: Сервер возвращает JWT токен как строку (не JSON)
- **Неправильный endpoint**: Проверьте что используется `/api/v1/login`
- **Истекший токен**: Токен удаляется автоматически при 401
- **Неверный код**: Убедитесь что код из Telegram корректный

### Полезные команды в консоли
```javascript
// Проверить сохраненный токен
chrome.storage.local.get(['token']).then(console.log);

// Очистить токен
chrome.storage.local.remove(['token']);

// Проверить здоровье сервера
fetch('https://naidizakupku.ru/api/health').then(r => console.log(r.status));
``` 