# Patterns for Testing Props

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In this section we explore `props`, and the kinds of tests you might want to consider writing. This leads into a much more fundamental and important topic; drawing a clear line between business logic and UI, also known as *separation of concerns*, and how your tests can help make this distinction clear.

Consider one of the big ideas behind frameworks like Vue and React:

\begin{center}
Your user interface is a function of your data.
\end{center}

This idea comes in many forms; another is "data driven interfaces". Basically, your user interface (UI) should be determined by the data present. Given X data, your UI should be Y. In computer science, this is referred to as *determinism*. Take this `sum` function for example:

```js
function sum(a, b) {
  return a + b
}
```
\begin{center}
A simple sum function. It's a pure function.
\end{center}

When called with the same value for `a` and `b`, you always get same result. The result is pre-determined. It's *deterministic*. An example of an impure function would be this:

```js
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```
\begin{center}
A impure function - it has a side effect. Not ideal, but necessary for most systems to do anything useful.
\end{center}

This is *not* a pure function because it relies on an external resource - in this case an API and a database. Depending on what is in the database when it is called, we might get a different result. It's *unpredictable*.

How does this relate to `props`? If you think of a component as a function and the `props` as the arguments, you'll realize that given the same `props`, the component will always render the same thing. It's output is deterministic. Since you decide what `props` are passed to the component, it's easy to test, since we know all the possible states the component can be in.

## The Basics

You can declare props in a few ways. We will work with the `<message>` component for this example. You can find it under `examples/props/message.vue`.

```html
<template>
  <div :class="variant">Message</div>
</template>

<script>
export default {
  // can be 'success', 'warning', 'error'
  props: ['variant']
}
</script>
```
\begin{center}
Declaring a variant prop with the inferior array syntax.
\end{center}

In this example we declare props using the array syntax: `props: ['variant']`. I recommend avoiding the array syntax. Using the object syntax gives the reader more insight into the type of values `variant` can take:

```js
export default {
  props: {
    variant: {
      type: String,
      required: true
    }
  }
}
```
\begin{center}
Declaring a variant prop with the superior object syntax.
\end{center}

If you are using TypeScript, even better - create a type, for example `type Variant = 'success' | 'warning' | 'error'`. 

```js
props: {
  variant: {
    type: String as () => Variant,
    required: true
  }
}
```
\begin{center}
A strongly typed variant prop using TypeScript.
\end{center}

In our `<message>` example, we are working with regular JavaScript, so we cannot specify specific strings for the `variant` props like you can in TypeScript. There are some other patterns we can use, though.

We have specified the `variant` prop is `required`, and we would like to enforce a specific subset of string values that it can receive. Vue allows us to validate props using a `validator` key. It works like this:

```js
export default {
  props: {
    variant: {
      validator: (val) => {
        // if we return true, the prop is valid.
        // if we  return false, a runtime warning will be shown.
      }
    }
  }
} 
```
\begin{center}
Prop validators are functions. If they return false, Vue will show a warning in the console.
\end{center}

Prop validators are like the `sum` function we talked about earlier. They are pure functions! That means they are easy to test - given X prop, the validator should return Y result. 

Before we add a validator, let's write a simple test for the `<message>` component. We want to test *inputs* and *outputs*. In the case of `<message>`, the `variant` prop is the input, and what is rendered is the output. We can write a test to assert the correct class is applied using Vue Test Utils and the `classes()` method:

```js
import { mount } from '@vue/test-utils'
import Message from './message.vue'

describe('Message', () => {
  it('renders variant correctly when passed', () => {
    const wrapper = mount(Message, {
      props: {
        variant: 'success'
      }
    })

    expect(wrapper.classes()).toContain('success')
  })
})
```
\begin{center}
Testing the prop is applied to the class.
\end{center}

This verifies everything works as expected when a valid `variant` prop is passed to `<message>`. What about when an invalid `variant` is passed? We want to prohibit using the `<message>` component with a valid `variant`. This is a good use case for a `validator`.

## Adding a Validator

Let's update the `variant` prop to have a simple validator:

```js
export default {
  props: {
    variant: {
      type: String,
      required: true,
      validator: (variant) => {
        if (!['success', 'warning', 'error'].includes(variant)) {
          throw Error(
            `variant is required and must` + 
            `be either 'success', 'warning' or 'error'.` +
            `You passed: ${variant}`
          )
        }

        return true
      }
    }
  }
}
```
\begin{center}
If the variant is not valid, we throw an error.
\end{center}

Now we will get an error if an invalid prop is passed. An alternative would be just to return `false` instead of throwing an error - this will just give you a warning in the console via `console.warn`. Personally, I like loud and clear errors when a component isn't used correctly, so I chose to throw an error.

