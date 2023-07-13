# HTTP and API Requests

Something almost every Vue.js application is going to do is make HTTP requests to an API of some sort. This could be for authentication, loading data, or something else. Many patterns have emerged to manage HTTP requests, and even more to test them.

This chapter looks at various ways to architecture your HTTP requests, different ways to test them, and discusses the pros and cons of each approach.

## The Login Component

The example I will use is the `<Login>` component. It lets the user enter their username and password and attempt to authenticate. We want to think about:

- Where should the HTTP request be made from? The component, another module, in a store (like Pinia?)
- How can we test each of these approaches?

There is no one size fits all solution here. I'll share how I currently like to structure things, but also provide my opinion on other architectures.

## Starting Simple

If you application is simple, you probably won't need something like Vuex, Pinia, or an isolated HTTP request service. You can just inline everything in your component:

```html
<template>
  <h1 v-if="user">Hello, {{ user.name }}</h1>
  <form @submit.prevent="handleAuth">
    <input v-model="formData.username" />
    <input v-model="formData.password" type="password" />
    <button>Click here to sign in</button>
  </form>
  <span v-if="error">{{ error }}</span>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from "axios";
import { reactive, ref } from "vue";

interface User {
  name: string;
}

const formData = reactive({
  username: "",
  password: "",
});

const user = ref<User>();
const error = ref<string>();

async function handleAuth() {
  try {
    const response = await axios.post<User>("/login");
    user.value = response.data;
  } catch (e) {
    // Axios types aren't fantastic
    error.value = (e as AxiosError<any, { error: string }>).response?.data?.error
  }
}
</script>
```
\begin{center}
A simple login form component, It makes a request using axios.
\end{center}

This example uses the axios HTTP library, but the same ideas apply if you are using fetch or another HTTP client.

We mighjt not want to make a request to a real server when testing this component - component tests should (generally) run in isolation. One option here is to mock the `axios` module - most runners will have some sort of module mocking/stubbing feature, such as `jest.mock()` (Jest), `vi.mock()` (Vitest) or `cy.stub()` (Cypress).

We probably want to test:

- Is the correct endpoint used?
- Is the correct payload included?
- Does the DOM update accordingly based on the response?

A test where the user successfully authenticates might look like this:

```js
import Login from './Login.vue'

it('works by stubbing axios', () => {
  cy.stub(axios, "post").resolves({
    data: {
      username: "Lachlan",
    }
  })

  cy.mount(Login);

  cy.get("#username").type("Lachlan");
  cy.get("#password").type("secret-password");
  cy.get("button").contains("Click here to sign in").click();

  cy.contains("Hello, Lachlan");
});
```
\begin{center}
Using a mock implementation of axios to test the login workflow.
\end{center}

Testing a failed request is straight forward as well - you would just throw an error in the mock implementation, or return a specific error payload, depending on how your backend is configured.

## Refactoring to a Pinia Store

If you are working on anything other than a trivial application, you probably don't want to store the response in component local state. The most common way to scale a Vue app has traditionally been Vuex, and more lately, Pinia. This example uses Pinia, but the ideas are the same for any sort of modular, reactive store. 

More often than not, you end up with a Pinia store that looks like this:

```js
import axios from "axios";
import { defineStore } from "pinia";

export interface User {
  username: string;
}

interface UsersState {
  user?: User;
}

export const useUsers = defineStore("users", {
  state(): UsersState {
    return {
      user: undefined,
    };
  },

  actions: {
    updateUser(user: User) {
      this.user = user;
    },

    async login(username: string, password: string) {
      const response = await axios.post<User>("/login", {
        username,
        password,
      });
      this.user = response.data;
    },
  },
});
```
\begin{center}
A simple Pinia store.
\end{center}

There are many strategies for error handling in this set up. You can have a local `try/catch` in the component. Other developers store the error in the Pinia state, as well.

Either way, the `<Login>` component using a Pinia store would look something like this:

```html
<template>
  <!-- no change -->
</template>

<script lang="ts" setup>
import { AxiosError } from "axios";
import { reactive, ref } from "vue";
import { useUsers } from "./store.js";

const store = useUsers();

const formData = reactive({
  username: "",
  password: "",
});

const error = ref("");

const handleAuth = async () => {
  try {
    await store.login(formData.username, formData.password);
  } catch (e) {
    error.value = (e as AxiosError<any, { error: string }>).response?.data?.error
  }
};
</script>
```
\begin{center}
Using Pinia in the login component.
\end{center}

You now need a Pinia store in your test, too. You have a few options. The two most common are:

- Use a real Pinia store - continue mocking axios.
- Use a mock Pinia store.

The first option would look something like this:

```js
import { createPinia, Pinia, setActivePinia } from "pinia";
import axios from 'axios'

describe('login', () => {
  let pinia: Pinia;

  // New store before each test.
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('successfully authenticates', async () => {
    cy.stub(axios, 'post')
    cy.mount(Login, { global: { plugins: [pinia] } });
  })
})
```
\begin{center}
Updating the test to use Pinia.
\end{center}

