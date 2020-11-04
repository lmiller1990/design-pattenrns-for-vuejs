# The Power of Render Functions

So far, all the examples in this book have used a `<template>` to structure the components. In reality, Vue does a ton of heavy lifting in the background between writing markup in `<template>` and actually rendering content in a browser. This is primarily handled by one of Vue's core packages, `@vue/compiler-sfc`. 

Code in `<template>` is compiled to something called *render functions*. A number of things happen during this compilation step. Some of these are:

- Directives such as `v-if` and `v-for` are converted to regular JavaScript (`if` and `for` or `map`, for example).
- Optimizations.
- CSS is scoped (if you are using `<style scoped>`).

While it is generally more ergonomic to write your components with `<template>`, there are some situations where it can be beneficial to write the render functions yourself. One such situation is when writing a very generic UI library. It's also good to understand how things work under the hood.

In this section we will build a tab component. The usage will look something like this:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab tabId="1">Tab #1</tab>
    <tab tabId="2">Tab #2</tab>
    <tab tabId="3">Tab #3</tab>

    <tab-content tabId="1">Content #1</tab-content>
    <tab-content tabId="2">Content #2</tab-content>
    <tab-content tabId="3">Content #3</tab-content>
  </tab-container>
</template>
```

### Img: Completed Tabs Component

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-tabs-done.png)

The `<tab-container>` component works by taking a `<tab>` component with a `tabId` prop. This is paired with a `<tab-content>` component with the same `tabId`. Only the `<tab-content>` where the `tabId` prop matches the `activeTabId` value will be shown. We will dynamically update `activeTabId` when a `<tab>` is clicked.

## Why Render Functions?

This example shows a great use case for render functions. Without them, you might need to write something like this:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab @click="activeTabId = '1'">Tab #1</tab>
    <tab @click="activeTabId = '2'">Tab #2</tab>
    <tab @click="activeTabId = '3'">Tab #3</tab>

    <tab-content v-if="activeTabId === '1'">
      Content #1
    </tab-content>
    <tab-content v-if="activeTabId === '2'">
      Content #2
    </tab-content>
    <tab-content v-if="activeTabId === '3'">
      Content #3
    </tab-content>
  </tab-container>
</template>
```

As far as general development goes, I think the former is much cleaner and lends itself to a better development experience. 

Another common use case for render functions is when you are writing a general component library (such as Vuetify). In these cases, you will not know how many tabs the user is going to use, so using `v-if` like above isn't an option. You will need something more generic and generalizable. There are other alternatives, but I've found render functions really useful for writing reusable components.

## Creating the Components

One of the nice things about render function components is you can create multiple in the same file. Although I generally like to have one component per file, in this particular case I have no problem putting `<tab-container>`, `<tab-content>` and `<tab>` in the same file. The main reason for this is both `<tab>` and `<tab-content>` are very simple, and I don't see any use case where you would want to use them outside of nesting them in `<tab-container>`.

Start by creating those two components. We won't be using a `vue` file, but just a plain old `js` file:

```js
import { h } from 'vue'

export const TabContent = {
  props: {
    tabId: {
      type: String,
      required: true
    }
  },

  render() {
    return h(this.$slots.default)
  }
}

export const Tab = {
  props: {
    tabId: {
      type: String,
      required: true
    }
  },

  render() {
    return h('div', h(this.$slots.default))
  }
}
```

We do a deep dive on `h` soon - don't worry if you don't understand that fully right now.

Before we go any further, the fact we are working with render functions, which are *just JavaScript*, allows us to make a sneaky refactor and save some boilerplate. Both components have the same props: a `tabId`. We can generalize this with a `withTabId` function and the spread (`...`) operator:

```js
const withTabId = (content) => ({
  props: {
    tabId: {
      type: String,
      required: true
    }
  },
  ...content
})

export const TabContent = withTabId({
  render() {
    return h(this.$slots.default)
  }
})

export const Tab = withTabId({
  render() {
    return h('div', h(this.$slots.default))
  }
})
```

This technique is very useful when making component libraries where many components use similar props.

## Filtering Slots by Component 

Now we get to the exciting part - the `render` function for the `<tab-container>` component. It has one prop - `activeTabId`:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    console.log(this.$slots.default())
  }
}
```

If you prefer Composition API, you could also do this with `setup`:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  setup(props, { slots }) {
    console.log(slots.default())
  }
}
```

I will be using the Options API and a `render` function for this example. 

The first thing we need to do is separate the slots. I will use the following example for development:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab tabId="1" />
    <tab tabId="2" />

    <tab-content tabId="1" />
    <tab-content tabId="2" />
  </tab-container>
</template>

<script>
import { ref } from 'vue'

import { 
  Tab,
  TabContent,
  TabContainer
}  from './tab-container.js'

