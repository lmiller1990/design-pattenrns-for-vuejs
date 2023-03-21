import { createApp } from "vue";
// import App from './examples/v2/form-validation/FormValidation.vue'
import App from "./examples/v2/api-requests/Login.vue";
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
