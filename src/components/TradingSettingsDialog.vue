<script>
export default {
  data() {
    return {
      dialog: false,
      newAccount: "",
      newApiKey: "",
      newApiSecret: "",
      playTraderNotification: null,
      playHeadlineNotification: null,
      nbrOfSplitOrders: null,
      showDebugLogs: null,
      nbrOfOrderRules: [(v) => !!v || "Required", (v) => v >= 0 || "Must be positive", (v) => v < 10 || "Must be less than 10"],
    };
  },
  props: {
    apiKeys: { type: Array, required: true },
    generalSettings: { type: Object, required: true },
  },
  methods: {
    close() {
      // Validate data
      if (this.nbrOfSplitOrders < 0 || this.nbrOfSplitOrders > 9) {
        return;
      }

      this.dialog = false;

      // Update general settings
      this.$emit("update-general-settings", {
        playHeadlineNotification: this.playHeadlineNotification,
        playTraderNotification: this.playTraderNotification,
        nbrOfSplitOrders: this.nbrOfSplitOrders,
        showDebugLogs: this.showDebugLogs,
      });
    },
    onAddApiKey() {
      this.$emit("add-api-key", {
        account: this.newAccount,
        key: this.newApiKey,
        secret: this.newApiSecret,
        enabled: true,
      });
      this.newAccount = "";
      this.newApiKey = "";
      this.newApiSecret = "";
    },
    onToggleApiKey(index) {
      this.$emit("toggle-api-key", index);
    },
  },
  watch: {
    generalSettings: function (newSettings) {
      this.playHeadlineNotification = newSettings.playHeadlineNotification;
      this.playTraderNotification = newSettings.playTraderNotification;
      this.nbrOfSplitOrders = newSettings.nbrOfSplitOrders;
      this.showDebugLogs = newSettings.showDebugLogs;
    },
  },
};
</script>

<template>
  <v-row justify="center">
    <v-dialog v-model="dialog" persistent width="1024">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" color="grey" variant="text" icon="mdi-cog-outline" />
      </template>
      <v-card>
        <v-card-title>Settings</v-card-title>
        <v-card>
          <v-card-subtitle>General</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col>
                <v-checkbox density="compact" label="Trader Notification Sound" v-model="playTraderNotification"></v-checkbox>
              </v-col>
              <v-col>
                <v-checkbox density="compact" label="Headline Notification Sound" v-model="playHeadlineNotification"></v-checkbox>
              </v-col>
              <v-col>
                <v-text-field
                  density="compact"
                  hide-details="auto"
                  type="number"
                  min="0"
                  max="9"
                  :rules="nbrOfOrderRules"
                  label="Number of split orders"
                  v-model="nbrOfSplitOrders"
                ></v-text-field>
              </v-col>
              <v-col>
                <v-checkbox density="compact" label="Show Debug Logs" v-model="showDebugLogs"></v-checkbox>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-subtitle>API Keys</v-card-subtitle>
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center text-subtitle-2 pr-0">Name</th>
                <th class="text-center text-subtitle-2 pr-0" style="width: 30%">Key</th>
                <th class="text-center text-subtitle-2 pr-0">Secret</th>
                <th class="text-center text-subtitle-2 pr-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(api, index) in apiKeys" class="text-center">
                <td><v-checkbox hide-details="true" :model-value="api.enabled" :label="api.account" @click="onToggleApiKey(index)"></v-checkbox></td>
                <td>{{ api.key.slice(0, 10) + " ... " + api.key.slice(-10) }}</td>
                <td>***</td>
                <td class="pt-1 pb-1">
                  <v-btn rounded="lg" variant="tonal" color="red" @click="$emit('delete-api-key', index)"> Delete </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions v-if="apiKeys.length < 6">
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Account" v-model="newAccount"></v-text-field>
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Key" v-model="newApiKey"></v-text-field>
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Secret" v-model="newApiSecret"></v-text-field>
            <v-btn rounded="lg" variant="outlined" color="white" @click="onAddApiKey">Add</v-btn>
          </v-card-actions>
        </v-card>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn rounded="lg" variant="tonal" color="white" @click="close()"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
