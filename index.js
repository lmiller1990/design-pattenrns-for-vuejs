import { createApp } from 'vue'
// import App from './examples/renderless-password/App.vue'
import App from './examples/provide-inject/users.vue'
import { store } from './examples/provide-inject/store.js'

const app = createApp(App)
app.provide('store', store)
app.mount('#app')
