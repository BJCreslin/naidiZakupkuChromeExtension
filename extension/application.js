const URL = document.documentURI;
const BUTTON_NAME = "Запомнить";
const BUTTON_CLASS = "btn btn-primary";
const BOOTSTRAP_LINK = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css";
const BOOTSTRAP_INTEGRITY = "sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We"

/**
 * Проверяет, авторизован ли пользователь
 * @returns {Promise<boolean>} true если пользователь авторизован
 */
async function isUserAuthorized() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { destination: "checkAuth" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('🔐 Ошибка проверки авторизации:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    resolve(response?.isAuthorized || false);
                }
            }
        );
    });
}

const dataAboutProcurement = {
    federalLawNumber: "",
    linkOnPlacement: "",
    name: "",
    publisher: "",
    price: "",
    timeZone: "",
}

/**
 * Конфигурация статусов для исключения закупок
 */
const cancelledStatusConfig = {
    // Статусы для исключения (по умолчанию)
    excludedStatuses: [
        "Определение поставщика отменено",
        "отменено",
        "Отменено",
        "Закупка отменена",
        "Процедура отменена"
    ],

    /**
     * Добавляет новый статус в список исключений
     * @param {string} status - Статус для добавления
     */
    addStatus(status) {
        if (status && typeof status === 'string' && !this.excludedStatuses.includes(status)) {
            this.excludedStatuses.push(status);
            this.saveToStorage();
            console.log(`Добавлен статус исключения: "${status}"`);
        }
    },

    /**
     * Удаляет статус из списка исключений
     * @param {string} status - Статус для удаления
     */
    removeStatus(status) {
        const index = this.excludedStatuses.indexOf(status);
        if (index !== -1) {
            this.excludedStatuses.splice(index, 1);
            this.saveToStorage();
            console.log(`Удален статус исключения: "${status}"`);
        }
    },

    /**
     * Получает все статусы исключений
     * @returns {Array<string>} Массив статусов
     */
    getStatuses() {
        return [...this.excludedStatuses];
    },

    /**
     * Проверяет, содержится ли статус в списке исключений
     * @param {string} status - Статус для проверки
     * @returns {boolean} true если статус в списке исключений
     */
    isStatusExcluded(status) {
        return this.excludedStatuses.some(excludedStatus => 
            status && status.includes(excludedStatus)
        );
    },

    /**
     * Очищает все статусы исключений
     */
    clearAllStatuses() {
        this.excludedStatuses = [];
        this.saveToStorage();
        console.log("Все статусы исключений очищены");
    },

    /**
     * Сохраняет конфигурацию в localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('cancelledStatusConfig', JSON.stringify(this.excludedStatuses));
        } catch (error) {
            console.warn('Не удалось сохранить конфигурацию статусов:', error);
        }
    },

    /**
     * Загружает конфигурацию из localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('cancelledStatusConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.excludedStatuses = parsed;
                    console.log('Конфигурация статусов загружена из localStorage');
                }
            }
        } catch (error) {
            console.warn('Не удалось загрузить конфигурацию статусов:', error);
        }
    },

    /**
     * Сбрасывает конфигурацию к значениям по умолчанию
     */
    resetToDefault() {
        this.excludedStatuses = [
            "Определение поставщика отменено",
            "отменено", 
            "Отменено",
            "Закупка отменена",
            "Процедура отменена"
        ];
        this.saveToStorage();
        console.log("Конфигурация статусов сброшена к значениям по умолчанию");
    }
};

// Загружаем сохраненную конфигурацию при инициализации
cancelledStatusConfig.loadFromStorage();

