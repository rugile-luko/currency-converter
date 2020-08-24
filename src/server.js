const http = require('http');
const {startDatabase} = require('./database/mongo');
const {insertCurrency} = require('./database/currencies');

const app = require('./app');
const port = process.env.PORT || 3100;
const server = http.createServer(app);

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

    server.listen(port, async () => {
        console.log('listening on port ' + port);
    });
});

