import { createApp } from "vue";
import "./styles.css";
import App from "./App.vue";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { md3 } from "vuetify/blueprints";

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  blueprint: md3,
  theme: {
    defaultTheme: "dark",
  },
});

createApp(App).use(vuetify).mount("#app");
