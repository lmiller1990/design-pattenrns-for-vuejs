import { createApp } from "vue";
// import App from './examples/v2/form-validation/FormValidation.vue'
// import App from "./examples/v2/api-requests/Login.vue";
// import App from "./examples/v2/renderless-password/RenderlessPasswordApp.vue"
// import App from "./examples/v2/renderless-password/AppWithCustomValidator.vue";
// import Counter from "./examples/v2/events/PatientForm.vue";
import App from "./examples/v2/reusable-date-time/DateTimeApp.vue"
// import App from "./examples/v2/render-functions/RenderFunctionsApp.vue";
// import { Comp as App } from "./examples/v2/render-functions/HExample";
// emport App from "./examples/v2/reusable-date-time/DateTimeApp.vue";
import { createPinia } from "pinia";
import Sum from "./examples/v2/props/Sum.vue"
// import List from "./examples/v2/generics/List.vue"

const app = createApp(App, {
  // onCreatePatient: (...patient) => {
  //   console.log(patient)
  // }
});
app.use(createPinia());
app.mount("#app");
