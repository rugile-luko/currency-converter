const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const {getCurrencies} = require('./database/currencies');
const {insertActivity, getActivities} = require('./database/activities');
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/get-currencies", async (req, res) => {
    const currencies = await getCurrencies();
    let currenciesResponse = ["EUR"];

    for (let currency of currencies) {
        if (!currenciesResponse.includes(currency.currencyTo)) {
            currenciesResponse.push(currency.currencyTo);
        }
    }
    res.send({
        "currenciesFrom": currenciesResponse,
        "currenciesTo": currenciesResponse
    });
});

app.get("/get-activities", async (req, res) => {
    const activities = await getActivities();
    res.send(activities);
});

app.post("/calculate", async (req, res) => {
    const currencies = await getCurrencies();
    const currencyFrom = req.body["currency-from"];
    const currencyTo = req.body["currency-to"];
    const amount = req.body["amount"];
    let sum;

    if (currencyFrom === "EUR") {
        for (let currency of currencies) {
            if (currencyFrom === currency.currencyFrom && currencyTo === currency.currencyTo) {
                sum = amount * currency.rate;
            }
        }
    } else {
        let from_rate;
        let to_rate;
        for (let currency of currencies) {
            if (currencyFrom === currency.currencyTo) {
                from_rate = currency.rate;
            }
        }
        for (let currency of currencies) {
            if (currencyTo === currency.currencyTo) {
                to_rate = currency.rate;
            }
        }
        sum = ((1 / from_rate) * to_rate) * amount;
    }
    await insertActivity({
        "datetime": new Date().toISOString(),
        "currency-from": currencyFrom,
        "currency-to": currencyTo,
        "amount": amount,
        "result": sum
    });
    res.send({result: sum});
});

module.exports = app;