import { createApp, h } from 'vue'
import Game from './examples/composition-functional/tic-tac-toe-app.vue'

const App = {
  render() {
    return h(Game)
  }
}

createApp(App).mount('#app')
