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

// Positions
function getPositions() {
    return [
        {
            account: 'Main',
            symbol: 'BTCUSDT',
            side: 'BUY',
            size: 15000.555,
            entry: 21577.279,
            uPnl: -245.24
        },
        {
            account: 'Scalp',
            symbol: 'BTCUSDT',
            side: 'BUY',
            size: 5000.1111,
            entry: 21577.274,
            uPnl: -97.07
        },
        {
            account: 'Alt Scalp',
            symbol: 'INJUSDT',
            side: 'SELL',
            size: 9500.00,
            entry: 1.5,
            uPnl: 385.57
        }
    ]
}

export default { getNewsHeadlines, getEventLogs, getNamesAndTickers, getPositions }