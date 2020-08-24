let currencyFrom = $("#currency-from");
let currencyTo = $("#currency-to");
let amount = $("#amount");
let calculatedResults = $("#results");
let calculateButton = $("#calculate");

$(document).ready(function () {
    $.get("http://localhost:3100/get-currencies", function (data) {
        data["currenciesFrom"].forEach(function (currencyConvertFrom) {
            currencyFrom.append(new Option(currencyConvertFrom, currencyConvertFrom));
        });
        currencyFrom.val("EUR");
        data["currenciesTo"].forEach(function (currencyConvertTo) {
            currencyTo.append(new Option(currencyConvertTo, currencyConvertTo));
        });
        currencyTo.val("GBP")
    });
});

$("#currency-form").on("submit", function (event) {
    calculateResults();
    event.preventDefault();
});

function calculateResults () {
    removeErrors();

    let valid = true;
    if (amount.val() === "") {
        amount.addClass("error-field");
        $(".error-amount").show();
        valid = false;
    }

    if (currencyFrom.val() === currencyTo.val()) {
        currencyFrom.addClass("error-field");
        currencyTo.addClass("error-field");
        $(".error").show();
        valid = false;
    }

    if (valid) {
        disableForm();
        $.post( "http://localhost:3100/calculate", { "currency-from": currencyFrom.val(), "currency-to": currencyTo.val(), "amount": amount.val() })
            .done(function (data) {
                $('#calculated-from').html(parseInt(amount.val()).toFixed(2) + " " + currencyFrom.val());
                $('#calculated-result').html(data["result"].toFixed(2) + " " + currencyTo.val());
                calculatedResults.show();
            });
    }
}

let removeErrors = function () {
    $(".error-amount").hide();
    $(".error").hide();
    amount.removeClass("error-field");
    currencyFrom.removeClass("error-field");
    currencyTo.removeClass("error-field");
};

let disableForm = function () {
    calculateButton.prop("disabled", true);
    currencyFrom.prop("disabled", true);
    currencyTo.prop("disabled", true);
    amount.prop("disabled", true);
};

// Restart Calculations
$("#restart-button").click(function () {
    amount.prop("disabled", false);
    amount.val('');
    currencyFrom.prop("disabled", false);
    currencyTo.prop("disabled", false);
    calculateButton.prop("disabled", false);
    calculatedResults.hide();
});