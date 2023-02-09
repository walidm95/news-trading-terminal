import HmacSHA256 from 'crypto-js/hmac-sha256';

function executeBinanceFuturesSignedRequest(apiKey, secretKey, method, path, data) {
    let timestamp = Date.now();
    let query = `timestamp=${timestamp}`;
    if (data) {
        query += `&${data}`;
    }
    let signature = HmacSHA256(query, secretKey).toString();
    let url = `https://fapi.binance.com${path}?${query}&signature=${signature}`;
    let headers = {
        'X-MBX-APIKEY': apiKey
    };
    return fetch(url, {method: method, headers: headers})
}

function getBinanceFuturesAccount(apiKey, secretKey) {
    return executeBinanceFuturesSignedRequest(apiKey, secretKey, 'GET', '/fapi/v2/account');
}

function getOrdersBinanceFutures(apiKey, secretKey, symbol) {
    return executeBinanceFuturesSignedRequest(apiKey, secretKey, 'GET', '/fapi/v1/openOrders', `symbol=${symbol}`);
}

function executeOrderBinanceFutures(apiKey, secretKey, symbol, side, type, quantity, price, timeInForce) {

    let data
    if (type == 'MARKET') {
        data = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}`;
    } else {
        data = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}&price=${price}`;
    }
    if (price) {
        data += `&price=${price}`;
    }
    if (timeInForce) {
        data += `&timeInForce=${timeInForce}`;
    }
    return executeBinanceFuturesSignedRequest(apiKey, secretKey, 'POST', '/fapi/v1/order', data);
}

export default {
    getBinanceFuturesAccount,
    executeOrderBinanceFutures,
    getOrdersBinanceFutures
}