// Экспортируем функции управления статусами в глобальную область видимости
window.procurementStatusManager = {
    /**
     * Добавляет статус в список исключений
     * @param {string} status - Статус для добавления
     */
    addStatus: (status) => cancelledStatusConfig.addStatus(status),
    
    /**
     * Удаляет статус из списка исключений
     * @param {string} status - Статус для удаления
     */
    removeStatus: (status) => cancelledStatusConfig.removeStatus(status),
    
    /**
     * Получает все статусы исключений
     * @returns {Array<string>} Массив статусов
     */
    getStatuses: () => cancelledStatusConfig.getStatuses(),
    
    /**
     * Очищает все статусы исключений
     */
    clearAll: () => cancelledStatusConfig.clearAllStatuses(),
    
    /**
     * Сбрасывает к настройкам по умолчанию
     */
    resetToDefault: () => cancelledStatusConfig.resetToDefault(),
    
    /**
     * Показывает текущие статусы в консоли
     */
    showStatuses: () => {
        const statuses = cancelledStatusConfig.getStatuses();
        console.log("Текущие статусы исключений:");
        statuses.forEach((status, index) => {
            console.log(`${index + 1}. "${status}"`);
        });
        console.log(`Всего статусов: ${statuses.length}`);
    },
    
    /**
     * Экспортирует конфигурацию статусов в JSON
     * @returns {string} JSON строка с конфигурацией
     */
    exportConfig: () => {
        const config = {
            statuses: cancelledStatusConfig.getStatuses(),
            exportDate: new Date().toISOString(),
            version: "1.0"
        };
        const jsonString = JSON.stringify(config, null, 2);
        console.log("Конфигурация статусов экспортирована:");
        console.log(jsonString);
        return jsonString;
    },
    
    /**
     * Импортирует конфигурацию статусов из JSON
     * @param {string} jsonConfig - JSON строка с конфигурацией
     */
    importConfig: (jsonConfig) => {
        try {
            const config = JSON.parse(jsonConfig);
            if (config.statuses && Array.isArray(config.statuses)) {
                cancelledStatusConfig.excludedStatuses = config.statuses;
                cancelledStatusConfig.saveToStorage();
                console.log(`Импортировано ${config.statuses.length} статусов`);
                console.log("Дата экспорта:", config.exportDate || "неизвестна");
            } else {
                console.error("Неверный формат конфигурации");
            }
        } catch (error) {
            console.error("Ошибка при импорте конфигурации:", error);
        }
    },
    
    /**
     * Показывает справку по использованию
     */
    help: () => {
        console.log(`
=== Управление статусами исключений ===

Основные команды:
• procurementStatusManager.addStatus("новый статус") - добавить статус
• procurementStatusManager.removeStatus("статус") - удалить статус  
• procurementStatusManager.getStatuses() - получить все статусы
• procurementStatusManager.showStatuses() - показать все статусы
• procurementStatusManager.clearAll() - очистить все статусы
• procurementStatusManager.resetToDefault() - сбросить к умолчанию

Импорт/экспорт:
• procurementStatusManager.exportConfig() - экспортировать настройки
• procurementStatusManager.importConfig(json) - импортировать настройки

Справка:
• procurementStatusManager.help() - показать эту справку

Примеры использования:
procurementStatusManager.addStatus("Торги не состоялись");
procurementStatusManager.removeStatus("отменено");
procurementStatusManager.showStatuses();

// Экспорт настроек
const config = procurementStatusManager.exportConfig();

// Импорт настроек  
procurementStatusManager.importConfig(config);
        `);
    }
};

// Информируем пользователя о доступности менеджера статусов
console.log("🔧 Менеджер статусов исключений загружен!");
console.log("Введите procurementStatusManager.help() для получения справки");
console.log(`Текущее количество статусов исключений: ${cancelledStatusConfig.getStatuses().length}`);

/**
 * Безопасно получает текст элемента
 * @param {string} selector - CSS селектор
 * @returns {string} - Текст элемента или пустая строка
 */
function safeGetText(selector) {
    try {
        const element = document.querySelector(selector);
        return element?.innerText?.trim() || "";
    } catch (error) {
        console.warn(`Не удалось найти элемент: ${selector}`, error);
        return "";
    }
}

/**
 * Показывает уведомление на странице
 * @param {string} title - Заголовок уведомления
 * @param {string} message - Сообщение уведомления
 * @param {string} type - Тип уведомления ('success', 'error', 'info')
 */
