import { createApp } from 'vue'
import { store } from './examples/provide-inject/store.js'
import App from './examples/provide-inject/users.vue'

// createApp(Game).mount('#app')


// const App = {
//   setup() {
//     const users = computed(() => 
//       store.getState().users.data.map(x => {
//         return h('li', x.name)
//       }))

//     const username = ref('')

//     const input = h('input', {
//       value: username.value,
//       onChange: (event: KeyboardEvent) => {
//         username.value = (event.target as HTMLInputElement).value
//       }
//     })

//     return () => [
//       input,
//       h(
//         'button', { 
//           onClick: () => {
//             store.dispatch('users', addUser({
//               id: (users.value.length + 1).toString(),
//               name: username.value
//             }))
//           }
//         },
//         'Add user'
//       ),
//       [
//         h('ul', users.value),
//       ]
//     ]
//   }
// }

const app = createApp(App)
app.provide('store', store)
app.mount('#app')