I like this option. We continue to mock `axios`. The only change we made to the test is passing a `store`. The actual user facing behavior has not changed, so the test should not need significant changes either - in fact, the actual test code is the same (entering the username and password and submitting the form). It also shows we are not testing implementation details - we were able to make a significant refactor without changing the test (except for providing the Pinia store - we added this dependency, so this change is expected).

I've used the real store + axios mock strategy for quite a long time in both Vue and React apps and had an *okay* experience. The only downside is you need to mock `axios` a lot - you often end up with a lot of copy-pasting between tests. Fortunately, changing your HTTP client isn't something you do very often, nor your endpoints. This testing strategy can be a little boilerplate heavy, though.

## To mock or not to mock?

As your application gets larger and larger, though, using a real store can become complex. Some developers opt to mock the entire store in this scenario. It leads to less boilerplate, for sure, especially if you are using Vue Test Utils, which some convenient methods for mocking things, like `mocks`, or you might opt to use some of the patterns in the [testing](https://pinia.vuejs.org/cookbook/testing.html) section in the Pinia documentaion.

What if you are using a different library, like Vue Testing Library, which does not support mocking things so easily - intentionally. Or, another framework? Good foundational concepts are not tied to specific frameworks and libraries. What are our other options?

Let me illustrate my concern with mocking major dependencies, like Vuex or Pinia. This will show why I prefer to use a real store and real dependencies as much as possible in my tests. This example uses `vi.mock()`, but the same idea applies for `cy.stub()` and `jest.mock()`.

```js
import { render, fireEvent, screen } from "@testing-library/vue";
import Login from "./Login.vue";

const mockLogin = jest.fn();

// Mock store! Not ideal, read on...
jest.mock("./store.js", () => {
  return {
    useUsers: () => {
      return {
        login: mockLogin,
        user: {
          username: "Lachlan",
        },
      };
    },
  };
});

describe("login with mocking pinia", () => {
  it("works with a fake store, but why would want that", async () => {
    const { container } = render(Login);

    await fireEvent.update(
      container.querySelector("#username")!,
      "Lachlan"
    );
    await fireEvent.update(
      container.querySelector("#password")!,
      "secret-password"
    );
    await fireEvent.click(screen.getByText("Click here to sign in"));

    expect(mockLogin).toHaveBeenCalledWith(
      "Lachlan",
      "secret-password"
    );
  });

  it("renders a user", async () => {
    render(Login);

    await screen.findByText("Hello, Lachlan");
  });
});

```
\begin{center}
Mocking Piina. 
\end{center}

Since we are mocking the Piina store now, we have bypassed `axios` entirely. This style of test is tempting at first. There is less code to write. It's very easy to write. You can also have fine grained control over the state of the store - in the snippet above.

Again, the actual test code didn't change much - we are no longer passing a `store` to `render` (since we are not even using a real store in the test, we mocked it out entirely). We don't have `mockPost` any more - instead we have `mockDispatch`. The assertion against `mockDispatch` became an assertion that a `login` action was dispatched with the correct payload, as opposed to a HTTP call to the correct endpoint.

There is a big problem. Even if you delete the `login` action from the store, the test will *continue to pass*. This is scary! The tests are all green, which should give you confidence everything is working correctly. In reality, your entire application is completely broken.

This is not the case with the test using a real Pinia store - breaking the store correctly breaks the tests. There is only one thing worse than a code-base with no tests - a code-base with *bad* tests. At least if you have not tests, you have no confidence, which generally means you spend more time testing by hand. Tests that give false confidence are actually worse - they lure you into a false sense of security. Everything seems okay, when really it is not.

## Mock Less - mock the lowest dependency in the chain

The problem with the above example is we are mocking too far up the chain. Good tests are as production like as possible. This is the best way to have confidence in your test suite. This diagram shows the dependency chain in the `<Login>` component:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-map.png}
  \caption{Authentication dependency chain}
  \label{fig}
\end{figure}

The previous test, where we mocked Pinia, mocks the dependency chain here:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-vuex.png}
  \caption{Mocking Pinia}
  \label{fig}
\end{figure}

This means if anything breaks in Pinia, the HTTP call, or the server, our test will not fail.

The axios test is slightly better - it mocks one layer lower:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-axios.png}
  \caption{Mocking Axios}
  \label{fig}
\end{figure}
Pinia
This is better. If something breaks in either the `<Login>` or Pinia, the test will fail.

Wouldn't it be great to avoid mocking `axios`, too? This way, we could not need to do:

```js
let mockPost = jest.fn()

jest.mock('axios', () => ({
  post: (url, data) => {
    mockPost(url, data)
    return Promise.resolve({
      data: { name: 'Lachlan' }
    })
  }
}))
```
\begin{center}
Boilerplate code to mock axios.
\end{center}

... in every test. And we'd have more confidence, further down the dependency chain.

## Mock Service Worker & cy.intercept()

There's a few ways to handle network level mocking. If you are using Cypress, you can use the `cy.intercept()` feature. This is probably my favorite Cypress feature! The downside is it's runner specific. Another neat library has come into the scene in the last few years - Mock Service Worker, or `msw` for short. This one is runner agnostic, and works in Node.js and in the browser. 

