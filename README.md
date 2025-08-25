# NaidiZakupku Chrome Extension

Маленький помощник в больших закупках - Chrome расширение для сохранения закупок с сайта zakupki.gov.ru

## 🚀 JavaScript Implementation

Расширение полностью написано на чистом JavaScript для простоты разработки и использования.

### Основные преимущества:

- **Простота** - нет необходимости в TypeScript компиляторе
- **Скорость** - быстрая сборка без дополнительной компиляции
- **Совместимость** - работает в любом браузере без дополнительных инструментов
- **Читаемость** - чистый JavaScript код без лишних абстракций
- **Доступность** - легко понять и модифицировать любому разработчику

## 📁 Структура проекта

```
naidiZakupkuChromeExtension/
├── src/                    # JavaScript исходники
│   ├── config.js          # Конфигурация и константы
│   ├── localStorage.js    # Работа с хранилищем
│   ├── api.js            # API запросы
│   ├── background.js     # Background script
│   ├── popup.js          # Popup интерфейс
│   └── application.js    # Content script
├── extension/             # Статические ресурсы
│   ├── icons/            # Иконки расширения
│   ├── style/            # CSS стили
│   ├── popup.html        # HTML popup
│   ├── manifest.json     # Манифест расширения
│   └── qrcode.min.js     # Библиотека QR кодов
├── dist/                 # Собранные файлы (создается автоматически)
├── scripts/              # Скрипты сборки
│   ├── bundle.js         # Бандлер JavaScript модулей
│   └── dev.js           # Скрипт разработки
├── package.json          # Зависимости и скрипты
└── README.md            # Документация
```

## 🛠 Установка и разработка

### Предварительные требования

- Node.js 16+ 
- npm или yarn

### Установка зависимостей

```bash
npm install
```

### Команды разработки

```bash
# Сборка проекта
npm run build

# Быстрая сборка для разработки
npm run dev

# Очистка папки dist
npm run clean

# Справка по разработке
npm run start
```

### Загрузка расширения в Chrome

1. Выполните сборку: `npm run build`
2. Откройте Chrome и перейдите в `chrome://extensions/`
3. Включите "Режим разработчика"
4. Нажмите "Загрузить распакованное расширение"
5. Выберите папку `dist/`

## 📝 Структуры данных

### Основные объекты

```javascript
// Сообщения между компонентами
const chromeMessage = {
  destination: 'procurementSender', // 'loginCode' | 'checkAuth'
  data: {} // любые данные
};

// Данные закупки
const procurementData = {
  federalLawNumber: "44",
  linkOnPlacement: "https://zakupki.gov.ru/...",
  name: "Название закупки",
  publisher: "Организатор",
  price: "1000000.00",
  timeZone: "UTC+3",
  registryNumber: "0123456789"
};

// Ответы API
const apiResponse = {
  success: true,
  data: "результат",
  error: null // или строка с ошибкой
};
```

### Конфигурация

Все константы и настройки вынесены в `src/config.js`:

```javascript
const BASE_URL = "https://naidizakupku.ru";
const API_PATH = "/api/backend/api";

export const CONFIG = {
  baseUrl: BASE_URL,
  serverUrl: `${BASE_URL}/`,
  healthCheckUrl: `${BASE_URL}${API_PATH}/health`,
  loginUrl: `${BASE_URL}${API_PATH}/v1/login`,
  procurementUrl: `${BASE_URL}/api/backend/chromeExtension/v1/procurement`,
  // ...
};
```

**Константы конфигурации:**
- `BASE_URL` - базовый адрес бэкенда для централизованного управления окружением
- `API_PATH` - общий путь к API endpoints для упрощения изменения структуры API

Все API endpoints формируются относительно этих констант, что упрощает смену окружения (dev/staging/prod) и структуры API.

## 🔧 Архитектура

### Компоненты

1. **Background Script** (`background.js`) - обработка сообщений и API запросов
2. **Popup** (`popup.js`) - интерфейс авторизации и управления
3. **Content Script** (`application.js`) - парсинг страниц закупок
4. **API** (`api.js`) - взаимодействие с сервером
5. **Storage** (`localStorage.js`) - работа с локальным хранилищем

### Поток данных

```
Content Script → Background Script → API → Server
     ↓              ↓
Popup ← Background Script ← API Response
```

## 🎯 Функциональность

### Авторизация
- QR-код для подключения к Telegram боту
- Проверка токена авторизации
- Сохранение состояния авторизации

### Парсинг закупок
- Поддержка 44-ФЗ и 223-ФЗ
- Автоматическое определение типа закупки
- Извлечение всех необходимых данных

### Управление статусами
- Исключение отмененных закупок
- Настраиваемый список статусов исключения
- Импорт/экспорт конфигурации

## 🐛 Отладка

### Логирование
Все компоненты используют консольное логирование с эмодзи для легкой идентификации:

- 🔐 - Авторизация
- 📦 - Закупки
- 🌐 - API запросы
- 💾 - Хранилище
- 🔧 - Утилиты

### Chrome DevTools
- **Background Script**: `chrome://extensions/` → Найти расширение → "Проверить представления"
- **Content Script**: DevTools на странице закупки
- **Popup**: Правый клик на иконке расширения → "Проверить"

## 📦 Сборка для продакшена

```bash
# Очистка и сборка
npm run clean
npm run build

# Папка dist/ готова для загрузки в Chrome Web Store
```

## 🔧 Процесс сборки

Система сборки автоматически:

1. **Копирует статические ресурсы** из `extension/` в `dist/`
2. **Объединяет JavaScript модули** в единые файлы
3. **Удаляет import/export** для совместимости с Chrome
4. **Обновляет manifest.json** для использования собранных файлов

### Результат сборки:
- `background-bundled.js` - объединенный background script
- `application-bundled.js` - объединенный content script  
- `popup.js` - объединенный popup с зависимостями
- Все статические ресурсы (HTML, CSS, иконки)

## 📚 Дополнительные возможности

### Новые функции
Добавьте новые функции в соответствующие файлы `src/`:

```javascript
// src/api.js
export async function newApiFunction() {
  // ваш код
}

// src/config.js
export const NEW_CONSTANTS = {
  feature: "value"
};
```

### Обновление статусов исключений
Используйте консоль браузера на странице zakupki.gov.ru:

```javascript
// Добавить новый статус исключения
procurementStatusManager.addStatus("Новый статус");

// Показать все статусы
procurementStatusManager.showStatuses();

// Экспорт конфигурации
const config = procurementStatusManager.exportConfig();
```

## 🤝 Вклад в проект

1. Создайте ветку для новой функции
2. Внесите изменения в JavaScript файлы в папке `src/`
3. Проверьте сборку: `npm run build`
4. Протестируйте функциональность в Chrome
5. Создайте Pull Request

## 📄 Лицензия

MIT License 