<script setup>
import Main from "./components/Main.vue";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import { Amplify, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";

import { getVersion } from "@tauri-apps/api/app";

Amplify.configure(awsconfig);
</script>

<script>
export default {
  data() {
    return {
      version: null,
      cognitoIdToken: null,
      refreshSessionInterval: null,
    };
  },
  methods: {
    async getAppVersion() {
      this.version = await getVersion();
    },
    startRefreshSessionInterval(user, maxRetries = 3) {
      const refreshSessionWithRetry = (user, retries) => {
        user.refreshSession(user.signInUserSession.refreshToken, (err, session) => {
          if (err) {
            console.log(`error in token refresh: ${err}`);

            if (retries > 0) {
              console.log(`Retrying token refresh... (remaining retries: ${retries})`);
              refreshSessionWithRetry(user, retries - 1);
            } else {
              alert("Failed to refresh token after multiple attempts. Please try again later.");
              clearInterval(this.refreshSessionInterval);
            }
          } else {
            console.log("cognito id token refreshed");
            this.cognitoIdToken = session.idToken;
          }
        });
      };

      this.refreshSessionInterval = setInterval(() => {
        refreshSessionWithRetry(user, maxRetries);
      }, 55 * 60 * 1000);
    },
    getCognitoIdToken(user) {
      const currentSession = user.signInUserSession;
      this.cognitoIdToken = currentSession.idToken;

      // Token expires every hour, so refresh it every 55min
      // this.startRefreshSessionInterval(user); NOTE: changed the id expiry to 24h on aws cognito instead, because refreshing the token was causing a mess for some people

      return this.cognitoIdToken;
    },
  },
  mounted() {
    this.getAppVersion();
  },
};
</script>

<template>
  <v-app>
    <authenticator :hide-sign-up="true" :login-mechanisms="['email']">
      <template v-slot:header>
        <div style="padding: var(--amplify-space-large); text-align: center">
          <h1>News Trading Terminal</h1>
        </div>
      </template>
      <template v-slot="{ user, signOut }">
        <Main @open-trading-settings="openTradingSettings" :cognito-id-token="getCognitoIdToken(user)"> </Main>
        <button @click="signOut">Sign Out</button>
        <div style="text-align: center">
          <small class="text-grey">{{ version }}</small>
        </div>
      </template>
    </authenticator>
  </v-app>
</template>