How do we test the validator? If we want to cover all the possibilities, we need 4 tests; one for each `variant` type, and one for an invalid type. 

I prefer to test prop validators in isolation. The test run faster, and since validators are generally pure functions, they are easy to test.

To allow testing the validator is isolation, we need to refactor `<message>` a little to separate the validator from the component:

```html
<template>
  <div :class="variant">Message</div>
</template>

<script>
export function validateVariant(variant) {
  if (!['success', 'warning', 'error'].includes(variant)) {
    throw Error(
      `variant is required and must` + 
      `be either 'success', 'warning' or 'error'.` +
      `You passed: ${variant}`
    )
  }

  return true
}

export default {
  props: {
    variant: {
      type: String,
      required: true,
      validator: validateVariant
    }
  }
}
</script>
```
\begin{center}
Exporting the validator separately to the component.
\end{center}

Great, `validateVariant` is now exported separately and easy to test:

```js
import { mount } from '@vue/test-utils'
import Message, { validateVariant } from './message.vue'

describe('Message', () => {
  it('renders variant correctly when passed', () => {
    // omitted for brevity ...
  })

  it('validates valid variant prop', () => {
    ;['success', 'warning', 'error'].forEach(variant => {
      expect(() => validateVariant(variant)).not.toThrow()
    })
  })

  it('throws error for invalid variant prop', () => {
    expect(() => validateVariant('invalid')).toThrow()
  })
})
```
\begin{center}
Testing all the cases for the validator.
\end{center}

Simply making the `validateVariant` a separate function that is exported might seem like a small change, but it's actually a big improvement. By doing so, we were able to write tests for `validateVariant` with ease. We can be confident the `<message>` component can only be used with valid a `variant`.

If the developer passes an invalid prop, they get a nice clear message in the console:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/props-error.png}
  \caption{Error! Passed variant is invalid.}
  \label{fig}
\end{figure}

## Separation of Concerns

We have written two different types of tests. The first is a UI test - that's the one where we make an assertions against the `classes()`. The second is for the validator. It tests business logic. 

To make this more clear, imagine your company specializes in component libraries. You design system specifies support for three message variants: success, warning and error. In this example, we are working on our Vue integration. In the future, you might build React and Angular integration, too. All three of the integrations could make use of the `validateVariant` function and test. It's the core business logic.

This distinction is important. When we use Vue Test Utils methods (such as `mount()` and `classes()`) we are verifying that the UI layer is working correctly. The test for `validateVariant` is for our business logic. This concept is known as *separation of concerns*. We will revisit this throughout the book. 

If you want to know if something is part of the UI or business logic, ask yourself this: "if I switched to React, would I be able to re-use this test?". 

In this case, you could absolutely reuse the validator test; this is tied to your business logic. The `classes()` test would have to be rewritten, because React and it's testing libraries that have a different API. 

Ideally, you don't want your business logic to be coupled to your framework of choice; frameworks come and go, but it's unlikely the problems your business is solving will change significantly.

I have seen poor separation of concerns costs companies tens of thousands of dollars; they get to a point where adding new features is risky and slow, because their core business problem is too tightly coupled to the UI. Rewriting the UI means rewriting the business logic.

Understanding the difference between the two, and how to correctly structure your applications is the difference good engineers and great engineers.

## Another Example

Let's see another example of testing props. This examples uses the `<navbar>` component. You can find it in `examples/props/navbar.vue`. It looks like this:

```html
<template>
  <button v-if="authenticated">Logout</button>
  <button v-if="!authenticated">Login</button>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
The navbar component. It has one prop, authenticated. It is false by default.
\end{center}

Before even seeing the test, it is clear we need *two* tests to cover all the use cases. The reason this is immediately clear is the `authenticated` prop is a `Boolean`, which only has two possible values. The test is not especially interesting (but the discussion that follows is!):

```js
import { mount } from '@vue/test-utils'
import Navbar from './navbar.vue'

