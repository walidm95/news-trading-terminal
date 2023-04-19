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
    };
  },
  methods: {
    getCognitoIdToken(user) {
      const currentSession = user.signInUserSession;
      this.cognitoIdToken = currentSession.idToken;

      // Token expires every hour, so refresh it every 55min
      setInterval(() => {
        user.refreshSession(currentSession.refreshToken, (err, session) => {
          console.log("cognito id token refreshed");
            this.cognitoIdToken = session.idToken;
        });
      }, 55 * 60 * 1000);

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
