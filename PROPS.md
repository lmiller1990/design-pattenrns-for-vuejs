## Patterns for Testing Props

In this section we explore `props`, and the kinds of tests you might want to consider writing. This leads into a much more fundamental and important topic; drawing a clear line between business logic and UI, also known as *separation of concerns*, and how your tests can help make this distinction clear.

Consider one of the big ideas behind frameworks like Vue and React:

> Your user interface is a function of your data.

This idea comes in many forms; another is "data driven interfaces". Basically, your UI should be a function of your data. Given X data, your UI should be Y. In computer science, this is referred to as *determinism*. Another name for this a *pure* system. Take the `sum` function. It is a *pure* function:

```js
function sum(a, b) {
  return a + b
}
```

Given the same value for `a` and `b`, you always get same result. The result is pre-determined. It's *deterministic*. An example of an impure function would be this:

```js
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```

This is impure because it relies on an external resource: depending on what is in the database, we may get a different result. It's *unpredictable*.

So, how does this relate to `props`? Well, if you think of a component as a function and the `props` as the arguments, you'll realize that given the same `props`, your UI will be deterministic, and since you control the `props`, it's easy to test. 

## The Basics

You can declare props in a few ways. We will work with the `<Message>` component in this section.

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

I'd recommend avoiding the array of strings syntax. Using the object syntax makes it more understandable. If you are using TypeScript, even better - create a type, for example `type Variant = 'success' | 'warning' | 'error'`. 

```js
props: {
  variant: {
    type: String,
    required: true
  }
}
```

Let's start writing a test. We've specified the `variant` prop is `required`. We should test what happens if they don't provide it, too, though, just be sure. Remember, we want to test inputs and outputs - the `variant` prop is our input, and what is renders is the output. The first test is easy:

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

Now we will get an error if an invalid prop is passed. How do we test this? If we want to cover all the possibilities, we need 4 tests; one for each `variant` type, and one for an invalid type. Unlike our previous test, where we asserted against the `class`, this one has little to do with our UI - we already have a test checking if the `variant` prop is bound to the `<div>` correctly. 

> TIP: Test props validators in isolation. The test run faster, and since validators are generally pure functions, they are easy to test.

First we need to refactor `<Message>` a little to separate the validator from the component:

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

Great, `validateVariant` is now exported and easily testable:

```js
import { mount } from '@vue/test-utils'
import Message, { validateVariant } from './Message.vue'

describe('Message', () => {
  // omitted for brevity ...

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

This might not seem significant, but it's actually a big improvement. We have complete test coverage, and we can be confident the `<Message>` component can only be used with valid a `variant`

# Separation of Concerns

You may be wondering; are we *really* testing the `variant` prop here? The answer is no - not really! We added a test for our business logic - our organization only supports three different button types. There is an important distinction here. The first tests, where we use `classes()`, is a UI test; we are verifying that the UI layer is working correctly. The second test, for `variant`, is business logic. This concept is known as *separation of concerns*. We will revisit this throughout the book. 

If you want to know if something is part of the UI or business logic, ask yourself this: "if I switched to React, would I be able to re-use this test?". In this case, you could absolutely reuse the validator test; this is tied to your business logic. The `classes()` test would have to be rewritten, because React and it's testing libraries have a different API. Ideally, you don't want your business logic to be coupled to your framework of choice; frameworks come and go, but it's unlikely the problems your business is solving will change. 

I have seen poor separation of concerns costs companies tens of thousands of dollars; they get to a point where adding new features is risky and slow, because their core business problem is too tightly coupled to the UI. Understanding the difference between the two, and how to correctly structure your applications is the difference good engineers and great engineers.

## Another Example

Let's see another example of testing props. This examples uses the `<Navbar>` component, which looks like this:

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

Before even seeing the test, it is clear we need *two* tests to cover all the use cases. The reason this is immediately clear is the `authenticated` prop is a `Boolean`, which only has two possible values. The test isn't especially interesting (but the discussion that follows is!):

```js
describe('Navbar', () => {
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

The only thing that changes based on the value of `authenticated` is the button text. Since the `default` value is `false`, we don't need to pass it as in `props` in the second test.

What if we refactored this using the factory pattern?

```js
describe('Navbar', () => {
  function navbarFactory(props) {
    return mount(Navbar, {
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

I like this one better. I usually don't leave any new lines in my tests that only have two lines, but that is just my personal approach. 

Although we technically have covered all the cases, I like to add the third case: where `authenticated` is explicitly set to `false`.

```js
describe('Navbar', () => {
  function navbarFactory(props) {
    return mount(Navbar, {
      props
    })
  }

  // ... 

  it('shows login when authenticated is false', () => {
    const wrapper = navbarFactory({ authenticated: false })
    expect(wrapper.find('button').text()).toBe('Login')
  })
})
```

This, of course, passes. I really like the symmetry here, showing all three cases in such a concise manner. 

Let's revisit the idea of separation of concerns; is this a UI or business logic? If we moved framework, could we re-use this test? The answer is *no* - we'd need to write a new test (to work with React + it's testing ecosystem). This is fine - it just means this logic is not really part of our core business logic. Nothing to extract.

## The real test: Does it refactor?

We can do a little sanity check and make sure our tests are not testing implementation details (how things work) but rather, *what things do*, also knows as "inputs and outputs". Remember, our UI is a function of our data - we should be testing that the correct UI is rendered based on the data, and not caring too much about how the logic is actually implemented. We can validate this by refactoring the `<Navbar>` component. As long as the tests continue to past, we can be confident they are resilient to refactors and are testing behaviors, not implementation details.

Let's refactor `<Navbar>`:

```html{2}
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

Obviously in a real system a `href` property would be required and change depending on `authenticated`, but that isn't what we are focusing on here. The test are now *failing*. The behavior hasn't really changed, though, has it? Some people might argue it *has* - buttons normally don't take you to other pages, but anchor tags do. My personal preference here would be to change my test as follows:

```js {3}
it('shows login authenticated is true', () => {
  const wrapper = navbarFactory({ authenticated: true })
  expect(wrapper.html()).toContain('Logout')
})
```

By using `html()` and `toContain()`, we are focusing on what text is rendered - not the specific tag, which I consider an implementation detail. I understand some people might disagree with this point - `<button>` and `<a>` *do* have different behaviors - but from a user point of view, this is not often the case. In my system, the user doesn't really mind if they click a `<button>` with `Login` or a `<a>` with `Login` - they just want to log in. That said, I think each system is different, and you should do what makes the most sense for your business and application. My preference is to assert against `html` using `toContain()`, rather than using `find` and `text()`.

## Conclusion

This chapter discussed some Vue Test Utils APIs, including `classes()`, `html()`, `find()` and `text()`. We also discussed using a factory function to make similar tests more concise, and the idea of the data driving the UI.

Finally, we dived into the concept of *separation of concerns*, and how it can make your business logic code outlast your framework. Finally, we saw how refactoring code and seeing how the tests pass or fail can potentially reveal tightly coupled code, and some alternative ways to test DOM content. 