function showNotification(title, message, type = 'info') {
    // Создаем контейнер для уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: white;
        cursor: pointer;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
    `;
    
    // Цвета в зависимости от типа
    const colors = {
        success: 'linear-gradient(135deg, #28a745, #20c997)',
        error: 'linear-gradient(135deg, #dc3545, #fd7e14)',
        info: 'linear-gradient(135deg, #007bff, #6f42c1)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    // Содержимое уведомления
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="opacity: 0.9; font-size: 13px;">${message}</div>
        <div style="position: absolute; top: 8px; right: 12px; font-size: 18px; opacity: 0.7;">×</div>
    `;
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое скрытие через 5 секунд
    const hideTimeout = setTimeout(() => {
        hideNotification();
    }, 5000);
    
    // Функция скрытия
    function hideNotification() {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
        clearTimeout(hideTimeout);
    }
    
    // Закрытие по клику
    notification.addEventListener('click', hideNotification);
}

/**
 * Показывает уведомление об успешном сохранении с ссылкой на поиск закупок
 * @param {string} procurementNumber - Номер закупки
 */
function showSuccessNotificationWithLink(procurementNumber) {
    // Создаем контейнер для уведомления с ссылкой
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        min-width: 320px;
        max-width: 450px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: white;
        background: linear-gradient(135deg, #28a745, #20c997);
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
    `;
    
    // Содержимое уведомления с ссылкой
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">✅ Закупка запомнена в сервисе!</div>
        <div style="opacity: 0.9; font-size: 13px; margin-bottom: 12px;">Номер закупки: ${procurementNumber}</div>
        <a href="https://zakupki.gov.ru/epz/order/extendedsearch/results.html" 
           target="_blank" 
           style="display: inline-block; 
                  background: rgba(255,255,255,0.2); 
                  color: white; 
                  text-decoration: none; 
                  padding: 8px 12px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: 500; 
                  border: 1px solid rgba(255,255,255,0.3);
                  transition: all 0.2s ease;">
            🔍 Поиск закупок
        </a>
        <div style="position: absolute; top: 8px; right: 12px; font-size: 18px; opacity: 0.7; cursor: pointer;">×</div>
    `;
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое скрытие через 8 секунд (больше времени для ссылки)
    const hideTimeout = setTimeout(() => {
        hideNotification();
    }, 8000);
    
    // Функция скрытия
    function hideNotification() {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
        clearTimeout(hideTimeout);
    }
    
    // Закрытие по клику на крестик
    const closeButton = notification.querySelector('div[style*="position: absolute"]');
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hideNotification();
    });
    
    // Подсветка ссылки при наведении
    const link = notification.querySelector('a');
    link.addEventListener('mouseenter', () => {
        link.style.background = 'rgba(255,255,255,0.3)';
        link.style.transform = 'translateY(-1px)';
    });
    
    link.addEventListener('mouseleave', () => {
        link.style.background = 'rgba(255,255,255,0.2)';
        link.style.transform = 'translateY(0)';
    });
}

/**
 * Извлекает UTC часть из строки с временной зоной
 * @param {string} timeZoneString - Строка с временной зоной
 * @returns {string} - Только UTC часть без скобок или исходная строка
 */
function extractUTCFromTimeZone(timeZoneString) {
    if (!timeZoneString || typeof timeZoneString !== 'string') return '';
    
    // Ищем паттерн (UTC+число) или (UTC-число) и убираем скобки
    const utcMatch = timeZoneString.match(/\(UTC[+-]\d+\)/);
    if (utcMatch) {
        return utcMatch[0].replace(/[()]/g, '');
    }
    
    // Если не найден стандартный формат, ищем UTC с плюсом/минусом
    const utcSimpleMatch = timeZoneString.match(/UTC[+-]\d+/);
    if (utcSimpleMatch) {
        return utcSimpleMatch[0];
    }
    
    // Если ничего не найдено, возвращаем исходную строку
    return timeZoneString;
}

/**
 * Нормализует цену для совместимости с BigDecimal Java
 * @param {string} input - Исходная строка с ценой
 * @returns {string} - Нормализованная цена
 */
