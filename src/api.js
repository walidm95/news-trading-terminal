// News Feed
function getNewsHeadlines() {
    return [
        {
        'datetime': new Date(2023, 1, 5, 15, 2, 43),
        'title': 'Bitcoin is going to the moon'
        },
        {
        'datetime': new Date(2023, 1, 5, 14, 22, 33),
        'title': 'ETH'
        },
        {
        'datetime': new Date(2023, 1, 5, 13, 12, 12),
        'title': 'RTRS - BINANCE IS FULLY COMPLIANT WITH POLISH REGULATORY STANDARDS FOR VIRTUAL ASSET SERVICE PROVIDERS - TWEET'
        }
    ]
}

// Trading
function getNamesAndTickers() {
    return {
        'Bitcoin': 'BTC',
        'Ethereum': 'ETH',
        'Litecoin': 'LTC',
        'Ripple': 'XRP',
        'Bitcoin Cash': 'BCH',
        'Binance': 'BNB',
    }
}

// Event Logs
function getEventLogs() {
    return [
        {
            time: '15:02:43',
            text: 'This is a text'
        },
        {
            time: '15:02:43',
            text: 'This is a text'
        },
        {
            time: '15:02:43',
            text: 'This is a text'
        },
        {
            time: '15:02:43',
            text: 'This is a text'
        }
    ]
}

export default { getNewsHeadlines, getEventLogs, getNamesAndTickers }