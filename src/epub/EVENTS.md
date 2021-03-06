# Emitting Events

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code). 

Vue's primary mechanic for passing data *down* to components is `props`. In contrast, when components needs to communicate with another component higher in the hierarchy, you do so by *emitting events*. This is done by calling `this.$emit()` (Options API) or `ctx.emit()` (Composition API).

Let's see some examples on how this works, and some guidelines we can set to keep things clean and understandable.

## Starting Simple

Here is a very minimal yet perfectly working `<counter>` component. It is not ideal; we will work on improving it during this section. 

This example starts with the Options API; we will eventually refactor it to use the Composition API (using the tests we write to ensure we don't break anything).

```html
<template>
  <button role="increment" @click="count += 1" />
  <button role="submit" @click="$emit('submit', count)" />
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>
```
\begin{center}
A simple counter component.
\end{center}

There are two buttons. One increments the `count` value by 1. The other emits a `submit` event with the current count. Let's write a simple test that will let us refactor with the confidence.

As with the other examples, this one uses Testing Library, but you could really use any testing framework - the important part is that we have a mechanism to let us know if we break something.

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import Counter from './counter.vue'

describe('Counter', () => {
  it('emits an event with the current count', async () => {
    const { emitted } = render(Counter) 
    await fireEvent.click(screen.getByRole('increment'))
    await fireEvent.click(screen.getByRole('submit'))
    console.log(emitted())
  })
})
```
\begin{center}
Observing the emitted events with emitted().
\end{center}

I did a `console.log(emitted())` to illustrate how `emitted` works in Testing Library. If you run the test, the console output is as follows:

```json
{ 
  submit: [ 
    [ 1 ] 
  ] 
}
```
\begin{center}
A submit event was emitted with one argument: the number 1.
\end{center}

`emitted` is an object - each event is a key, and it maps to an array with an entry for each time the event was emitted. `emit` can have any amount of arguments; if I had written `$emit('submit', 1, 2, 3,)` the output would be:

```json
{ 
  submit: [ 
    [ 1, 2, 3 ] 
  ] 
}
```
\begin{center}
A submit event was emitted with three arguments, 1, 2, 3.
\end{center}

Let's add an assertion, before we get onto the main topic: patterns and practices for emitting events.

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import Counter from './counter.vue'

describe('Counter', () => {
  it('emits an event with the current count', async () => {
    const { emitted } = render(Counter) 

    await fireEvent.click(screen.getByRole('increment'))
    await fireEvent.click(screen.getByRole('submit'))

    expect(emitted().submit[0]).toEqual([1])
  })
})
```
\begin{center}
Making an assertion against the emitted events.
\end{center}

## Clean Templates

Templates can often get chaotic among passing props, listening for events and using directives. For this reason, wherever possible, we want to keep our templates simple by moving logic into the `<script>` tag. One way we can do this is to avoid writing `count += 1` and `$emit()` in `<template>`. Let's make this change in the `<counter>` component, moving the logic from `<template>` into the `<script>` tag by creating two new methods:

```html
<template>
  <button role="increment" @click="increment" />
  <button role="submit" @click="submit" />
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
\begin{center}
Moving the emit logic from the template to the script.
\end{center}

Running the test confirms that everything is still working. This is good. Good tests are resilient to refactors, since they test inputs and outputs, not implementation details. 

I recommend you avoid putting any logic into `<template>`. Move everything into `<script>`. `count += 1` might seem simple enough to inline in `<template>`. That said, I personally value consistency over saving a few key strokes, and for this reason I put all the logic inside `<script>` - no matter how simple it is.

Another thing you may have notices is the *name* of the method we created - `submit`. This is another personal preference, but I recommend having a good convention around naming methods. Here are two I've found useful.

1. Name the method that emits the event the same as the event name. If you are doing `$emit('submit')`, you could name the method that calls this `submit`, too. 
2. Name methods that call `$this.emit()` or `ctx.emit()` using the convention `handleXXX`. In this example, we could name the function `handleSubmit`. The idea is those methods *handle* the interactions and emit the corresponding event.

Which of these you choose isn't really important; you could even pick another convention you like better. Having a convention is generally a good thing, though. Consistency is king!

## Declaring emits 

As of Vue 3, you are able to (and encouraged to) declare the events your component will emit, much like you declare props. It's a good way to communicate to the reader what the component does. Also, if you are using TypeScript, you will get better autocompletion and type safety.

Failing to do so will give you a warning in the browser console: *"Component emitted event "<event name>" but it is neither declared in the emits option nor as an "<event name> prop"*.

By declaring the events a component emits, it can make it easier for other developers (or yourself in six months time) to understand what your component does and how to use it.

You can declare events in the same way you declare props; using the array syntax:

```js
export default {
  emits: ['submit']
}
```
\begin{center}
Declaring emits with the inferior array syntax.
\end{center}

Or the more verbose but explicit object syntax:

```js
export default {
  emits: {
    submit: (count) => {} 
  }
}
```
\begin{center}
Declaring emits with the verbose but explicit object syntax.
\end{center}

If you are using TypeScript, you will get even better type safety with this syntax - including the types in the payload!

The object syntax also supports *validation*. As an example, we could validate the payload for an imaginary `submit` event is a number:

```js
export default {
  emits: {
    submit: (count) => {
      return typeof count !== 'string' && !isNaN(count)
    } 
  },
}
```
\begin{center}
Validating the emitted event.
\end{center}

If the validator returns `false`, the event will not be emitted.

## More Robust Event Validation

Depending on your application, you may want to have more thorough validation. I tend to favor defensive programming; I don't like taking chances, not matter how unlikely the scenario might seem. 

Getting burned by a lack of defensive programming and making assumptions like "this will never happen in production" is something everyone has experienced. It's almost a rite of passage. There is a reason more experienced developers tend to be more cautious, write defensive code, and write lots of tests.

I also have a strong emphasis on testing, separation of concerns, and keeping things simple and modular. With these philosophies in mind, let's extract this validator, make it more robust, and add some tests.

The first step is to move the validation out of the component definition. For brevity, I am just going to export it from the component file, but you could move it to another module entirely (for example, a `validators` module).

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
\begin{center}
A more robust validator with a custom validator function.
\end{center}

Another convention is emerging: I like to call event validators `xxxValidator`.

I am also going to make a change to `submitValidator`; the argument *must* be a number; if not, bad things will happen. So instead of waiting for bad things to happen, I am going to throw an error:

```js
export function submitValidator(count) {
  if (typeof count === 'string' || isNaN(count)) {
    throw Error(`
        Count should be a number.
        Got: ${count}
    `)
  }
  return true
}
```
\begin{center}
Defensive programming; failing loudly is good.
\end{center}

`submitValidator` is just a plain old JavaScript function. It's also a pure function - it's output is solely dependant on it's inputs. This means writing tests is trivial:

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
\begin{center}
Testing submitValidator in isolation.
\end{center}

A lot of these type specific validations can be partially mitigated with TypeScript. TypeScript won't give you runtime validation, though. If you are using an error logging service (like Sentry), throwing an error like this can give you valuable information for debugging.

## With the Composition API 

The `<counter>` example used the Options API. All the topics discussed here translate to the Composition API, too.

A good way to see if you are testing inputs and outputs, as opposed to implementation details, is to refactor your component from the Options API to the Composition API, or vice versa; good tests are resilient to refactor. 

Let's see the refactor:

```html
<template>
  <button role="increment" @click="increment" />
  <button role="submit" @click="submit" />
</template>

<script>
export function submitValidator(count) {
  if (typeof count === 'string' || isNaN(count)) {
    throw Error(`
        Count should be a number.
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
\begin{center}
The completed counter component with validation.
\end{center}

Everything still passes - great news!

## Conclusion

We discussed emitting events, and the various features Vue provides to keep our components clean and testable. We also covered some of my favorite conventions and best practices to keep things maintainable in the long run, as well as bring consistency to your code base. 

Finally, we saw how our tests was focused on inputs and outputs (in this case, the input is the user interation via the buttons, and the output is the emitted `submit` event).

We touch on events again later on, in the `v-model` chapter - stay tuned.

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code). 

