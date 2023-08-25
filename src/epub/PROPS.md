# Patterns for Testing Props

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code). 

In this section we explore `props`, and the kind of tests you might want to consider writing. This leads into a much more fundamental and important topic; drawing a clear line between business logic and UI, also known as *separation of concerns*, and how your tests can help make this distinction clear.

Consider one of the big ideas behind frameworks like Vue and React:

\begin{center}
Your user interface is a function of your data.
\end{center}

This idea comes in many forms; another is "data driven interfaces". Basically, your user interface (UI) should be determined by the data present. Given X data, your UI should be Y. In computer science, this is referred to as *determinism*. Take this `sum` function for example:

```ts
function sum(a, b) {
  return a + b
}
```
\begin{center}
A simple sum function. It's a pure function.
\end{center}

When called with the same value for `a` and `b`, you always get same result. The result is pre-determined. It's *deterministic*. An example of an impure function would be this:

```ts
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```
\begin{center}
A impure function - it has a side effect. Not ideal, but necessary for most systems to do anything useful.
\end{center}

This is *not* a pure function because it relies on an external resource - in this case an API and a database. Depending on what is in the database when it is called, we might get a different result. It's *unpredictable*.

How does this relate to `props`? Think of a component that decides what to render based on it's `props` (don't worry about `data`, `computed` or `setup` for now - but the same ideas apply, as you'll see throughout the book). If you think of a component as a function and the `props` as the arguments, you'll realize that given the same `props`, the component will always render the same thing. It's output is deterministic. Since you decide what `props` are passed to the component, it's easy to test, since we know all the possible states the component can be in.

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

```ts
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

If you are using TypeScript, even better - create a type:

```ts
type Variant = 'success' | 'warning' | 'error'

export default {
  props: {
    variant: {
      type: String as () => Variant,
      required: true
    }
  }
}
```
\begin{center}
A strongly typed variant prop using TypeScript.
\end{center}

In our `<message>` example, we are working with regular JavaScript, so we cannot specify specific strings for the `variant` props like you can in TypeScript. There are some other patterns we can use, though.

We have specified the `variant` prop is `required`, and we would like to enforce a specific subset of string values that it can receive. Vue allows us to validate props using a `validator` key. It works like this:

```ts
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

Prop validators are like the `sum` function we talked about earlier in that they are pure functions! That means they are easy to test - given X prop, the validator should return Y result. 

Before we add a validator, let's write a simple test for the `<message>` component. We want to test *inputs* and *outputs*. In the case of `<message>`, the `variant` prop is the input, and what is rendered is the output. We can write a test to assert the correct class is applied using Testing Library and the `classList` attribute:

```ts
import { render, screen } from '@testing-library/vue'
import Message, { validateVariant } from './message.vue'

describe('Message', () => {
  it('renders variant correctly when passed', () => {
    const { container } = render(Message, {
      props: {
        variant: 'success'
      }
    })

    expect(container.firstChild.classList)
      .toContain('success')
  })
})
```
\begin{center}
Testing the prop is applied to the class.
\end{center}

This verifies everything works as expected when a valid `variant` prop is passed to `<message>`. What about when an invalid `variant` is passed? We want to prohibit using the `<message>` component with a valid `variant`. This is a good use case for a `validator`.

## Adding a Validator

Let's update the `variant` prop to have a simple validator:

```ts
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

I prefer to test prop validators in isolation. Since validators are generally pure functions, they are easy to test. There is another reason I test prop validators is isolation too, which we will talk about after writing the test.

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

```ts
import { render, screen } from '@testing-library/vue'
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

