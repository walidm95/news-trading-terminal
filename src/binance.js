const apiUrl = 'https://fapi.binance.com'

export class BinancePublic {
    constructor() {}

    async getExchangeInfo() {
        try {
            let response = await fetch(`${apiUrl}/fapi/v1/exchangeInfo`)
            let exchangeInfo = await response.json()
            return exchangeInfo
        } catch (error) {
            console.error(error)
        }
    }
}

export class BinancePrivate {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey
        this.apiSecret = apiSecret
    }

    async getAccount() {
        try {
            let response = await fetch(`${apiUrl}/fapi/v1/account`, {
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