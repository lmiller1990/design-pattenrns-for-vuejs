# Dependency Injection with Provide and Inject

You can find the completed source code in the [GitHub repository under examples/provide-inject](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In this section we discuss a pair of functions, `provide` and `inject`. These facilitate *dependency injection* in Vue. This feature was available in Vue 2, but in a different fashion. In Vue 2, it was common to attach global variables to this Vue prototype and access them via the `this.$`. A common example of this is `this.$router` or `this.$store`. For this reason, `provide` and `inject` were not as commonly used. With Vue 3 and the Composition API discouraging mutating the global Vue prototype, dependency injection with `provide` and `inject` is more common.

Instead of providing a toy example, we will see a real use case by building a simple store (like Vuex) and making it available via a `useStore` composable. This will use `provide` and `inject` under the hood. There are other ways to implement a `useStore` function, for example simply importing and exporting a global singleton. We will see why `provide` and `inject` are a better way of sharing a global variable.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-complete.png}
  \caption{Completed demo app}
  \label{fig}
\end{figure}
\pagebreak

## A Simple Store

Let's quickly define a dead simple store. We won't have a complex API like Vuex - just a class with some methods. Let's start with a reactive state, and expose it in readonly fashion via a `getState` function.

```ts
import { reactive, readonly } from 'vue'


interface User {
  id: number
  name: string;
}

interface State {
  users: User[];
}

export class Store {
  #state: State = { users: [] };

  constructor(state: State) {
    this.#state = reactive(state);
  }

  getState() {
    return readonly(this.#state)
  }
}
```
\begin{center}
A simple store with private state and a readonly accessor.
\end{center}

If you haven't seen the `#state` syntax before, this is a private property - one of the newer features to classes in JavaScript. You can omit the `#` if you like - it will still work just fine. 

The `#` means that the property can only be accessed inside the class instance. So `this.#state` works for methods declared inside the `Store` class, but `new Store({ count: 1 }).#state.count` is not allowed. Instead, we will access the state in a readonly manner using `getState()`.

We pass `state` to the constructor to let the user seed the initial state. We will take the disciplined approach and write a test.

```js
import { describe, it, expect } from 'vitest'
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

Let's get something running before we explore using `provide` and `inject`. Export a new instance of the store:

```js
import { reactive, readonly } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: [{ id: 1, name: 'Alice' }]
})
```
\begin{center}
Exporting the store as a global singleton with some initial state.
\end{center}

Next, import it into your component and iterate over the users:

```html
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      ID: {{ user.id }}. Name: {{ user.name }}
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { store } from "./store.js";

const username = ref("");

const users = computed(() => store.getState().users);
</script>
```
\begin{center}
Accessing the state via the the imported store.
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-basic.png}
  \caption{Displaying a user from the store state.}
  \label{fig}
\end{figure}

It works! Good progress - I added a tiny bit of CSS as well. You can find that in the source code. 

This single shared `store` is known as a *global singleton*.

We will allowing adding more users via a form - but first let's add a UI test using Testing Library.

```ts
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/vue";
import { Store } from "./store.js";
import Users from "./users.vue";

it("renders a user", async () => {
  render(Users);

  await screen.findByText("ID: 1. Name: Alice");
});
```
\begin{center}
UI test with Testing Library
\end{center}

It works as expected. We do not want to hard code any users in the store, though, which is what our test currently relies on. This highlights one of the downsides of a global singleton - no easy way to initialize or update the state for testing purposes. Let's add a feature to create new users via a form, and them that way.

## Adding a User Form

To add a user, we will first create a `addUser` function to the store:

```js
import { reactive, readonly } from 'vue'

// ... 

export class Store {
  #state = {}

  // ...

