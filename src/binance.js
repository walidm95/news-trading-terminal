import HmacSHA256 from "crypto-js/hmac-sha256";
import { nanoid } from "nanoid";

function executeSignedRequest(apiKey, secretKey, method, path, data) {
  let timestamp = Date.now();
  let query = `timestamp=${timestamp}`;
  if (data) {
    query += `&${data}`;
  }
  let signature = HmacSHA256(query, secretKey).toString();
  let url = `https://fapi.binance.com${path}?${query}&signature=${signature}`;
  let headers = {
    "X-MBX-APIKEY": apiKey,
  };
  return fetch(url, { method: method, headers: headers });
}

function getUserDataStreamListenKey(apiKey, secretKey) {
  return executeSignedRequest(apiKey, secretKey, "POST", "/fapi/v1/listenKey");
}

function keepAliveUserDataStream(apiKey, secretKey, listenKey) {
  return executeSignedRequest(apiKey, secretKey, "PUT", "/fapi/v1/listenKey", `listenKey=${listenKey}`);
}

function getNotionalAndLeverageBrackets(apiKey, secretKey) {
  return executeSignedRequest(apiKey, secretKey, "GET", "/fapi/v1/leverageBracket");
}

function getAccount(apiKey, secretKey) {
  return executeSignedRequest(apiKey, secretKey, "GET", "/fapi/v2/account");
}

function getOrders(apiKey, secretKey, symbol = null) {
  return executeSignedRequest(apiKey, secretKey, "GET", "/fapi/v1/openOrders", symbol ? `symbol=${symbol}` : "");
}

function executeMarketOrder(apiKey, secretKey, symbol, side, quantity) {
  let params = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&newClientOrderId=ntt_${nanoid()}`;
  return executeOrder(apiKey, secretKey, params);
}

function executeLimitOrder(apiKey, secretKey, symbol, side, quantity, price, reduceOnly) {
  let params = `symbol=${symbol}&side=${side}&type=LIMIT&quantity=${quantity}&price=${price}&timeInForce=GTC&reduceOnly=${reduceOnly}&newClientOrderId=ntt_${nanoid()}`;
  return executeOrder(apiKey, secretKey, params);
}

function executeTakeProfitOrder(apiKey, secretKey, symbol, side, quantity, takeProfitPrice) {
  let params = `symbol=${symbol}&side=${side}&type=TAKE_PROFIT_MARKET&quantity=${quantity}&stopPrice=${takeProfitPrice}&reduceOnly=true&newClientOrderId=ntt_${nanoid()}`;
  return executeOrder(apiKey, secretKey, params);
}

function executeStopLossOrder(apiKey, secretKey, symbol, side, quantity, stopPrice) {
  let params = `symbol=${symbol}&side=${side}&type=STOP_MARKET&quantity=${quantity}&stopPrice=${stopPrice}&reduceOnly=true&newClientOrderId=ntt_${nanoid()}`;
  return executeOrder(apiKey, secretKey, params);
}

function executeCloseMarketOrder(apiKey, secretKey, symbol, side, quantity) {
  let params = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&reduceOnly=true`;
  return executeOrder(apiKey, secretKey, params);
}

function executeMultipleOrders(apiKey, secretKey, orders) {
  //TODO: make batches of 5 orders
  if (orders.length > 5) throw new Error("Maximum of 5 orders per request");
  if (orders.length < 1) throw new Error("Minimum of 1 order per request");

  // Add clientOrderId to orders
  for (let order of orders) {
    order.newClientOrderId = `ntt_${nanoid()}`;
  }

  var batchOrders = JSON.stringify(orders);
  var params = `batchOrders=${encodeURIComponent(batchOrders)}`;
  return executeSignedRequest(apiKey, secretKey, "POST", "/fapi/v1/batchOrders", params);
}

function cancelMultipleOrders(apiKey, secretKey, symbol, orderIdList, useClientOrderIds = false) {
  let params;
  if (useClientOrderIds) {
    const orderIdsString = JSON.stringify(orderIdList).replace(/ /g, "");
    const encodedOrderIdsString = encodeURIComponent(orderIdsString);
    params = `symbol=${symbol}&origClientOrderIdList=${encodedOrderIdsString}`;
  } else {
    const orderIdsString = orderIdList.join(",");
    params = `symbol=${symbol}&orderIdList=[${orderIdsString}]`;
  }

  return executeSignedRequest(apiKey, secretKey, "DELETE", "/fapi/v1/batchOrders", params);
}

function executeOrder(apiKey, secretKey, params) {
  return executeSignedRequest(apiKey, secretKey, "POST", "/fapi/v1/order", params);
}

export default {
  getAccount,
  executeMarketOrder,
  executeLimitOrder,
  executeStopLossOrder,
  executeTakeProfitOrder,
  executeCloseMarketOrder,
  executeMultipleOrders,
  cancelMultipleOrders,
  getUserDataStreamListenKey,
  keepAliveUserDataStream,
  getOrders,
  getNotionalAndLeverageBrackets,
};