![Error! Passed variant is invalid.(props-error.png)

## Key Concept: Separation of Concerns

We have written two different types of tests. The first is a UI test - that's the one where we make an assertions against `classList`. The second is for the validator. It tests business logic. 

To make this more clear, imagine your company specializes in design systems. You have some designers who probably use Figma or Sketch to design things like buttons and messages. 

They have decided to support for three message variants: success, warning and error. You are a front-end developer. In this example, you are working on the Vue integration - you will write Vue components that apply specific classes, which use the CSS you provided by the designers. 

In the future, you also need to build React and Angular components using the same CSS and guidelines. All three of the integrations could make use of the `validateVariant` function and test. It's the core business logic.

This distinction is important. When we use Testing Library methods (such as `render`) and DOM APIs (like `classList`) we are verifying that the Vue UI layer is working correctly. The test for `validateVariant` is for our business logic. These differences are sometimes called *concerns*. One piece of code is concerned with the UI. The other is concerned with the business logic. 

Separating them is good. It makes your code easier to test and maintain. This concept is known as *separation of concerns*. We will revisit this throughout the book. 

If you want to know if something is part of the UI or business logic, ask yourself this: "if I switched to React, would I be able to re-use this code and test?". 

In this case, you could reuse the validator and it's test when you write the React integration. The validator is concerned with the business logic, and doesn't know anything about the UI framework. Vue or React, we will only support three message variants: success, warning and error. The component and component test (where we assert using `classes()`) would have to be rewritten using a React component and React testing library.

Ideally, you don't want your business logic to be coupled to your framework of choice; frameworks come and go, but it's unlikely the problems your business is solving will change significantly.

I have seen poor separation of concerns costs companies tens of thousands of dollars; they get to a point where adding new features is risky and slow, because their core business problem is too tightly coupled to the UI. Rewriting the UI means rewriting the business logic. 

## Separation of Concerns - Case Study

One example of poor separation of concerns costing an organzation was an application I worked on for an electrical components supplier. They had an application customers would use to get an approximate quote for the price of components. The ordering process was quite complex - you would go through a form with several steps, and the values from the previous step would impact the fields on the next step.

The application was written using jQuery (which is not bad. No framework is bad - only if they are used incorrectly). All of the business logic was mixed in with the UI logic (this is the bad part). They had a quantity based discount model - "If purchasing more than 50 resistors, then apply X discount, otherwise Y" - this kind of thing. They decided to move to something a bit more modern - the UI was very dated, and wasn't mobile friendly at all. The complexity of the jQuery code was high and the code was a mess. 

Not only did I need to rewrite the entire UI layer (which was what I was paid to do), but I ended up having to either rewrite or extract the vast majority of the business logic from within the jQuery code, too. This search and extract mission made the task much more difficult and risky than it should have been - instead of just updating the UI layer, I had to dive in and learn their business and pricing model as well (which ended up taking a lot more time and costing a lot more than it probably should have).

Here is a concrete example using the above real-world scenario. Let's say a resistor (a kind of electrical component) costs $0.60. If you buy over 50, you get a 20% discount. The jQuery code-base looked something like this:

```ts
const $resistorCount = $('#resistors-count')

$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  const totalCost = 0.6 * amount
  const $price = $("#price")
  if (amount > 50) {
    $price.value(totalCost * 0.8)
  } else {
    $price.value(totalCost)
  }
})
```

You need to look really carefully to figure out where the UI ends and the business starts. In this scenario, I wanted to move to Vue - the perfect tool for a highly dynamic, reactive form. I had to dig through the code base and figure out this core piece of business logic, extract it, and rewrite it with some tests (of course the previous code base had no tests, like many code bases from the early 2000s). This search-extract-isolate-rewrite journey is full of risk and the chance of making a mistake or missing something is very high! What would have been much better is if the business logic and UI had be separated:

```ts
const resistorPrice = 0.6
function resistorCost(price, amount) {
  if (amount > 50) {
    return price * amount * 0.8
  } else {
    return price * amount
  }
}

$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  $("#price").value = resistorCost(resistorPrice, amount)
})
```

The second is far superior. You can see where the business logic ends and the UI begins - they are literally separated in two different functions. The pricing strategy is clear - a discount for any amount greater than 50. It's also very easy to test the business logic in isolation. If the day comes you decide your framework of choice is no longer appropriate, it's trivial to move to another framework - your business logic unit tests can remain unchanged and untouched, and hopefully you have some end-to-end browser tests as well to keep you safe.

Moving to Vue is trivial - no need to touch the business logic, either:

```html
<template>
  <input v-model="amount" />
  <div>Price: {{ totalCost }}</div>
</template>

<script>
import { resistorCost, resistorPrice } from './logic.js'

export default {
  data() {
    return {
      amount: 0
    }
  },
  computed: {
    totalCost() {
      return resistorCost(resistorPrice, this.amount)
    }
  }
}
</script>
```

Understanding and identifying the different concerns in a system and correctly structuring applications is the difference good engineers and great engineers.

## Another Example

Enough design philosophy for now. Let's see another example related to props. This examples uses the `<navbar>` component. You can find it in `examples/props/navbar.vue`. It looks like this:

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

```ts
import { render, screen } from '@testing-library/vue'
import Navbar from './navbar.vue'

describe('navbar', () => {
  it('shows logout when authenticated is true', () => {
    render(Navbar, {
      props: {
        authenticated: true
      }
    })

    // getByText will throw an error if it cannot find the element.
    screen.getByText('Logout')
  })

  it('shows login by default', () => {
    render(Navbar)

    screen.getByText('Login')
  })
})
```
\begin{center}
Testing the navbar behavior for all values of authenticated.
\end{center}

The only thing that changes based on the value of `authenticated` is the button text. Since the `default` value is `false`, we don't need to pass it as in `props` in the second test.

We can refactor a little with a `renderNavbar` function:

```ts
describe('Navbar', () => {
  function renderNavbar(props) {
    render(Navbar, {
      props
    })
  }

  it('shows login authenticated is true', () => {
    renderNavbar({ authenticated: true })
    screen.getByText('Logout')
  })

  it('shows logout by default', () => {
    renderNavbar()
    screen.getByText('Login')
  })
})
```
\begin{center}
More concise tests.
\end{center}

I like this version of the test better. It might seem a little superficial for such a simple test, but as your components become more complex, having a function to abstract away some of the complexity can make your tests more readable. 

I also removed the new line between the rendering the component and making the assertion. I usually don't leave any new lines in my tests when they are this simple. When they get more complex, I like to leave some space - I think it makes it more readable. This is just my personal approach. The important thing is not your code style, but that you are writing tests.

Although we technically have covered all the cases, I like to add the third case: where `authenticated` is explicitly set to `false`.

```ts
describe('navbar', () => {
  function renderNavbar(props) {
    render(Navbar, {
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
    renderNavbar({ authenticated: false })
    screen.getByText('Login')
  })
})
```
\begin{center}
Adding a third test to be explicit.
\end{center}

This, of course, passes. I really like the symmetry the three tests exhibit, showing all three cases in such a concise manner. 

Let's revisit the idea of separation of concerns; is this a UI test or business logic test? If we moved framework, could we re-use this test? 

The answer is *no* - we'd need to write a new test (to work with React and it's Testing Library integration). This is fine - it just means this part of our codebase is part of the UI layer, not our core business logic. Nothing to extract.

## The real test: Does it refactor?

We can do a little sanity check and make sure our tests are not testing implementation details. Implementation details refers to *how* something works. When testing, we don't care about the specifics of how something works. Instead, we care about *what it does*, and if it does it correctly. Remember, we should be testing that we get the expected output based on given inputs. In this case, we want to test that the correct text is rendered based on the data, and not caring too much about how the logic is actually implemented. 

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

Obviously in a real system a `href` property would be required and change depending on `authenticated`, but that isn't what we are focusing on here. It still passes. Great news! Our tests survived two refactors - this means we are testing the behavior, not the implementation details, which is good.

## Conclusion

This chapter discussed some techniques for testing props. We also saw how to use Testing Library's `render` method to test components. We touched on the concept of *separation of concerns*, and how it can make your business logic more testable and your applications more maintainable. Finally, we saw how tests can let us refactoring code with confidence.

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code).

