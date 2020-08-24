const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {startDatabase} = require('./database/mongo');
const {insertCurrency, getCurrencies} = require('./database/currencies');
const {insertActivity, getActivities} = require('./database/activities');
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/get-currencies", async (req, res) => {
    const currencies = await getCurrencies();
    let currenciesToResponse = ["EUR"];

    for (let currency of currencies) {
        if (!currenciesToResponse.includes(currency.currencyTo)) {
            currenciesToResponse.push(currency.currencyTo);
        }
        // if (!currenciesToResponse.includes(currency.currencyFrom)) {
        //     currenciesToResponse.push(currency.currencyFrom);
        // }
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

// start the in-memory MongoDB instance
startDatabase().then(async () => {
    const https = require('https');

    https.get('https://www.lb.lt/webservices/FxRates/FxRates.asmx/getFxRates?tp=EU&dt=2020-08-24', (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            let parseString = require('xml2js').parseString;
            parseString(data, async function (err, result) {
                // since endpoint does not return "currency to" eur, we manually add it in
                await insertCurrency({"currencyFrom": "EUR", "currencyTo": "EUR", "rate": 1.00});

                for (let rate of result["FxRates"]["FxRate"]) {
                    let currencyTo = rate["CcyAmt"][1]["Ccy"][0];
                    let currencyRate = rate["CcyAmt"][1]["Amt"][0];
                    await insertCurrency({"currencyFrom": "EUR", "currencyTo": currencyTo, "rate": currencyRate});
                }
            });
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

    app.listen(3100, async () => {
        console.log('listening on port 3100');
    });
});