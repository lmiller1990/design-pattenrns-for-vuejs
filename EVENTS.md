# Emitting Events

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

Vue's primary mechanical for passing data *down* to components is `props`. In contrast, when components needs to communicate with another component higher in the hierachy, you do so by *emitting events*, with `$emit` (Options API) and `emit` (Composition API).

Let's see some examples on how this works, and some guidelines we can set to keep things clean and understandable.

## Starting Simple

Here is a very minimal yet perfectly working `<Counter>` component. It's by no means ideal; we will work on improving it by the end of this section.


```html
<template>
  <button id="increment" @click="increment" />
  <button id="submit" @click="$emit('submit', count)" />
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count += 1
    }
  }
}
</script>
```

There are two buttons; one increments a `count`, the other emits a `submit` event with the current count. Let's write a simple test that will let us refactor with the confidence we won't break anything. 

As with the other examples, this one uses Vue Test Utils, but you could really use any testing framework - the important part is that we have a mechanism to let us know if we break something.

```js
import { mount } from '@vue/test-utils'
import Counter from './counter.vue'

describe('Counter', () => {
  it('emits an event with the current count', async () => {
    const wrapper = mount(Counter) 
    await wrapper.find('#increment').trigger('click')
    await wrapper.find('#submit').trigger('click')

    console.log(wrapper.emitted())
  })
})
```

I did a `console.log(wrapper.emitted())` to illustrate how `emitted` works in Vue Test Utils. The output is like this:

```json
{ 
  submit: [ 
    [ 1 ] 
  ] 
}
```

`emitted` is an object - each event is a key, and it maps to an array with an entry for each time the event was emitted. `emit` can have any amount of arguments; if I had written `$emit('submit', 1, 2, 3,)` the output would be:

```json
{ 
  submit: [ 
    [ 1, 2, 3 ] 
  ] 
}
```

Let's add an assertion, before we get onto the main topic: best practices for events.

```js
import { mount } from '@vue/test-utils'
import Counter from './counter.vue'

describe('Counter', () => {
  it('emits an event with the current count', async () => {
    const wrapper = mount(Counter) 

    await wrapper.find('#increment').trigger('click')
    await wrapper.find('#submit').trigger('click')

    expect(wrapper.emitted().submit[0]).toEqual([1])
  })
})
```

## Clean Templates

We discussed previous the ideal of *simple templates*. The same thing applies here; we want to avoid calling `$emit` in the template, where possible. Let's move this to the `<script>` section, where logic belongs:

```html
<template>
  <button id="increment" @click="increment" />
  <button id="submit" @click="submit" />
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    submit() {
      this.$emit('submit', this.count)
    },
    increment() {
      this.count += 1
    }
  }
}
</script>
```

Everything still passes. This points to a *good test*. Good tests are resilient to refactors, since they test inputs and outputs, not implementation details. 

> TIP: Avoid emitting events in templates. Move the logic to the script tag.

Another thing you may have notices is the *name* of the method we created - `submit`. This is a personal preference, but I recommend having a good convention around naming methods. Here are two I've found useful.

1. Name the method that emits the event the same as the event name. If you are doing `$emit('submit')`, you could name the method that calls this `submit`, too. 
2. Name methods that emit events `handleXXX`. In this example, we could name the function `handleSubmit`. The idea is those methods *handle* the user interactions.

The one you choose isn't really important; having a convention is generally a good thing, though.

## Declaring emits 

As of Vue 3, you are able to (and encouraged to) declare the events your component will emit, much like you declare props. 

Failing to do so will give you a warning in the browser console: "Component emitted event "<event name>" but it is neither declared in the emits option nor as an "<event name> prop". 

This can make it easier to understand what your component does, both for other developers, and yourself when you come back to your code-base in six months time.

You can do this in the same way you declare props; using the array of strings syntax:

```js
export default {
  emits: ['submit']
}
```

Or the more verbose but explicit object syntax:

```js
export default {
  emits: {
    submit: (count) => {} 
  }
}
```

If you are using TypeScript, you will get even better type safety, including the types for the payload.

The object syntax also supports *validation*. As an example, we could validate the payload is a number:

```js
export default {
  emits: {
    submit: (count) => {
      return typeof count !== 'string' && !isNaN(count)
    } 
  },
}
```

## More Robust Event Validation

Depending on your application, you may want to have more thorough validation. I tend to favor defensive programming; I don't like taking chances, not matter how unlikely they might seem. 

I also have a strong emphasis on testing, and separation of concerns. With these philosophies in mind, let's extract this validator, make it more robust, and add some tests.

The first step is to move the validation of of the component definition. For brevity, I am just going to export it from the component file, but you could move it to another module entirely (for example, a `validators` module).

```html
<script>
export function submitValidator(count) {
  return typeof count !== 'string' && !isNaN(count)
}

export default {
  emits: {
    submit: submitValidator
  },
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count += 1
    }
  }
}
</script>
```

Another convention is emerging: I like to call event validators `xxxValidator`.

I am also going to make a change to `submitValidator`; the argument *must* be a number; if not, bad things will happen. So instead of waiting for bad things to happen, I am going to throw an error:

```js
export function submitValidator(count) {
  if (typeof count === 'string' || isNaN(count)) {
    throw Error(`
        Count should have been a number.
        Got: ${count}
    `)
  }
  return true
}
```

Since `submitValidator` is just a plain old JavaScript function, and a pure one at that, it's output is solely dependant on it's inputs. This means writing tests is trivial:

```js
describe('submitValidator', () => {
  it('throws and error when count isNaN', () => {
    const actual = () => submitValidator('1')
    expect(actual).toThrow()
  })

  it('returns true when count is a number', () => {
    const actual = () => submitValidator(1)
    expect(actual).not.toThrow()
  })
})
```

A lot of these problems can be partial mitigated with TypeScript. TypeScript won't give you runtime validation though. If you are using an error logging service (like Sentry), throwing an error like this can give you valuable information for debugging.

## With the Composition API 

The `<counter>` example used the Options API; but all the topics discussed here translate to the Composition API fine. 

A good way to see if you are testing inputs and outputs, as opposed to implementation details, is to refactor your component from the Options API to the Composition API, or vice versa; good tests are resilient to refactor. 

Let's see the refactor:

```html
<template>
  <button id="increment" @click="increment" />
  <button id="submit" @click="submit" />
</template>

<script>
export function submitValidator(count) {
  if (typeof count === 'string' || isNaN(count)) {
    throw Error(`
        Count should have been a number.
        Got: ${count}
    `)
  }
  return true
}

import { ref } from 'vue'

export default {
  emits: {
    submit: submitValidator
  },
  setup(props, { emit }) {
    const count = ref(0)

    const increment = () => {
      count.value +=  1
    }
    const submit = () => {
      emit('submit', count.value)
    }

    return {
      count,
      increment,
      submit
    }
  }
}
</script>
```

Everything still passes - great news!

## Conclusion

We discussed emitting events, and the various features Vue provides to keep our components clean and testable. We also covered some of my favorite conventions and best practices to keep things maintainable in the long run, as well as bring consistency to your code base. 

Finally, we saw how our tests was focused on inputs and outputs (in this case, the input is the user interation via the buttons, and the output is the emitted `submit` event).

We touch on events again later on, in the `v-model` chapter - stay tuned.

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
