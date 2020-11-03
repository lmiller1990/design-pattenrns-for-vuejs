import { reactive, readonly } from 'vue'

interface User {
  id: string
  name: string
}


interface UserState {
  data: User[]
}

const userState: UserState = {
  data: [
    {
      id: '2',
      name: 'bar'
    }
  ]
}

export function addUser(payload: User) {
  return (state: UserState) => {
    return {
      ...state,
      data: [...state.data, payload]
    }
  }
}

export function getUserNames() {
  return (state: UserState) => state.data.map(x => x.name) 
}

function createStore<Modules>(modules: Modules) {
  type Key = keyof Modules
  type StateTree = Record<Key, Modules[Key]>

  const obj = {} as StateTree
  for (const [k, v] of Object.entries(modules)) {
    obj[k as Key] = v
  }

  const state = reactive<StateTree>(obj)

  function dispatch(mod: Key, action: (payload: StateTree[Key]) => void) {
    state[mod.valueOf()] = action(obj[mod])
  }

  function getState() {
    return readonly(state as StateTree)
  }

  return {
    getState,
    dispatch
  }
}

export const store = createStore({
  users: userState
})