export default {
  components: {
    Tab,
    TabContainer,
    TabContent
  },

  setup() {
    return {
      activeTabId: ref('1')
    }
  }
}
</script>
```

In this example, `this.$slots.default()` would contain *four* slots (technically, we can say four `VNodes`). Two `<tab>` components and two `<tab-content>` components. To make this more clear we will do some "console driven" development. 

Create a new app using the above component as the root component. Open a browser and open up the console. You should see something like this:

### Img: Logging Slots (Array of VNodes)

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-render-default-slots.png)

An array of four complex objects. These are `VNodes` - how Vue internally represents nodes in it's virtual DOM. I expanded the first one and marked some of the relevant properties for this section:

### Img: Detailed View of the Tab VNode

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-slot-details.png)

The first one is `children`. This is where the slots go. For example in:

```html
<tab tabId="1">Tab #1</tab>
```

There is one child, `Tab #1`. In this case, it is a *text node* - just some text. It could be another `VNode`, which in turn could contain more `VNodes` - a tree like structure.

The next marked property is `props` - this one is pretty obvious, it's the props we passed. In this case, there is just one - `tabId`.

Finally we have `type`. Type can be a few things - for a regular HTML element, such as `<div>`, it would just be `div`. For a component, it contains the entire component. In this case, you can see the component we defined - `<tab>` - which has `props` and `render` attributes. 

Now we know how to identify which component a `VNode` is using - the `type` property. Let's use this knowledge to filter the `slots`.

## Filtering default slots

The `type` property is actually a *direct reference* to the component the `VNode` is using. This means we can match using an object and strict equality. If this sounds a bit abstract, let's see it in action and sort the slots into `tabs` and `contents`:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
    const contents = $slots
      .filter(slot => slot.type === TabContent)

    console.log(
      tabs,
      contents
    )
  }
}
```

Since `type` is a direct reference to the original component (eg, not a copy), we can use `===` (strict equality) to filter the slots.

### Img: Filtered VNodes

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-sorted-slots.png)

The next goal will be to render the tabs. We will also add some classes to get some nice styling, as well as show which tab is currently selected.

## Adding Attributes to Render Functions

First things first, let's render something! Enough console driven development. Import `h` from vue, and then `map` over the filtered tabs - I will explain the crazy (amazing?) `h` function afterwards:

```js
import { h } from 'vue'

export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(tab)
      })

    const contents = $slots
      .filter(slot => slot.type === TabContent)

    return h(() => tabs)
  }
}
```

Finally, we have something rendering:

### Img: Rendered Tabs

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-render-tabs-basic.png)

You may have noticed I did `h(() => tabs)` instead of just `return tabs`. `h` also accepts a callback - in which case, it will evaluate the callback function when it renders. I recommend always returning `h(() => /* render function */)` for the final value in `render` - if you don't, you may run into subtle caching issues.

You can also return an array - this is known as a *fragment*.

A more complex example of a component with a `render` function that returns an array of render functions, consisting of both regular HTML elements and a custom component.

```js
const Comp = {
  render() {
    const e1 = h('div')
    const e2 = h('span')
    const e3 = h({
      render() {
        return h('p', {}, ['Some Content'])
      }
    })

    return [
      h(() => e1),
      h(() => e2),
      h(() => e3)
    ]
  }
}
```

If this looks confusing, don't worry - see the `h` crash course below.

## What is `h`? A Crash Course

We are using `h` to render our tabs - `h(tab)` - where `tab` is a `VNode`, which in turn has a render function that returns `h`. What is `h`? It is derived from the term "hyperscript", which in turn owes its roots to `HTML` - specifically the `H`, which is stands for *hyper*. `h` is shorter, and easier to type. It can be thought of as "a JavaScript function that creates HTML structures`.

It has quite a few overloads - ways to use it. For example, a minimal usage would be:

```js
const el = h('div')
```

This will create a single `<div>` - not very useful. The second argument can be attributes, represented by an object.

```js
const el = h('div', { class: 'tab', foo: 'bar' })`
```

The attributes object can take an attribute - standard or not. This would render:

```html
<div class="tab" foo="bar" />
```

The third and final argument is children, usually an array:

```js
const el = h('div', { class: 'tab', foo: 'bar' }, ['Content'])`
```

Which renders:

```html
<div class="tab" foo="bar>
  Content
</div>
```

You can also pass more `VNodes`, created with nested calls to `h`:

```js
const el = h(
  'div', 
  { 
    class: 'tab', 
    foo: 'bar' 
  }, 
  [
    h(
      'span', 
      {}, 
      ['Hello world!']
    )
  ]
)
```

I spread it out to make it more readable. `render` functions using `h` can get messy - you need to be displined. Some tips will follow relating to this. Ths above call to `h` gives us:

