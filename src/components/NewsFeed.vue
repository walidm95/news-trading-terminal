<script setup>
import NewsItem from './NewsItem.vue'
</script>

<template>
    <div class="card">
        <div class="card-header h2">
            News Feed
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">
                <NewsItem 
                    headline="This is a headline1"
                    time="15:02:43"
                    symbol="BTCUSDT"
                />
            </li>
            <li class="list-group-item">
                <NewsItem 
                    headline="This is a headline2"
                    time="15:02:42"
                    symbol="BTCUSDT"
                />
            </li>
            <li class="list-group-item">
                <NewsItem 
                    headline="This is a headline3"
                    time="15:02:41"
                    symbol="BTCUSDT"
                />
            </li>
        </ul>
    </div>
</template>