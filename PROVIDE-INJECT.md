# Dependency Injection with Provide and Inject

You can find the completed source code in the [GitHub repository under examples/provide-inject](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In this section we discuss a pair of functions, provide and inject. These facilitate *dependency injection* in Vue. This feature was available in Vue 2. In Vue 2, it was common to attach global variables to this Vue prototype and access them via the `this.$`. A common example of this is `this.$router` or `this.$store`. As such, `provide` and `inject` were not as common used. With Vue 3 and the Composition API discouraging mutating the global Vue prototype, dependency injection with `provide` and `inject` is more common.

Instead of providing a toy example, we will see a real use case by building a simple store (like Vuex) and making it available via a `useStore` composable. This will use `provide` and `inject` under the hood. There are other ways to implement a `useStore` hook. We will see why `provide` and `inject` are better.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-complete.png}
  \caption{Completed demo app}
  \label{fig}
\end{figure}
\pagebreak

## A Simple Store

Let's quickly define a dead simple store. We won't have a complex API like Vuex - just a class with some methods. Let's start with a reactive state, and expose it in readonly fashion via a `getState` function.

```js
import { reactive, readonly } from 'vue'

export class Store {
  #state = {}

  constructor(state) {
    this.#state = reactive(state)
  }

  getState() {
    return readonly(this.#state)
  }
}
```
\begin{center}
A simple store with private state and a readonly accessor.
\end{center}

If you haven't seen the `#state` syntax before, this is a private property - one of the newer features to classes in JavaScript. At the time of writing this, it only works in Chrome natively. You can omit the `#` if you like - it will still work just fine. 

The `#` means that the property can only be accessed inside the class instance. So `this.#state` works for methods declared inside the `Store` class, but `new Store({ count: 1 }).#state.count` is not allowed. Instead, we will access the state in a readonly manner using `getState()`.

We pass `state` to the constructor to let the user seed the initial state. We will take the disciplined approach and write a test.

```js
import { Store } from './store.js'

describe('store', () => {
  it('seeds the initial state', () => {
    const store = new Store({
      users: []
    })

    expect(store.getState()).toEqual({ users: [] })
  })
})
```
\begin{center}
The tests verifies everything is working correctly.
\end{center}

## Usage via import

Let's get something rendering before we go. Export a new instance of the store:

```js
import { reactive, readonly } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: [{ name: 'Alice' }]
})
```
\begin{center}
Exporting the store as a "global singleton" with some initial state.
\end{center}

Next, import it into your component and iterate over the users:

```html
<template>
  <ul>
    <li 
      v-for="user in users"
      :key="user"
    >
      {{ user.name }}
    </li>
  </ul>
</template>

<script>
import { computed } from 'vue'
import { store } from './store.js'

export default {
  setup() {
    return {
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
accessing the state via the the imported store.
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-basic.png}
  \caption{Displaying a user from the store state.}
  \label{fig}
\end{figure}

It works! Good progress - I added a tiny bit of CSS as well, grab that from the source code. 

This single shared `store` is known as a *global singleton*.

We will allowing adding more users via a form - but first let's add a UI test using Vue Test Utils.

```js
import { mount } from '@vue/test-utils'
import { Store } from './store.js'
import Users from './users.vue'

describe('store', () => {
  it('seeds the initial state', () => {
    // ...
  })

  it('renders a user', () => {
    const wrapper = mount(Users)

    expect(wrapper.html()).toContain('Alice')
  })
})
```
\begin{center}
UI test with Vue Test Utils.
\end{center}

Working great! We do not want to hard code any users in the store, though. Let's add a feature to create new users via a form, and them that way.

## Adding a users forms

To add a user, we will first add a `addUser` function to the store:

```js
import { reactive, readonly } from 'vue'

export class Store {
  #state = {}

  // ...

  addUser(user) {
    this.#state.users.push(user)
  }
}

export const store = new Store({
  users: []
})
```
\begin{center}
addUser can access the private state because it is declared in the Store class.
\end{center}

I also removed the initial user, Alice, from the store. Update the tests - we add one for `addUser` in isolation.

```js
describe('store', () => {
  it('seeds the initial state', () => {
    // ...
  })

  it('adds a user', () => {
    const store = new Store({
      users: []
    })

    store.addUser({ name: 'Alice' })

    expect(store.getState()).toEqual({ 
      users: [{ name: 'Alice' }]
    })
  })

  it('renders a user', async () => {
    const wrapper = mount(Users)

    await wrapper.find('input').setValue('Alice')
    await wrapper.find('button').trigger('submit.prevent')

    expect(wrapper.html()).toContain('Alice')
  })
})
```
\begin{center}
Testing addUser in isolation - no component, no mounting.
\end{center}

The UI test is now failing. We need to implement a form that calls `addUser`:

```html
<template>
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
</template>

