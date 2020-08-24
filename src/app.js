const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {startDatabase} = require('./database/mongo');
const {insertCurrency, getCurrencies} = require('./database/currencies');
const app = express();

// enabling CORS for all requests
app.use(cors());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/get-currencies", async (req, res) => {
    const currencies = await getCurrencies();
    let currenciesToResponse = [];

    for (let currency of currencies) {
        if (!currenciesToResponse.includes(currency.currencyTo)) {
            currenciesToResponse.push(currency.currencyTo);
        }
        if (!currenciesToResponse.includes(currency.currencyFrom)) {
            currenciesToResponse.push(currency.currencyFrom);
        }
    }
    res.send({
        "currenciesFrom": currenciesToResponse,
        "currenciesTo": currenciesToResponse
    });
});

app.post("/calculate", async (req, res) => {
    const currencies = await getCurrencies();
    let sum;

    if (req.body["currency-from"] === "EU") {
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

    res.send({result: sum});
});

// start the in-memory MongoDB instance
startDatabase().then(async () => {
    const https = require('https');

    https.get('https://www.lb.lt/webservices/FxRates/FxRates.asmx/getFxRates?tp=EU&dt=2020-08-24', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Getting result.
        resp.on('end', () => {
            let parseString = require('xml2js').parseString;
            parseString(data, async function (err, result) {
                for (let rate of result["FxRates"]["FxRate"]) {
                    let currencyTo = rate["CcyAmt"][1]["Ccy"][0];
                    let currencyRate = rate["CcyAmt"][1]["Amt"][0];
                    await insertCurrency({"currencyFrom": "EU", "currencyTo": currencyTo, "rate": currencyRate});
                }
            });
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

    // start the server
    app.listen(3100, async () => {
        console.log('listening on port 3100');
    });
});