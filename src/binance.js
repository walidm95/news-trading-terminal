import HmacSHA256 from 'crypto-js/hmac-sha256';

function executeSignedRequest(apiKey, secretKey, method, path, data) {
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

function getAccount(apiKey, secretKey) {
    return executeSignedRequest(apiKey, secretKey, 'GET', '/fapi/v2/account');
}

function getOrders(apiKey, secretKey, symbol) {
    return executeSignedRequest(apiKey, secretKey, 'GET', '/fapi/v1/openOrders', `symbol=${symbol}`);
}

function executeMarketOrder(apiKey, secretKey, symbol, side, quantity) {
    let params = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}`;
    return executeOrder(apiKey, secretKey, params);
}

function executeLimitOrder(apiKey, secretKey, symbol, side, quantity, price) {
    let params = `symbol=${symbol}&side=${side}&type=LIMIT&quantity=${quantity}&price=${price}`;
    return executeOrder(apiKey, secretKey, params);
}

function executeTakeProfitOrder(apiKey, secretKey, symbol, side, quantity, takeProfitPrice) {
    let params = `symbol=${symbol}&side=${side}&type=TAKE_PROFIT_MARKET&quantity=${quantity}&stopPrice=${takeProfitPrice}&reduceOnly=true`;
    return executeOrder(apiKey, secretKey, params);
}

function executeStopLossOrder(apiKey, secretKey, symbol, side, quantity, stopPrice) {
    let params = `symbol=${symbol}&side=${side}&type=STOP_MARKET&quantity=${quantity}&stopPrice=${stopPrice}&reduceOnly=true`;
    return executeOrder(apiKey, secretKey, params);
}

function executeCloseMarketOrder(apiKey, secretKey, symbol, side, quantity) {
    let params = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&reduceOnly=true`;
    return executeOrder(apiKey, secretKey, params);
}

function executeMultipleOrders(apiKey, secretKey, orders) {
    // TODO: fix if necessary. For now sending one order at a time
    var batchOrders = JSON.stringify(orders);
    return executeSignedRequest(apiKey, secretKey, 'POST', '/fapi/v1/batchOrders', batchOrders)
}

function cancelMultipleOrders(apiKey, secretKey, symbol, orderIdList) {
    let params = `symbol=${symbol}&orderIdList=[${orderIdList}]`;
    return executeSignedRequest(apiKey, secretKey, 'DELETE', '/fapi/v1/batchOrders', params)
}

function executeOrder(apiKey, secretKey, params) {
    return executeSignedRequest(apiKey, secretKey, 'POST', '/fapi/v1/order', params);
}

export default {
    getAccount,
    executeMarketOrder,
    executeLimitOrder,
    executeStopLossOrder,
    executeTakeProfitOrder,
    executeCloseMarketOrder,
    cancelMultipleOrders,
    getOrders
}