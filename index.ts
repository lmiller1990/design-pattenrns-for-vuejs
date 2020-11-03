import { createApp, reactive, h, computed, readonly, ref } from 'vue'
// import Game from './examples/provide-inject/app.vue'
import { store, addUser, getUserNames } from './store'

// createApp(Game).mount('#app')


const App = {
  setup() {
    const users = computed(() => 
      store.getState().users.data.map(x => {
        return h('li', x.name)
      }))

    const username = ref('')

    const input = h('input', {
      value: username.value,
      onChange: (event: KeyboardEvent) => {
        username.value = (event.target as HTMLInputElement).value
      }
    })

    return () => [
      input,
      h(
        'button', { 
          onClick: () => {
            store.dispatch('users', addUser({
              id: (users.value.length + 1).toString(),
              name: username.value
            }))
          }
        },
        'Add user'
      ),
      [
        h('ul', users.value),
      ]
    ]
  }
}

createApp(App).mount('#app')
