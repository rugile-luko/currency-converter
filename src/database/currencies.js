const {getDatabase} = require('./mongo');
const collectionName = 'currencies';

async function insertCurrency(currency) {
    const database = await getDatabase();
    const {insertedId} = await database.collection(collectionName).insertOne(currency);
    return insertedId;
}

async function getCurrencies() {
    const database = await getDatabase();
    return database.collection(collectionName).find({}).toArray();
}

module.exports = {
    insertCurrency,
    getCurrencies,
};