function normalizePriceForBigDecimal(input) {
    if (!input || typeof input !== 'string') return '';
    
    // Убираем все лишние символы, оставляем только цифры, точки, запятые и пробелы
    const regex = /[^0-9.,\s]/g;
    let cleaned = input.replace(regex, '');
    
    // Убираем все пробелы (разделители тысяч)
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Если есть и запятая и точка, определяем что является десятичным разделителем
    if (cleaned.includes(',') && cleaned.includes('.')) {
        // Последний символ-разделитель - десятичный разделитель
        const lastCommaIndex = cleaned.lastIndexOf(',');
        const lastDotIndex = cleaned.lastIndexOf('.');
        
        if (lastCommaIndex > lastDotIndex) {
            // Запятая идет позже - она десятичный разделитель
            // Убираем все точки (разделители тысяч) и заменяем запятую на точку
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            // Точка идет позже - она десятичный разделитель
            // Убираем все запятые (разделители тысяч)
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (cleaned.includes(',')) {
        // Только запятая - заменяем на точку
        cleaned = cleaned.replace(',', '.');
    }
    
    // Проверяем, что у нас максимум одна точка
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
        // Если несколько точек, то все кроме последней - разделители тысяч
        const parts = cleaned.split('.');
        const decimal = parts.pop();
        cleaned = parts.join('') + '.' + decimal;
    }
    
    return cleaned.trim();
}

/**
 * Проверяет, отменена ли закупка
 * @returns {boolean} - true если закупка отменена
 */
function isProcurementCancelled() {
    // Для 44-ФЗ и других законов
    const status44FZ = safeGetText(".cardMainInfo__state.distancedText");
    if (status44FZ && cancelledStatusConfig.isStatusExcluded(status44FZ)) {
        console.log(`Найден исключенный статус для 44-ФЗ: "${status44FZ}"`);
        return true;
    }
    
    // Для 223-ФЗ - проверяем статус в другом месте
    const status223FZ = safeGetText(".registry-entry__header .registry-entry__header-mid .registry-entry__header-mid__status");
    if (status223FZ && cancelledStatusConfig.isStatusExcluded(status223FZ)) {
        console.log(`Найден исключенный статус для 223-ФЗ: "${status223FZ}"`);
        return true;
    }
    
    // Дополнительные места для поиска статуса
    const statusGeneral = safeGetText(".status, .procurement-status, .order-status");
    if (statusGeneral && cancelledStatusConfig.isStatusExcluded(statusGeneral)) {
        console.log(`Найден исключенный статус: "${statusGeneral}"`);
        return true;
    }
    
    return false;
}

class ProcurementParserInterface {
    constructor() {
        if (new.target === ProcurementParserInterface) {
            throw new TypeError("Cannot construct InterfaceExample instances directly");
        }
        if (this.getFederalLawNumber === undefined) {
            throw new TypeError("Must override getFederalLawNumber");
        }
        if (this.getRegistryNumber === undefined) {
            throw new TypeError("Must override getRegistryNumber");
        }
        if (this.getName === undefined) {
            throw new TypeError("Must override getName");
        }
        if (this.getPublisher === undefined) {
            throw new TypeError("Must override getPublisher");
        }
        if (this.getPrice === undefined) {
            throw new TypeError("Must override getPrice");
        }
        if (this.getTimeZone === undefined) {
            throw new TypeError("Must override getTimeZone");
        }
    }

    parse() {
        try {
            dataAboutProcurement.federalLawNumber = this.getFederalLawNumber();
            dataAboutProcurement.linkOnPlacement = URL;
            dataAboutProcurement.registryNumber = this.getRegistryNumber();
            dataAboutProcurement.name = this.getName();
            dataAboutProcurement.publisher = this.getPublisher();
            dataAboutProcurement.price = this.getPrice();
            dataAboutProcurement.timeZone = this.getTimeZone();
        } catch (error) {
            console.error('Ошибка при парсинге закупки:', error);
        }
    }
};
  
class ProcurementParser223 extends ProcurementParserInterface {

    constructor() {
        super();
    };

    getFederalLawNumber() {
        return "223";
    }

    getRegistryNumber() {
        const registryNumber = safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.search-results.item > div > div > div > div.col-6.pr-0.mr-21px > div.registry-entry__header > div.col.d-flex.registry-entry__header-mid.align-headers-center.w-space-inherit.p-0 > div.registry-entry__header-mid__number");
        return registryNumber.replace("№", "").trim();
    }

    getName() {
        return safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.search-results.item > div > div > div > div.col-6.pr-0.mr-21px > div.registry-entry__body > div:nth-child(1) > div.registry-entry__body-value");
    }

    getPublisher() {
        return safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.search-results.item > div > div > div > div.col-6.pr-0.mr-21px > div.registry-entry__body > div:nth-child(2) > div.registry-entry__body-value > a");
    }

    getPrice() {
        const price = safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.search-results.item > div > div > div > div:nth-child(2) > div.price-block > div.price-block__value");
        return normalizePriceForBigDecimal(price);
    }

    getTimeZone() {
        const fullTimeZone = safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.breadcrumb.rowSpaceBetween.flex-wrap > div.breadcrumb__addition.time-zone > div.time-zone__value > span");
        return extractUTCFromTimeZone(fullTimeZone);
    }
}

let parser;

// Асинхронная инициализация для разных типов закупок
(async function initializeProcurementPage() {
    if (URL.startsWith("https://zakupki.gov.ru/epz/order/notice/notice223")) {
        await insertButton("tabsNav d-flex");
        parser = new ProcurementParser223();
    }

    if (URL.startsWith("https://zakupki.gov.ru/epz/order/notice/ea20")) {
        addCss(BOOTSTRAP_LINK);
        await insertButton("tabsNav d-flex align-items-end");
        fillProcurementWith615And44();
    }
})();

if (parser !== undefined && parser !== null) {
    addCss(BOOTSTRAP_LINK)
    parser.parse();
}

function addCss(css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) return;
    
    // Проверяем, не загружен ли уже CSS
    if (head.querySelector(`link[href="${css}"]`)) return;
    
    const s = document.createElement('link');
    s.setAttribute('rel', 'stylesheet');
    s.setAttribute('href', css);
    s.setAttribute('integrity', BOOTSTRAP_INTEGRITY);
    s.setAttribute('crossOrigin', 'anonymous');
    head.appendChild(s);
}

