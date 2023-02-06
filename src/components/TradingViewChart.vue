<template>
    <div class="card mb-2  bg-dark text-white border-secondary">
        <div class="card-header h3 border-secondary">
            {{ ticker.replace("BINANCE:", "") }}
        </div>
        <Chart
            :options="{
                autosize: true,
                interval: '1',
                symbol: ticker,
                timezone: getLocaleTimezone(),
                theme: 'dark',
                hide_top_toolbar: true,
                hide_legend: true
            }"
            style="height: 300px"
        />
    </div>
</template>
  
<script>
//Note: for better speed, I would need to cache all symbols data and use https://github.com/tradingview/lightweight-charts
import { Chart } from 'vue-tradingview-widgets';

export default {
    props: {
        ticker: {type: String, required: true}
    },
    components: { Chart },
    methods: {
        getLocaleTimezone() {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    }
}
</script>