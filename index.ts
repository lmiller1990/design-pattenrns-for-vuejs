import { createApp } from "vue";
// import App from './examples/v2/form-validation/FormValidation.vue'
// import App from "./examples/v2/api-requests/Login.vue";
// import App from "./examples/v2/renderless-password/App.vue";
// import App from "./examples/v2/renderless-password/AppWithCustomValidator.vue";
// import App from "./examples/v2/render-functions/App.vue";
import App from "./examples/v2/reusable-date-time/DateApp.vue";
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