async function insertButton(className) {
    // Проверяем, не отменена ли закупка
    if (isProcurementCancelled()) {
        console.log("Закупка отменена, кнопка не будет добавлена");
        return;
    }

    // Проверяем авторизацию пользователя
    const isAuthorized = await isUserAuthorized();
    console.log('🔐 Проверка авторизации для кнопки:', isAuthorized);
    
    if (!isAuthorized) {
        console.log("Пользователь не авторизован, кнопка не будет добавлена");
        
        // Показываем уведомление о необходимости авторизации
        showNotification(
            "🔐 Требуется авторизация", 
            "Для сохранения закупок откройте расширение и войдите в систему", 
            'info'
        );
        
        return;
    }

    const buttonPlace = document.getElementsByClassName(className)[0];
    if (!buttonPlace) return;
    
    if (!buttonPlace.querySelector("input[type=button]")) {
        const buttonToMHelper = document.createElement("input");
        buttonToMHelper.type = "button";
        buttonToMHelper.setAttribute("class", BUTTON_CLASS);
        buttonToMHelper.setAttribute("style", "color: white; background-color:grey; border:2px solid black; padding: 12px 16px; font-size:20px");
        buttonToMHelper.value = BUTTON_NAME;
        buttonToMHelper.onclick = function () {
            chrome.runtime.sendMessage(
                {
                    destination: "procurementSender",
                    data: dataAboutProcurement
                },
                function (response) {
                    console.log('📬 Получен ответ от background.js:', response);
                    
                    if (response && response.result === true) {
                        // Извлекаем номер закупки из ответа сервера
                        let procurementNumber = "неизвестный";
                        
                        if (response.data && typeof response.data === 'object' && response.data.data) {
                            // Если data это объект с полем data
                            procurementNumber = response.data.data;
                        } else if (response.data && typeof response.data === 'string') {
                            // Если data это прямо строка
                            procurementNumber = response.data;
                        } else if (response.data && response.data.procurementNumber) {
                            // Альтернативные поля
                            procurementNumber = response.data.procurementNumber;
                        } else if (response.data && response.data.number) {
                            procurementNumber = response.data.number;
                        }
                        
                        // Показываем уведомление с ссылкой на поиск
                        showSuccessNotificationWithLink(procurementNumber);
                    } else {
                        const errorMessage = response?.error || response?.message || "Неизвестная ошибка";
                        console.error('❌ Ошибка при сохранении закупки:', response);
                        showNotification(`❌ Ошибка при сохранении закупки`, errorMessage, 'error');
                    }
                })
        };
        buttonPlace.appendChild(buttonToMHelper);
    }
}