describe('navbar', () => {
  it('shows logout when authenticated is true', () => {
    const wrapper = mount(Navbar, {
      props: {
        authenticated: true
      }
    })

    expect(wrapper.find('button').text()).toBe('Logout')
  })

  it('shows login by default', () => {
    const wrapper = mount(Navbar)

    expect(wrapper.find('button').text()).toBe('Login')
  })
})
```
\begin{center}
Testing the navbar behavior for all value of authenticated.
\end{center}

The only thing that changes based on the value of `authenticated` is the button text. Since the `default` value is `false`, we don't need to pass it as in `props` in the second test.

What if we refactored this using the factory pattern?

```js
describe('navbar', () => {
  function navbarFactory(props) {
    return mount(navbar, {
      props
    })
  }

  it('shows login authenticated is true', () => {
    const wrapper = navbarFactory({ authenticated: true })
    expect(wrapper.find('button').text()).toBe('Logout')
  })

  it('shows logout by default', () => {
    const wrapper = navbarFactory()
    expect(wrapper.find('button').text()).toBe('Login')
  })
})
```
\begin{center}
Concise tests with the factory pattern.
\end{center}

If you haven't seen it before, the *factory* pattern is where you define a function that returns a new instance of something else - usually a class or another function - when called. I named it `navbarFactory` to make it's purpose clear. Real life factories make boxes and shoes. This factory makes `<navbar`> components. Go figure.

I like this version of the test better. I also removed the new line between the mounting the component and making the assertion. I usually don't leave any new lines in my tests when they are this simple. When they get more complex, I like to leave some space. This is just my personal approach. What's important is you are writing tests.

Although we technically have covered all the cases, I like to add the third case: where `authenticated` is explicitly set to `false`.

```js
describe('navbar', () => {
  function navbarFactory(props) {
    return mount(Navbar, {
      props
    })
  }

  it('shows login authenticated is true', () => {
    // ...
  })

  it('shows logout by default', () => {
    // ...
  })

  it('shows login when authenticated is false', () => {
    const wrapper = navbarFactory({ authenticated: false })
    expect(wrapper.find('button').text()).toBe('Login')
  })
})
```
\begin{center}
Adding a third test to be explicit.
\end{center}

This, of course, passes. I really like the symmetry the three tests exhibit, showing all three cases in such a concise manner. 

Let's revisit the idea of separation of concerns; is this a UI or business logic test? If we moved framework, could we re-use this test? 

The answer is *no* - we'd need to write a new test (to work with React + it's testing ecosystem). This is fine - it just means this logic is not really part of our core business logic. Nothing to extract.

## The real test: Does it refactor?

We can do a little sanity check and make sure our tests are not testing implementation details. Implementation details refers to *how* something works. When testing, we don't care about the specifics of how something works. Instead, we care about *what it does*, and if it does it correctly. Remember, - we should be testing that we get the expected output based on given inputs. In this case, we want to test that the correct text is rendered based on the data, and not caring too much about how the logic is actually implemented. 

We can validate this by refactoring the `<navbar>` component. As long as the tests continue to past, we can be confident they are resilient to refactors and are testing behaviors, not implementation details.

Let's refactor `<navbar>`:

```html
<template>
  <button>
    {{ `${authenticated ? 'Logout' : 'Login'}` }}
  </button>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
Refactoring navbar. The behavior is still the same!
\end{center}

Everything still passes! Our tests are doing what they are supposed to be. Or are they? What if we decide we would like to use a `<a>` tag instead of a `<button>`?

```html
<template>
  <a>{{ `${authenticated ? 'Logout' : 'Login'}` }}</a>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
Using an anchor tag instead of a button.
\end{center}

Obviously in a real system a `href` property would be required and change depending on `authenticated`, but that isn't what we are focusing on here. 

The tests are now *failing*. The behavior hasn't really changed, though, has it? Some people might argue it *has* - buttons normally don't take you to other pages, but anchor tags do. My personal preference here would be to change my test as follows:

```js
it('shows login authenticated is true', () => {
  const wrapper = navbarFactory({ authenticated: true })
  expect(wrapper.html()).toContain('Logout')
})
```
\begin{center}
Asserting against the rendered HTML, not a specific element.
\end{center}

By using `html()` and `toContain()`, we are focusing on what text is rendered - not the specific tag. I understand some people might disagree with this refactor, because `<button>` and `<a>` *do* have different behaviors - but from a user point of view, this is not often the case. 

In most systems, the user doesn't really mind if they click a `<button>` with `Login` or a `<a>` with `Login` - they just want to log in. In a more realistic test, you would probably simulate a click event on the element. Whether it's a button or an anchor tag, the same thing should happen - the user is logged out.

This might not be true for every scenario. I think each system is different, and you should do what makes the most sense for your business and application. My preference is usually to assert against `html()` using `toContain()`, rather than using `find()` and `text()`.

## Conclusion

This chapter discussed some Vue Test Utils APIs, including `classes()`, `html()`, `find()` and `text()`. We also discussed using a factory function to make similar tests more concise, and the idea of the data driving the UI.

Finally, we dived into the concept of *separation of concerns*, and how it can make your business logic code outlast your framework. Finally, we saw how refactoring code and seeing how the tests pass or fail can potentially reveal tightly coupled code, and some alternative ways to test DOM content. 

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
