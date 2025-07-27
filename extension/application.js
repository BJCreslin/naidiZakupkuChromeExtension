const URL = document.documentURI;
const BUTTON_NAME = "Запомнить";
const BUTTON_CLASS = "btn btn-primary";
const BOOTSTRAP_LINK = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css";
const BOOTSTRAP_INTEGRITY = "sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We"

const dataAboutProcurement = {
    federalLawNumber: "",
    linkOnPlacement: "",
    name: "",
    publisher: "",
    price: "",
    timeZone: "",
}

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

    keepOnlyNumbersAndDelimiters(input) {
        if (!input || typeof input !== 'string') return '';
        const regex = /[^0-9.,\s]/g;
        return input.replace(regex, '');
    };
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
        return this.keepOnlyNumbersAndDelimiters(price).replace(",", ".").trim();
    }

    getTimeZone() {
        return safeGetText("body > div.cardWrapper.outerWrapper > div > div.cardHeaderBlock > div:nth-child(3) > div.breadcrumb.rowSpaceBetween.flex-wrap > div.breadcrumb__addition.time-zone > div.time-zone__value > span");
    }
}

let parser;

if (URL.startsWith("https://zakupki.gov.ru/epz/order/notice/notice223")) {
    insertButton("tabsNav d-flex");
    parser = new ProcurementParser223();
}

if (URL.startsWith("https://zakupki.gov.ru/epz/order/notice/ea20")) {
    addCss(BOOTSTRAP_LINK)
    insertButton("tabsNav d-flex align-items-end");
    fillProcurementWith615And44();
}

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

function insertButton(className) {
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
                    console.log(response);
                })
        };
        buttonPlace.appendChild(buttonToMHelper);
    }
}

function fillProcurementWith615And44() {
    const lawNumberElement = document.body.getElementsByClassName("cardMainInfo__title d-flex text-truncate")[0];
    if (lawNumberElement) {
        dataAboutProcurement.federalLawNumber = lawNumberElement.innerText.split("\n")[0];
    } else {
        dataAboutProcurement.federalLawNumber = "Не найдено";
    }
    dataAboutProcurement.linkOnPlacement = URL;
}





