<template>
    <div class="card mb-2 bg-dark text-white border-secondary" style="height: 300px">
        <div class="card-header h4 border-secondary">
            Positions ({{ positions.length }})
        </div>
        <div class="table-responsive table-bordered table-striped table-dark" style="overflow-x: hidden">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col" class="text-white text-center">Account</th>
                        <th scope="col" class="text-white text-center">Ticker</th>
                        <th scope="col" class="text-white text-center">Side</th>
                        <th scope="col" class="text-white text-center">Size</th>
                        <th scope="col" class="text-white text-center">Entry Price</th>
                        <th scope="col" class="text-white text-center">Mark Price</th>
                        <th scope="col" class="text-white text-center">uPNL</th>
                        <th scope="col" class="text-white text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(pos, index) in positions">
                        <th scope="row" class="text-white text-center align-middle">{{ pos.account }}</th>
                        <td class="text-white text-center align-middle">{{ pos.ticker }}</td>
                        <td class="text-white text-center align-middle">{{ pos.side }}</td>
                        <td class="text-white text-center align-middle">{{ formatNumber(pos.size) }}</td>
                        <td class="text-white text-center align-middle">{{ formatNumber(pos.entryPrice, pos.ticker) }}</td>
                        <td class="text-white text-center align-middle">{{ formatNumber(pos.markPrice, pos.ticker) }}</td>
                        <td class="text-center align-middle" :class="pos.upnl > 0 ? 'text-success' : 'text-danger'">{{ formatNumber(pos.upnl) }}</td>
                        <td class="text-center align-middle">
                            <button type="button" class="btn btn-danger" @click="$emit('close-position', index)">Close</button>
                            &nbsp;
                            <button type="button" class="btn btn-info" @click="$emit('select-symbol', pos.ticker)">Select</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
var formatter = new Intl.NumberFormat("en-US", {
    style:"currency",
    currency: "USD",
    maximumFractionDigits: 7
});

export default {
    props: {
        positions: {type: Array, required: true},
        pricePrecisions: {type: Object, required: true}
    },
    methods: {
        formatNumber(number, ticker) {
            number = parseFloat(number);
            return formatter.format(number.toFixed(ticker ? this.pricePrecisions[ticker] : 2));
        }
    }
}
</script>