```html
<div class="tab" foo="bar>
  <span>Hello world!</span>
</div>
```

As shown above, you are not just limited to standard HTML elements. You can pass a custom component to `h`, too:

```js
const Tab = {
  render() {
    return h('span')
  }
}

const el = h('div', {}, [h(Tab), {}, ['Tab #1']])
```

This can get difficult to read quickly. The main strategy I use to work around this is creating a separate variable for each `VNode`, and returning them all at the end of the `render` function (keep reading to see this in action).

## Adding a Dynamic Class Attribute

Now we have a better understanding of `h`, we can add some classes to the `<tab>` components. Each `<tab>` will have a `tab` class, and the active tab will have an `active` class. Update the `render` function:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(
          tab,
          {
            class: {
              tab: true,
              active: tab.props.tabId === this.activeTabId
            }
          }
        )
      })

    const contents = $slots
      .filter(slot => slot.type === TabContent)

    return h(() => h('div', { class: 'tabs' }, tabs))

  }
}
```

Does this look familiar?

```js
{
  class: {
    tab: true,
    active: tab.props.tabId === this.activeTabId
  }
}
```

It's `v-bind:class` syntax! This is how you write `v-bind:class="{ tab: true, active: tabId === activeTabId }"` in a render function. Here's how it looks in a browser (I added some CSS - grab the CSS from `examples/render-functions/app.vue`):

### Img: Dynamic Classes

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-tabs-classes.png)

## Event Listeners in Render Functions

The active tab needs to update when the user clicks a tab. Let's implement that. Event listeners are much the same as attributes like `class`. 

```js
{
  class: {
    tab: true,
    active: tab.props.tabId === this.activeTabId
  },
  onClick: () => {
    this.$emit('update:activeTabId', tab.props.tabId)
  }
}
```

This is the render function version of `<tab v-on:click="update:activeTabId(tabId)" />`. `on:click` becomes `onClick`. Events need to be prepended with `on`. This is enough to update the active tab (I added some debugging information):

### Img: Emitting Events in Render Functions

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-active.png)

## Filtering Content

The last feature we need to implement is rendering the content - but only the content that matches the `activeTabId`. Instead of using `filter` to get the `contents` `VNodes`, we should use `find` - there will only ever be one tab selected at any given time. Use `find` instead of `filter` in the `render` function:

```js
const content = $slots.find(slot => 
  slot.type === TabContent &&
  slot.props.tabId === this.activeTabId
)
```

Finally, we need to change the return. Instead of just rendering the tabs, we will render the content as well. Here is the completed `render` function:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(
          tab,
          {
            class: {
              tab: true,
              active: tab.props.tabId === this.activeTabId
            },
            onClick: () => {
              this.$emit('update:activeTabId', tab.props.tabId)
            }
          }
        )
      })

    const content = $slots.find(slot => 
      slot.type === TabContent &&
      slot.props.tabId === this.activeTabId
    )

    return [
      h(() => h('div', { class: 'tabs' }, tabs)),
      h(() => h('div', { class: 'content' }, content)),
    ]
  }
}
```

It's possible to return an array of `VNodes` from `render`, which is what we do here. We kept everything nice and readable by creating separate variables for each of the different elements we are rendering - in this case, `tabs` and `content`. 

It works!

### Img: Completed Tabs Component

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-tabs-done.png)

## Testing Render Function Components

Now that we finished the implementation, we should write a test to make sure everything continues working correctly. Writing a test is pretty straight forward - the `mount` function from Vue Test Utils works fine with render functions (`vue` files are compiled into render functions, so actually all the tests we've been writing have been using `render` functions under the hook).

```js
import { mount } from '@vue/test-utils'
import App from './app.vue'

test('tabs', async () => {
  const wrapper = mount(App)
  expect(wrapper.html()).not.toContain('Content #2')

  await wrapper.find('[data-test="2"]').trigger('click')

  expect(wrapper.html()).toContain('Content #2')
})
```

I added a `data-test` selector to my `app.vue` test component, to make it clear which tab I am clicking in the test.

## Exercises

- Try refactoring the components to use a `setup` function. This means instead of using a `render` function, you will return a function from `setup` that handles the rendering.
- Rewrite this example using TypeScript. You will want to use `defineComponent` and the Composition API for maximum type safety. This screenshot illustrates some of the benefits of TypeScript. Combined with declaring `emits`, you can get type safety for both emitted events and props.
- Attempt to refactor the other examples throughout this book to use render functions instead of `vue` files (these are not included in the solutions - you can email me if you want help writing a specific example using TypeScript and the Composition API).


### Img: Typesafe Component with Render Function

![](https://raw.githubusercontent.com/lmiller1990/design-pattenrns-for-vuejs/master/images/ss-ts.png)

\pagebreak
