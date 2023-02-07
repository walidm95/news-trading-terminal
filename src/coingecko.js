export class Coingecko {
    constructor() {}

    async getAllCoins() {
        let allCoins = {}
        try {
            let response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1&sparkline=false')
            let coins = await response.json()

            // Get second page
            response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=2&sparkline=false')
            coins = coins.concat(await response.json())

            let excludedIds = ['wormhole', 'binance-peg', 'wrapped', 'bsc', 'binemon']
            
            for (let coin of coins) {
                if(excludedIds.some(excludedId => coin.id.includes(excludedId))) {
                    continue
                }

                allCoins[coin.symbol.toUpperCase()] = coin.name         
            }

            return allCoins

        } catch (error) {
            console.error(error)
        }
    }
}