Both these do exactly what is discussed above - it operates one level lower than `axios`, mocking the actual network request! How `cy.intercept()` and `msw` works will not be explained here, but you can learn more on the [msw website](https://mswjs.io/): https://mswjs.io/ or in the [Cypress documentation](https://docs.cypress.io/api/commands/intercept): https://docs.cypress.io/api/commands/intercept. 

Let's try mocking the network layer instead. Basic usage is like this for Mock Service Worker:

```js
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)
```
\begin{center}
A basic server with Mock Service Worker:
\end{center}

The nice thing is we are not mocking `axios` anymore. You could change you application to use `fetch` instead - and you wouldn't need to change you tests at all, because we are now mocking at a layer lower than before. 

A full test using Mock Service Worker looks like this:

```js
import { render, fireEvent, screen } from '@testing-library/vue'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import App from './app.vue'
import { store } from './store.js'

const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)

describe('login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('successfully authenticates', async () => {
    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText('Hello, Lachlan')
  })
})
```
\begin{center}
Using msw instead of mocking axios.
\end{center}

You can have even less boilerplate by setting up the server in another file and importing it automatically, as suggested [in the documentation](https://mswjs.io/docs/getting-started/integrate/node): https://mswjs.io/docs/getting-started/integrate/node. Then you won't need to copy this code into all your tests - you just test as if you are in production with a real server that responds how you expect it to.

The Cypress version is even more concise. You don't need to start or stop a server - Cypress does this all for you:

```ts
it("successfully authenticates", () => {
  cy.intercept("/login", (req) => {
    req.reply({
      username: "Lachlan",
    });
  });

  cy.mount(Login, { global: { plugins: [pinia] } });

  cy.get("#username").type("Lachlan");
  cy.get("#password").type("secret-password");
  cy.get("button").contains("Click here to sign in").click();

  cy.contains("Hello, Lachlan");
});
```

I like this one, because all the information is contain in the `it` block. No need to hunt around for where things are defined or set up. Either way, the focus here is on the concept - we are spoiled for options in modern web development, so just pick the one you like best.

One thing we are not doing in these tests that we were doing previously is asserting the expected payload is sent to the server. If you want to do that, you can just keep track of the posted data with an array, for example:

```js
const postedData = []
const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    postedData.push(req.body)
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)
```
\begin{center}
Keeping track of posted data.
\end{center}

Now you can just assert that `postedData[0]` contains the expected payload. You could reset it in the `beforeEach` hook, if testing the body of the post request is something that is valuable to you.

For completion, Cypress does it like this:

```js
it("successfully authenticates", () => {
  cy.intercept("/login", (req) => {
    req.reply({
      username: "Lachlan",
    });
  }).as('login');

  cy.mount(Login, { global: { plugins: [pinia] } });

  cy.get("#username").type("Lachlan");
  cy.get("#password").type("secret-password");
  cy.get("button").contains("Click here to sign in").click();

  cy.get('@login').its('request.body').should('eql', { username: "Lachlan", password: "secret-password" })
  cy.contains("Hello, Lachlan");
});
```
\begin{center}
Asserting post data is as expected.
\end{center}

Again, all in one block - looking good!

Mock Service Work and Cypress can do a lot of other things, like respond with specific HTTP codes, so you can easily simulated a failed request, too. This is where these approaches really shine compared to the using `jest.mock` to mock `axios`. Let's add another test for this exact case:

```js
describe('login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('successfully authenticates', async () => {
    // ...
  })

  it('handles incorrect credentials', async () => {
    const error = 'Error: please check the details and try again' 
    server.use(
      rest.post('/login', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({ error })
        )
      })
    )

    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText(error)
  })
})
```
\begin{center}
A test for a failed request.
\end{center}

The Cypress version is included in the final source code. 

It's easy to extend the mock server on a test by test basis, or add additional `cy.intercept()` calls. Writing these two tests using `jest.mock` to mock `axios` would be very messy!

Another very cool feature about `msw` is you can use it in a browser during development. It isn't showcased here, but a good exercise would be to try it out and experiment. Can you use the same endpoint handlers for both tests and development?

## Conclusion

This chapter introduces various strategies for testing HTTP requests in your components. We saw the advantage of mocking `axios` and using a real Pinia store, as opposed to mocking the Vuex store. We then moved one layer lower, mocking the actual server with `msw`. This can be generalized - the lower the mock in the dependency chain, the more confidence you can be in your test suite.

Tests `msw` is not enough - you still need to test your application against a real server to verify everything is working as expected. Tests like the ones described in this chapter are still very useful - they run fast and are very easy to write. I tend to use testing-library and `msw` as a development tool - it's definitely faster than opening a browser and refreshing the page every time you make a change to your code.

## Exercises

- Trying using `msw` in a browser. You can use the same mock endpoint handlers for both your tests and development.
- Explore `msw` more and see what other interesting features it offers.

\pagebreak
