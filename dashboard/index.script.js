let currencyFrom = $("#currency-from");
let currencyTo = $("#currency-to");
let amount = $("#amount");
let calculatedResults = $("#calculated-results");
let calculateButton = $("#calculate");

$(document).ready(function () {
    $.get("http://localhost:3100/get-currencies", function (data) {
        data["currenciesFrom"].forEach(function (currencyConvertFrom) {
            let newOption = currencyFrom.append(new Option(currencyConvertFrom, currencyConvertFrom));
            // comment here
            if (newOption.val("EUR")) {
                newOption.attr("selected", true)
            }
        });
        data["currenciesTo"].forEach(function (currencyConvertTo) {
            let newOption = currencyTo.append(new Option(currencyConvertTo, currencyConvertTo));
            // comment here
            if (newOption.val("GBP")) {
                newOption.attr("selected", true)
            }
        })
    });
});

// Listen for submit
$("#currency-form").on("submit", function (event) {
    calculateResults();
    event.preventDefault();
});

// Calculate results
function calculateResults () {
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
        // TODO: move all this to removeErrorsAndDisable method
        $(".error-amount").hide();
        $(".error").hide();
        amount.removeClass("error-field");
        currencyFrom.removeClass("error-field");
        currencyTo.removeClass("error-field");

        calculateButton.prop("disabled", true);
        currencyFrom.prop("disabled", true);
        currencyTo.prop("disabled", true);
        amount.prop("disabled", true);

        $.post( "http://localhost:3100/calculate", { "currency-from": currencyFrom.val(), "currency-to": currencyTo.val(), "amount": amount.val() })
            .done(function (data) {
                let innerText = "Calculated value: " + parseInt(amount.val()).toFixed(2) + " " + currencyFrom.val()
                    + " = " + data["result"].toFixed(2) + " " + currencyTo.val();
                $("#result").html("<p>" + innerText + "</p>");
                calculatedResults.show();
            });
    }
}

// Restart Calculations
$("#restart-button").click(function () {
    amount.prop("disabled", false);
    amount.val('');
    currencyFrom.prop("disabled", false);
    currencyTo.prop("disabled", false);
    calculateButton.prop("disabled", false);
    calculatedResults.hide();
});