<template>
    <div class="card mb-2 bg-dark text-white border-secondary" style="height: 300px">
        <div class="card-header h3 border-secondary">
            Positions
        </div>
        <div class="table-responsive table-bordered table-striped table-dark" style="overflow-x: hidden">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col" class="text-white text-center">Account</th>
                        <th scope="col" class="text-white text-center">Symbol</th>
                        <th scope="col" class="text-white text-center">Side</th>
                        <th scope="col" class="text-white text-center">Size</th>
                        <th scope="col" class="text-white text-center">Entry</th>
                        <th scope="col" class="text-white text-center">uPNL</th>
                        <th scope="col" class="text-white text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(pos, index) in positions">
                        <th scope="row" class="text-white text-center align-middle">{{ pos.account }}</th>
                        <td class="text-white text-center align-middle">{{ pos.symbol }}</td>
                        <td class="text-white text-center align-middle">{{ pos.side }}</td>
                        <td class="text-white text-center align-middle">{{ formatNumber(pos.size) }}</td>
                        <td class="text-white text-center align-middle">{{ formatNumber(pos.entry) }}</td>
                        <td class="text-center align-middle" :class="pos.uPnl > 0 ? 'text-success' : 'text-danger'">{{ formatNumber(pos.uPnl) }}</td>
                        <td class="text-center align-middle">
                            <button type="button" class="btn btn-danger" @click="$emit('close-position', index)">Close</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  roundingIncrement: 5,
});

export default {
    props: {
        positions: {type: Array, required: true}
    },
    methods: {
        formatNumber(number) {
            return formatter.format(number);
        }
    }
}
</script>