import { reactive, readonly } from 'vue'

export class Store {
  #state = {}

  constructor(state) {
    state = reactive(state)
  }

  getState() {
    return readonly(this.state)
  }

  addUser(user) {
    this.state.users.push(user)
  }

  get usernames() {
    return this.state.users.map(x => x.name)
  }
}
