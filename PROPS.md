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

This idea comes in many forms; another is "data driven interfaces". Basically, your UI should be a function of your data. Given X data, your UI should be Y. In computer science, this is referred to as *determinism*. Another name for this a *pure* system. Take the `sum` function. It is a *pure* function:

```js
function sum(a, b) {
  return a + b
}
```
\begin{center}
A simple sum function. It's a pure function.
\end{center}

Given the same value for `a` and `b`, you always get same result. The result is pre-determined. It's *deterministic*. An example of an impure function would be this:

```js
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```
\begin{center}
A impure function - it has a side effect. Not ideal, but a necessary evil to get things done.
\end{center}

This is impure because it relies on an external resource: depending on what is in the database, we may get a different result. It's *unpredictable*.

So, how does this relate to `props`? Well, if you think of a component as a function and the `props` as the arguments, you'll realize that given the same `props`, your UI will be deterministic, and since you control the `props`, it's easy to test. 

## The Basics

You can declare props in a few ways. We will work with the `<message>` component in this section.

```html
<template>
  <div :class="variant">Message</div>
</template>

<script>
export default {
  const Message = {
    // can be 'success', 'warning', 'error'
    props: ['variant']
  }
}
</script>
```
\begin{center}
Declaring a variant prop with the inferior array syntax.
\end{center}

I'd recommend avoiding the array of strings syntax. Using the object syntax makes it more understandable. 

```js
props: {
  variant: {
    type: String,
    required: true
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

Let's start writing a test. We've specified the `variant` prop is `required`. We should test what happens if they don't provide it, too, though, just be sure. Karma favors defensive programmers.

We want to test *inputs* and *outputs* - the `variant` prop is our input, and what is renders is the output. The first test is easy:

```js
import { mount } from '@vue/test-utils'
import Message from './Message.vue'

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

The next is a little tricky - there is no real graceful way to fail, since we don't have a `default` value for the `variant` prop. What we really want to do is raise an error. For this we can use a `validator`.

## Adding a Validator

Let's update the `variant` prop to have a simple validator:

```html
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
```
\begin{center}
If the variant is not valid, we throw an error.
\end{center}

Now we will get an error if an invalid prop is passed. An alternative would be just to return `false` instead of throwing an error - this will just give you a warning in the console. Personally, I like to my apps to fail loudly when they aren't working properly. 

How do we test this? If we want to cover all the possibilities, we need 4 tests; one for each `variant` type, and one for an invalid type. 

Unlike our previous test, where we asserted against the `class`, this one has little to do with our UI - we already have a test checking if the `variant` prop is bound to the `<div>` correctly. 

I prefer to test prop validators in isolation. The test run faster, and since validators are generally pure functions, they are easy to test.

First we need to refactor `<message>` a little to separate the validator from the component:

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

Great, `validateVariant` is now exported and easily testable:

```js
import { mount } from '@vue/test-utils'
import Message, { validateVariant } from './Message.vue'

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

This might not seem significant, but it's actually a big improvement. We have complete test coverage, and we can be confident the `<message>` component can only be used with valid a `variant`.

## Separation of Concerns

You may be wondering; are we *really* testing the `variant` prop here? The answer is no - not really! We added a test for our business logic - our organization only supports three different button types. 

There is an important distinction here. The first tests, where we use `classes()`, is a UI test; we are verifying that the UI layer is working correctly. 

The second test, for `variant`, is business logic. This concept is known as *separation of concerns*. We will revisit this throughout the book. 

If you want to know if something is part of the UI or business logic, ask yourself this: "if I switched to React, would I be able to re-use this test?". 

In this case, you could absolutely reuse the validator test; this is tied to your business logic. The `classes()` test would have to be rewritten, because React and it's testing libraries have a different API. 

Ideally, you don't want your business logic to be coupled to your framework of choice; frameworks come and go, but it's unlikely the problems your business is solving will change. 

I have seen poor separation of concerns costs companies tens of thousands of dollars; they get to a point where adding new features is risky and slow, because their core business problem is too tightly coupled to the UI. 

Understanding the difference between the two, and how to correctly structure your applications is the difference good engineers and great engineers.

## Another Example

Let's see another example of testing props. This examples uses the `<navbar>` component, which looks like this:

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

Before even seeing the test, it is clear we need *two* tests to cover all the use cases. The reason this is immediately clear is the `authenticated` prop is a `Boolean`, which only has two possible values. The test isn't especially interesting (but the discussion that follows is!):

```js
describe('navbar', () => {
  it('shows logout when authenticated is true', () => {
    const wrapper = mount(navbar, {
      props: {
        authenticated: true
      }
    })

    expect(wrapper.find('button').text()).toBe('Logout')
  })

  it('shows login by default', () => {
    const wrapper = mount(navbar)

    expect(wrapper.find('button').text()).toBe('Login')
  })
})
```
\begin{center}
Testing the navbar's behavior for all value of authenticated.
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

If you haven't seen it, the *factory* pattern is where you define a function that returns a new instance of something else - usually a class or another function - when called. I named it `navbarFactory` to make it's purpose clear. Real life factories make boxes and shoes. This factory makes `<navbar`> components. Go figure.

Anyway - I like this version of the test better. I also removed the newline between the mounting the component and making the assertion. I usually don't leave any new lines in my tests when they are this simple. When they get more complex, I like to leave some newlines. This is just my personal approach. What's important is you are writing tests.

Although we technically have covered all the cases, I like to add the third case: where `authenticated` is explicitly set to `false`.

```js
describe('navbar', () => {
  function navbarFactory(props) {
    return mount(navbar, {
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

Let's revisit the idea of separation of concerns; is this a UI or business logic? If we moved framework, could we re-use this test? 

The answer is *no* - we'd need to write a new test (to work with React + it's testing ecosystem). This is fine - it just means this logic is not really part of our core business logic. Nothing to extract.

## The real test: Does it refactor?

We can do a little sanity check and make sure our tests are not testing implementation details (how things work) but rather, *what things do*, also knows as "inputs and outputs". Remember, our UI is a function of our data - we should be testing that the correct UI is rendered based on the data, and not caring too much about how the logic is actually implemented. 

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
Asserting against the render HTML, not a specific element.
\end{center}

By using `html()` and `toContain()`, we are focusing on what text is rendered - not the specific tag, which I consider an implementation detail. I understand some people might disagree with this point - `<button>` and `<a>` *do* have different behaviors - but from a user point of view, this is not often the case. 

In most systems, the user doesn't really mind if they click a `<button>` with `Login` or a `<a>` with `Login` - they just want to log in. In a more realistic test, you would probably simulate a click event on the element. Whether it's a button or an anchor tag, the same thing should happen - the user is logged out.

This analysis might not be true for every scenario. I think each system is different, and you should do what makes the most sense for your business and application. My preference is to assert against `html` using `toContain()`, rather than using `find` and `text()`.

## Conclusion

This chapter discussed some Vue Test Utils APIs, including `classes()`, `html()`, `find()` and `text()`. We also discussed using a factory function to make similar tests more concise, and the idea of the data driving the UI.

Finally, we dived into the concept of *separation of concerns*, and how it can make your business logic code outlast your framework. Finally, we saw how refactoring code and seeing how the tests pass or fail can potentially reveal tightly coupled code, and some alternative ways to test DOM content. 

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
