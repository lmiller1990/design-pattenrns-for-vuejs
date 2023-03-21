<template>
  <RenderlessPassword
    :password="input.password"
    :confirmation="input.confirmation"
    :validator="customValidator"
    v-slot="{ valid }"
  >
    <input v-model="input.password" id="password" />
    <input v-model="input.confirmation" id="confirmation" />
    <button role="submit" :disabled="!valid">Submit</button>
  </RenderlessPassword>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { Validator } from "./renderless-password.js";
import RenderlessPassword from "./RenderlessPassword.vue";

const customValidator: Validator = (payload) => {
  return payload.matching && payload.password.length % 2 === 0
};

const input = reactive({
  password: "",
  confirmation: "",
});

</script>

<style>
.wrapper {
  width: 400px;
}

.field {
  display: flex;
  flex-direction: column;
  font-size: 1.1rem;
  margin: 5px 0;
}

input {
  height: 30px;
  font-size: 1.5rem;
}

.complexity {
  transition: 0.2s;
  height: 10px;
}

.high {
  width: 100%;
  background: lime;
}

.mid {
  width: 66%;
  background: yellow;
}

.low {
  width: 33%;
  background: red;
}

button {
  height: 30px;
  background: none;
  border: none;
  font-size: 1.5rem;
  background: steelblue;
  color: white;
  padding: 4px 0;
  width: 100%;
  box-sizing: content-box;
}

button:disabled {
  opacity: 0.5;
}
</style>
