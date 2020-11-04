import { createApp } from 'vue'
import Message from './examples/props/Message.vue'

const app = createApp(Message, { variant: 'success' })
app.mount('#app')
