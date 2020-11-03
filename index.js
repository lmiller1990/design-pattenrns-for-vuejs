import { createApp, reactive, h, computed } from 'vue'
import Game from './examples/provide-inject/app.vue'

// createApp(Game).mount('#app')

const users = {
  state: {
    data: [
      {
        id: 1,
        name: 'Lachlan'
      }
    ]
  },
  actions: {
    add: (state, payload) => {
      console.log('add', payload)
      state.data.push(payload)
    }
  },
  getters: {
    names: (state) => {
      return state.data.map(x => x.name)
    }
  }
}

function createStore({ modules }) {
  let state = {}
  let actions = {}
  let getters = {}

  for (const mod of modules) {
    state[mod.name] = mod.module.state
    for (const [actionName, fn] of Object.entries(mod.module.actions)) {
      actions[`${mod.name}/${actionName}`] = fn
    }
  }

  state = reactive(state)
  const trigger = (actionName, payload) => {
    const [moduleName, action] = actionName.split('/')
    actions[actionName](state[moduleName], payload)
  }

  return {
    state,
    trigger
  }
}

const store = createStore({
  modules: [
    {
      name: 'users',
      module: users
    }
  ]
})

const App = {
  setup() {
    const users = computed(() => 
      store.state.users.data.map(x => {
        return h('li', x.name)
      }))

    return () => [
      h(
        'button', { 
          onClick: () => {
            store.trigger('users/add', { id: 2, name: 'someone' })
          }
        },
        'Add user'
      ),
      h('ul', users.value)
    ]
  }
}

createApp(App).mount('#app')
