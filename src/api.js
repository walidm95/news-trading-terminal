// News Feed
function getNewsHeadlines() {
    return [
        {
        'time': '15:02:43',
        'title': 'Bitcoin is going to the moon'
        },
        {
        'time': '15:02:42',
        'title': 'ETH'
        },
        {
        'time': '15:02:41',
        'title': 'This is a headline3'
        },
        {
        'time': '15:02:40',
        'title': 'This is a headline4'
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
        'Bitcoin Cash': 'BCH'
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