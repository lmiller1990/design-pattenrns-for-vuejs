<template>
  <div class="wrapper">
    <form @submit.prevent="handleSubmit">
      <input v-model="username" />
      <button>Add User</button>
    </form>

    <ul>
      <li 
        v-for="user in users"
        :key="user"
      >
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from './store.js'

export default {
  setup() {
    const store = useStore()
    const username = ref('')

    const handleSubmit = () => {
      store.addUser({ name: username.value })
      username.value = ''
    }

    return {
      username,
      handleSubmit,
      users: store.getState().users
    }
  }
}
</script>

<style>
.wrapper {
  width: 300px;
}

h3 {
  text-align: center;
}

ul {
  width: 100%;
}

form {
  display: flex;
  flex-direction: column;
}

input {
  margin: 5px 0;
}
</style>