  addUser(user: Omit<User, 'id'>) {
    const id = this.#state.users.length === 0 
      ? 1 
      : Math.max(...this.#state.users.map(user => user.id)) + 1
    this.#state.users.push({ id, ...user });
  }
}

export const store = new Store({
  users: []
})
```
\begin{center}
addUser can access the private state because it is declared in the Store class.
\end{center}

We are setting the `id` dynamically - for this example, it'll be 1 if there aren't any users in the store, or n+1 where n is the largest `id` in the store if there are already some users present. 

I also removed the initial user, Alice, from the store. Update the tests - we can test `addUser` in isolation.

```js
describe('store', () => {
  it('seeds the initial state', () => {
    // ...
  })

  it('renders a user', async () => {
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
})
```
\begin{center}
Testing addUser in isolation - no component, no mounting.
\end{center}

The UI test is now failing, where we assert `ID: 1. Name: Alice` should be rendered. We need to implement a form that calls `addUser`, and update the test to use it:

```html
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" id="username" />
    <button id="add-user">Add User</button>
  </form>

  <ul>
    <li v-for="user in users" :key="user.id">
      ID: {{ user.id }}. Name: {{ user.name }}
      <button @click="store.removeUser(user)">Remove</button>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { store } from "./store.js";

const username = ref("");

const handleSubmit = () => {
  store.addUser({
    name: username.value,
  });
  username.value = "";
};

const users = computed(() => store.getState().users);
</script>
```
\begin{center}
A form to create new users.
\end{center}

The updated test:

```ts
it("renders a user", async () => {
  const { container } = render(Users);
  await fireEvent.update(container.querySelector("#username")!, "Alice");
  await fireEvent.click(container.querySelector("#add-user")!);
  await screen.findByText("ID: 1. Name: Alice");
});
```

Great! The test now passes - again, I added a tiny bit of CSS and a nice title, which you can get in the source code if you like.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-complete.png}
  \caption{Completed app}
  \label{fig}
\end{figure}

## Provide/Inject to Avoid Cross Test Contamination

Everything looks to be working on the surface, but we will eventually run into a problem as our application grows: shared state across tests. We have a *single* store instance for all of our tests - when we mutate the state, this change will impact all the other tests, too.

Ideally each test should run in isolation. We can't isolate the store if we are importing the same global singleton into each of our tests. This is where `provide` and `inject` come in handy.

This diagram, taken from this official documentation, explains it well:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-provde-inject.png}
  \caption{Provide/Inject diagram. Credit: Vue documentation.}
  \label{fig}
\end{figure}

Let's say you have a component, `Parent.vue`, that looks like something this:

```html
<template>
  <Child />
</template>

<script setup>
import { provide } from 'vue'

const theColor = 'blue'
provide('color', theColor)
</script>
```

We are making a `color` variable available to *any* child component that might want access to it, no matter how deep in the component hierarchy it appears. `Child.vue` might look like this:

```html
<template>
  <!-- renders Color is: blue -->
  Color is: {{ color }}
</template>

<script>
import { inject } from 'vue'

const color = inject('color')
</script>
```

You can pass anything to `provide` - including a reactive store. Let's do that. Head to the top level file where you create your app (mine is `index.ts`; see the source code for a complete example):

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

You can call `provide` in any `<script setup>` SFC, or any component with a `setup` function. This makes the provided value available to all that component's children (and their children, etc). You can also call provide on `app`. This will make your value available to all the components, which is what we want to do in this example.

Instead of importing the store, we can now just call `const store = inject('store')`:

```html
<template>
  <!-- ... -->
</template>

<script lang="ts" setup>
import { ref, inject, computed } from 'vue'

const store = inject('store')
const username = ref('')

const handleSubmit = () => {
  // ...
}

const users = computed(() => store.getState().users)
</script>
```
\begin{center}
Using inject to access the store.
\end{center}

## Provide in Testing Library

The final UI test where we add a user named Alice to the store is failing. We did `provide('store', store)` when we created our app, but we didn't do it in the test. Testing Library has a mounting option specifically for `provide` and `inject`: `global.provide`:

```js
import { render, screen, fireEvent } from '@testing-library/vue'
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
    render(Users, {
      global: {
        provide: {
          store: new Store({
            users: []
          })
        }
      }
    })

    await fireEvent.update(screen.getByRole('username'), 'Alice')
    await fireEvent.click(screen.getByRole('submit'))
    await screen.findByText('Alice')
  })
})
```
\begin{center}
Using the global.provide mounting option.
\end{center}

Everything is passing again. We now can avoid cross test contamination - it's easy to provide a new store instance using `global.provide`.

## A `useStore` Composable

We can write a little abstraction to make using our store a bit more ergonomic. Instead of typing `const store = inject('store')` everywhere, it would be nice to just type `const store = useStore()`. Global mutable state in Vue is often exposed via a "composable", which is usually a function named `useXXX`. It's a common convention - there is library with many high quality composables called VueUse. Take a look at that for more resources on writing production ready composables.

Let's update the store module to use `provide` and `inject` and expose a `useStore` function:

```js
import { reactive, readonly, inject } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: []
})

export function useStore(): Store {
  return inject("store") as Store;
}

```
\begin{center}
A useStore composable.
\end{center}

Now update the component:

```html
<template>
  <!-- ... -->
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useStore } from "./store.js";

const store = useStore();
const username = ref("");

const handleSubmit = () => {
  store.addUser({
    name: username.value,
  });
  username.value = "";
};

const users = computed(() => store.getState().users);
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
3. Write a UI test to verify this works using Testing Library. You can set up the store with a user by using `globals.provide` and passing in a store with a user already created.

You can find the completed source code in the [GitHub repository under examples/provide-inject](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
