import { createApp, h } from 'vue'
import Game from './examples/composition/tic-tac-toe-app.vue'

const App = {
  render() {
    return h(Game)
  }
}

createApp(App).mount('#app')
