<script setup>
import Main from "./components/Main.vue";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import { Amplify, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);
</script>

<script>
export default {
  data() {
    return {
      cognitoIdToken: null,
      refreshSessionInterval: null,
    };
  },
  methods: {
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
      this.startRefreshSessionInterval(user);

      return this.cognitoIdToken;
    },
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
        <button class="float-right" @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </v-app>
</template>