function fillProcurementWith615And44() {
    // Получаем номер федерального закона
    const lawNumberElement = document.body.getElementsByClassName("cardMainInfo__title d-flex text-truncate")[0];
    if (lawNumberElement) {
        dataAboutProcurement.federalLawNumber = lawNumberElement.innerText.split("\n")[0];
    } else {
        dataAboutProcurement.federalLawNumber = "Не найдено";
    }
    
    // Получаем реестровый номер закупки для 44-ФЗ
    const registryNumberElement = document.querySelector("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.cardMainInfo.row > div.sectionMainInfo.borderRight.col-6 > div.sectionMainInfo__header > div.cardMainInfo__status > span.cardMainInfo__purchaseLink.distancedText > a");
    if (registryNumberElement) {
        const registryNumberText = registryNumberElement.innerText.trim();
        // Убираем пробелы и символ №
        dataAboutProcurement.registryNumber = registryNumberText.replace(/[№\s]/g, '');
    } else {
        dataAboutProcurement.registryNumber = "Не найдено";
    }
    
    // Получаем название закупки для 44-ФЗ
    const nameElement = document.querySelector("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.cardMainInfo.row > div.sectionMainInfo.borderRight.col-6 > div.sectionMainInfo__body > div:nth-child(1) > span.cardMainInfo__content");
    if (nameElement) {
        dataAboutProcurement.name = nameElement.innerText.trim();
    } else {
        dataAboutProcurement.name = "Не найдено";
    }
    
    // Получаем организатора закупки для 44-ФЗ
    const publisherElement = document.querySelector("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.cardMainInfo.row > div.sectionMainInfo.borderRight.col-6 > div.sectionMainInfo__body > div:nth-child(2) > span.cardMainInfo__content > a");
    if (publisherElement) {
        dataAboutProcurement.publisher = publisherElement.innerText.trim();
    } else {
        dataAboutProcurement.publisher = "Не найдено";
    }
    
    // Получаем цену закупки для 44-ФЗ
    const priceElement = document.querySelector("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.cardMainInfo.row > div.sectionMainInfo.borderRight.col-3.colSpaceBetween > div.price > span.cardMainInfo__content.cost");
    if (priceElement) {
        const priceText = priceElement.innerText.trim();
        dataAboutProcurement.price = normalizePriceForBigDecimal(priceText);
    } else {
        dataAboutProcurement.price = "";
    }
    
    // Получаем временную зону для 44-ФЗ
    const timeZoneElement = document.querySelector("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.breadcrumb.rowSpaceBetween.flex-wrap > div.breadcrumb__addition.time-zone > div.time-zone__value > span");
    if (timeZoneElement) {
        const fullTimeZone = timeZoneElement.innerText.trim();
        dataAboutProcurement.timeZone = extractUTCFromTimeZone(fullTimeZone);
    } else {
        dataAboutProcurement.timeZone = "Не найдено";
    }
    
    dataAboutProcurement.linkOnPlacement = URL;
}