<script>
import { ref, computed } from 'vue'
import { store } from './store.js'

export default {
  setup() {
    const username = ref('')
    const handleSubmit = () => {
      store.addUser({ name: username.value })
      username.value = ''
    }

    return {
      username,
      handleSubmit,
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
A form to create new users.
\end{center}

Great! The test now passes - again, I added a tiny bit of CSS and a nice title, which you can get in the source code if you like.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-complete.png}
  \caption{Completed app}
  \label{fig}
\end{figure}

## Provide/Inject to Avoid Cross Test Contamination

Everything looks to be working on the surface, but we will eventually run into a problem as our application grows: shared state across tests. We have a *single* store instance for all of our tests - when we mutate the state, this change will impact all the other tests, too.

Ideally, tests should run in isolation. We can't isolate the store if we are importing the same global singleton into each of our tests. This is where `provide` and `inject` come in handy.

This diagram, taken from this official documentation, explains it well:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-provde-inject.png}
  \caption{Provide/Inject diagram. Credit: Vue documentation.}
  \label{fig}
\end{figure}

Let's say you have a component, `Parent.vue`, that looks like something this:

```html
<template>
  <child />
</template>

<script>
import { provide } from 'vue'

export default {
  setup() {
    const theColor = 'blue'
    provide('color', theColor)
  }
}
</script>
```

We are making a `color` variable available to *any* child component that might want access to it, no matter how deep in the component hierarchy it appears. `child.vue` might look like this:

```html
<template>
  <!-- renders Color is: blue -->
  Color is: {{ color }}
</template>

<script>
import { inject } from 'vue'

export default {
  setup() {
    const color = inject('color')
    return {
      color
    }
  }
}
</script>
```

You can pass anything to `provide` - including a reactive store. Let's do that. Head to the top level file where you create your app (mine is `index.js`; see the source code for a complete example):

```js
import { createApp } from 'vue'
import { store } from './examples/provide-inject/store.js'
import Users from './examples/provide-inject/users.vue'

const app = createApp(Users)
app.provide('store', store)
app.mount('#app')
```
\begin{center}
Using provide to make the store available in all the components.
\end{center}

You can call `provide` in a component's `setup` function. This makes the provided value available to all that component's children (and their children, etc). You can also call provide on `app`. This will make your value available to all the components, which is what we want to do in this example.

Instead of importing the store, we can now just call `const store = inject('store')`:

```html
<template>
  <!-- .. -->
</templat>

<script>
import { ref, inject, computed } from 'vue'

export default {
  setup() {
    const store = inject('store')
    const username = ref('')

    const handleSubmit = () => {
      // ...
    }

    return {
      username,
      handleSubmit,
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
Using inject to access the store.
\end{center}

## Provide in Vue Test Utils

The final UI test is failing. We did `provide('store', store)` when we created our app, but we didn't do it in the test. Vue Test Utils has a mounting option specifically for `provide` and `inject`: `global.provide`:

```js
import { mount } from '@vue/test-utils'
import { Store } from './store.js'
import Users from './users.vue'

describe('store', () => {
  it('seeds the initial state', () => {
    // ...
  })

  it('adds a user', () => {
    // ...
  })

  it('renders a user', async () => {
    const wrapper = mount(Users, {
      global: {
        provide: {
          store: new Store({
            users: []
          })
        }
      }
    })

    await wrapper.find('input').setValue('Alice')
    await wrapper.find('button').trigger('submit.prevent')

    expect(wrapper.html()).toContain('Alice')
  })
})
```
\begin{center}
Using the global.provide mounting option.
\end{center}

Everything is passing again. We now can avoid cross test contamination - it's easy to provide a new store instance using `global.provide`.

## A useStore composable

We can write a little abstraction to make using our store a bit more ergonomic. Instead of typing `const store = inject('store')` everywhere, it would be nice to just type `const store = useStore()`.

Update the store:

```js
import { reactive, readonly, inject } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: []
})

export function useStore() {
  return inject('store')
}
```
\begin{center}
A useStore "composable".
\end{center}

Now update the component:

```html
<template>
  <!-- ... -->
</template>

<script>
import { ref, computed } from 'vue'
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
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
Using the useStore composable.
\end{center}

All the test are still passing, so we can be confident everything still works.

Now anywhere you need access to the store, just call `useStore`. This is the same API Vuex uses. It's a common practice to make global singletons available via a useXXX function, which uses `provide` and `inject` under the hood.

\pagebreak
## Exercises

1. Update the store to have a `removeUser` function. Test it in isolation.
2. Add a button next to each user - clicking the button should remove them from the store. Use the `removeUser` function here.
3. Write a UI test to verify this works using Vue Test Utils. You can set up the store with a user by using `globals.provide` and passing in a store with a user already created.

You can find the completed source code in the [GitHub repository under examples/provide-inject](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
