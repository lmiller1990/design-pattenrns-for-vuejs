import { createApp } from 'vue'
import Message from './examples/props/message.vue'

const app = createApp(Message, { variant: 'asdf' })
app.mount('#app')
