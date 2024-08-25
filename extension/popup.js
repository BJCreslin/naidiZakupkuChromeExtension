const inputField = document.getElementById("input_tg_number");
const buttonTgNumber = document.getElementById("button_tg_number");
const NUMBER_REGEX = /^[0-9]+$/;

let connected = false;

chrome.action.onClicked.addListener(function (tab) {
    console.log("Иконка расширения была нажата.");
});

function sendCodeToBackend(createConnection, notCreatedConnection) {
    function handleResponse() {
        createConnection();
    }

    function handleError() {
        notCreatedConnection();
    }

    const sending = chrome.runtime.sendMessage(
        {
            destination: "loginCode",
            data: inputField.value
        });

    sending.then(handleResponse, handleError);
}

inputField.addEventListener("input", function () {
    const value = inputField.value;
    const numberCode = parseInt(value, 10);

    if (NUMBER_REGEX.test(value)) {
        inputField.classList.remove("is-invalid");
        if (!isNaN(numberCode) && numberCode >= 1000 && numberCode <= 1000000) {
            buttonTgNumber.classList.remove("disabled");
            buttonTgNumber.classList.add("enabled", "btn-primary");
        } else {
            buttonTgNumber.classList.remove("enabled", "btn-primary");
            buttonTgNumber.classList.add("disabled");

        }
    } else {
        inputField.classList.add("is-invalid");
    }
});


buttonTgNumber.addEventListener("click", function () {
    const inputTgNumber = document.getElementById("input_tg_number");

    function notCreatedConnection() {
        inputField.classList.add("is-invalid");
        connected = false;
    }

    function createConnection() {
        let numberDocument = document.getElementsByClassName("tg_number")[0];
        numberDocument.style.display = "none";
        connected = true;
    }

    sendCodeToBackend(createConnection, notCreatedConnection);
});