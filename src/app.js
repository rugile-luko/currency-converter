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
    let currenciesToResponse = ["EUR"]; // TODO: rename list

    for (let currency of currencies) {
        if (!currenciesToResponse.includes(currency.currencyTo)) {
            currenciesToResponse.push(currency.currencyTo);
        }
    }
    res.send({
        "currenciesFrom": currenciesToResponse,
        "currenciesTo": currenciesToResponse
    });
});

app.get("/get-activities", async (req, res) => {
    const activities = await getActivities();
    res.send(activities);
});

app.post("/calculate", async (req, res) => {
    const currencies = await getCurrencies();
    let sum;

    if (req.body["currency-from"] === "EUR") {
        for (let currency of currencies) {
            if (req.body["currency-from"] === currency.currencyFrom && req.body["currency-to"] === currency.currencyTo) {
                sum = req.body["amount"] * currency.rate;
            }
        }
    } else {
        let from_rate;
        let to_rate;
        for (let currency of currencies) {
            if (req.body["currency-from"] === currency.currencyTo) {
                from_rate = currency.rate;
            }
        }
        for (let currency of currencies) {
            if (req.body["currency-to"] === currency.currencyTo) {
                to_rate = currency.rate;
            }
        }
        sum = ((1 / from_rate) * to_rate) * req.body["amount"];
    }
    await insertActivity({
        "datetime": new Date().toISOString(),
        "currency-from": req.body["currency-from"],
        "currency-to": req.body["currency-to"],
        "amount": req.body["amount"],
        "result": sum
    });
    res.send({result: sum});
});

module.exports = app;