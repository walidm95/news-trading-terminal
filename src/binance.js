export class BinancePublic {
    constructor() {}

    apiUrl = 'https://fapi.binance.com'

    async getExchangeInfo() {
        try {
            let response = await fetch(`${this.apiUrl}/fapi/v1/exchangeInfo`)
            let exchangeInfo = await response.json()
            return exchangeInfo
        } catch (error) {
            console.error(error)
        }
    }

    connectMarkPriceStreamWS(callback) {
        let ws = new WebSocket('wss://fstream.binance.com/ws/!markPrice@arr@1s')
        ws.onmessage = (event) => {
            callback(event.data)
        }
    }
}

export class BinancePrivate {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey
        this.apiSecret = apiSecret
    }

    apiUrl = 'https://fapi.binance.com'

    async getAccount() {
        try {
            let response = await fetch(`${this.apiUrl}/fapi/v1/account`, {
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': this.apiKey
                }
            })
            let account = await response.json()
        } catch (error) {
            console.error(error)
        }
    }
}