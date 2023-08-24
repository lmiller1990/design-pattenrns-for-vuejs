# The Power of Render Functions

You can find the completed source code in the [GitHub repository under examples/renderless-password](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______
So far, all the examples in this book have used a `<template>` to structure the components. In reality, Vue does a ton of heavy lifting in the background between writing markup in `<template>` and rendering content in a browser. This is primarily handled by one of Vue's core packages, `@vue/compiler-sfc`. 

Code in `<template>` is compiled to something called *render functions*. Several things happen during this compilation step. Some of these are:

- Directives such as `v-if` and `v-for` are converted to regular JavaScript (`if` and `for` or `map`, for example).
- Optimizations.
- CSS is scoped (if you are using `<style scoped>`).

While it is generally more ergonomic to write your components with `<template>`, there are some situations where it can be beneficial to write the render functions yourself. One such situation is when writing a very generic UI library. It's also good to understand how things work under the hood.

In this section we will build a tab component. The usage will look something like this:

```html
<template>
  <TabContainer v-model="activeTabId">
    <Tab tabId="1">Tab #1</Tab>
    <Tab tabId="2">Tab #2</Tab>

    <TabContent tabId="1">Content #1</TabContent>
    <TabContent tabId="2">Content #2</TabContent>
  </TabContainer>
</template>
```
\begin{center}
Final markup for the tabs component.
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-tabs-done.png}
  \caption{Completed Tabs Component}
  \label{fig}
\end{figure}
\pagebreak

The `<TabContainer>` component works by taking a `<Tab>` component with a `tabId` prop. This is paired with a `<TabContent>` component with the same `tabId`. Only the `<TabContent>` where the `tabId` prop matches the `activeTabId` value will be shown. We will dynamically update `activeTabId` when a `<Tab>` is clicked.

## Why Render Functions?

This example shows a great use case for render functions. Without them, you might need to write something like this:

```html
<template>
  <TabContainer v-model:activeTabId="activeTabId">
    <Tab @click="activeTabId = '1'">Tab #1</tab>
    <Tab @click="activeTabId = '2'">Tab #2</tab>
    <Tab @click="activeTabId = '3'">Tab #3</tab>

    <TabContent v-if="activeTabId === '1'">
      Content #1
    </tab-content>
    <TabContent v-if="activeTabId === '2'">
      Content #2
    </tab-content>
    <TabContent v-if="activeTabId === '3'">
      Content #3
    </tab-content>
  </TabContainer>
</template>
```
\begin{center}
Alterntive, less flexible syntax.
\end{center}

As far as general development goes, I think the former is much cleaner and lends itself to a better development experience. 

Another common use case for render functions is when you are writing a general component library (such as Vuetify). In these cases, you will not know how many tabs the user is going to use, so using `v-if` like above isn't an option. You will need something more generic and generalizable. There are other alternatives, but I've found render functions really useful for writing reusable components.

## Creating the Components

One of the nice things about render function components is you can create multiple in the same file. Although I generally like to have one component per file, in this particular case I have no problem putting `<TabContainer>`, `<TabContent>` and `<Tab>` in the same file. The main reason for this is both `<Tab>` and `<TabContent>` are very simple, and I don't see any use case where you would want to use them outside of nesting them in `<TabContainer>`.

Start by creating those two components. We won't be using a `vue` file, but just a plain old `ts` file. The two components, `<Tab>` and `<TabContent>` have something in common:

```js
import { h, defineComponent, useSlots } from 'vue'

export const Tab = defineComponent({
  props: {
    tabId: {
      type: String,
      required: true
    }
  },
  setup() {
    const slots = useSlots() as any;
    return () => h("div", slots.default?.());
  },
});

export const TabContent = defineComponent({
  props: {
    tabId: {
      type: String,
      required: true
    }
  },
  setup() {
    const slots = useSlots() as any;
    return () => h("div", slots.default?.());
  },
});
```
\begin{center}
Tab and TabContent components using a render function instead of a template.
\end{center}

The two components are identical! They are basically just wrapper components - you'll see why soon. You might have also noticed `h()`. We will do a deep dive on `h` soon - don't worry if you don't understand that fully right now.

Since this is not an SFC using `<script setup>`, we cannot use `defineProps`. We need to use the `props` option. It does support complex types if needed:

```ts
type ComplexType = {
  a: {
    b: string
  }
}

const Component = defineComponent({
  props: {
    complexType: {
      type: Object as () => ComplexType,
      required: true
    }
  },
});
```

But we don't need it here. 

Before we go any further, the fact we are working with render functions, which are *just JavaScript* (or TypeScript), allows us to make a sneaky refactor and save some boilerplate. Both components have the same props: a `tabId`. We can generalize this with a `withTabId` function:

```ts
export const TabContent = defineComponent({
  props: {
    tabId: {
      type: String,
      required: true
    }
  },
  setup() {
    const slots = useSlots() as any;
    return () => h("div", slots.default?.());
  },
});

export const Tab = withTabId();
export const TabContent = withTabId();
```
\begin{center}
The withTabId function reduces duplication.
\end{center}

This technique is very useful when making component libraries where many components use similar props. Hard to say if it really make sense here - our components are so simple - but I wanted to introduce it anyway. Vue components are ultimately just JavaScript objects, and you can compose them like JavaScript objects.

## Filtering Slots by Component 

Now we get to the exciting part - the `render` function for the `<TabContainer>` component. It is going to be a `v-model` component, which means it has a prop named `modelValue`, and emits an event named `update:modelValue`.

```js
export const TabContainer = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: {
    "update:modelValue": (activeTabId: string) => true
  },
  setup(props, { emit }) {
    const slots = useSlots() as any;
    console.log(slots.default?.())
  },
});
```
\begin{center}
Creating the TabContainer component and logging the default slot.
\end{center}

Note the `console.log`. This is so we can learn about what `slots` contains, and how to filter and handle them to render the correct content.

The first thing we need to do is separate the slots. I will use the following example for development:

```html
<template>
  <TabContainer v-model="activeTabId">
    <Tab tabId="1" data-test="1">Tab #1</Tab>
    <Tab tabId="2" data-test="2">Tab #2</Tab>

    <TabContent tabId="1">Content #1</TabContent>
    <TabContent tabId="2">Content #2</TabContent>
  </TabContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { 
  Tab,
  TabContent,
  TabContainer
}  from './tabs.js'

const activeTabId = ref('1')
</script>
```
\begin{center}
Combining the render function components in a template.
\end{center}

In this example, `this.$slots.default()` would contain *four* slots (technically, we can say four `VNodes`). Two `<Tab>` components and two `<TabContent>` components. To make this more clear we will do some "console driven" development. 

Create a new app using the above component as the root component. Open a browser and open up the console. You should see something like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-render-default-slots.png}
  \caption{Logging Slots (Array of VNodes)}
  \label{fig}
\end{figure}
\pagebreak

An array of four complex objects. These are `VNodes` - how Vue internally represents nodes in it's virtual DOM. I expanded the first one and marked some of the relevant properties for this section:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-slot-details.png}
  \caption{Detailed View of the Tab VNode}
  \label{fig}
\end{figure}
\pagebreak

The first one is `children`. This is where the slots go. For example in:

```html
<Tab tabId="1">Tab #1</tab>
```

There is one child, `Tab #1`. In this case, it is a *text node* - just some text. It could be another `VNode`, which in turn could contain more `VNodes` - a tree like structure.

The next marked property is `props` - this one is pretty obvious, it's the props we passed. In this case, there is just one - `tabId`.

Finally we have `type`. Type can be a few things - for a regular HTML element, such as `<div>`, it would just be `div`. For a component, it contains the entire component. In this case, you can see the component we defined - `<Tab>` - which has `props` and `render` attributes. 

Now we know how to identify which component a `VNode` is using - the `type` property. Let's use this knowledge to filter the `slots`.

## Filtering default slots

The `type` property is a *direct reference* to the component the `VNode` is using. This means we can match using an object and strict equality. If this sounds a bit abstract, let's see it in action and sort the slots into `tabs` and `contents`:

```js
export const TabContainer = defineComponent({
  // ...
  setup(props, { emit }) {
    const slots = useSlots() as any;

    console.log(slots.default?.())

    const content: Array<typeof Tab | typeof TabContent> =
      slots.default?.() ?? [];

    // type-safe filters
    const tabFilter = (component: any): component is typeof Tab =>
      component.type === Tab;

    const contentFilter = (component: any): component is typeof TabContent =>
      component.type === Tab;

    const tabs = computed(() => content.filter(tabFilter))
    const contents = computed(() => content.filter(contentFilter))

    console.log(tabs.value, contents.value)
  }
})
```
\begin{center}
Separating the different slots using filter.
\end{center}

Since `type` is a direct reference to the original component (eg, not a copy), we can use `===` (strict equality) to filter the slots.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-sorted-slots.png}
  \caption{Filtered VNodes}
  \label{fig}
\end{figure}
\pagebreak

Note that I am marking the components as `computed`. We need these to be reactive, to handle the use case of the number of tabs or content dynamically changing. 

The next goal will be to render the tabs. We will also add some classes to get some nice styling, as well as show which tab is currently selected.

## Adding Attributes to Render Functions

First things first, let's render something! Enough console driven development. Import `h` from vue, and then `map` over the filtered tabs - I will explain the crazy (amazing?) `h` function afterwards:

```js
import { h } from 'vue'

export const TabContainer = defineComponent({

  // ...

  setup(props, { emit }) {
    const slots = useSlots() as any;

    const content: Array<typeof Tab | typeof TabContent> =
      slots.default?.() ?? [];

    const tabFilter = (component: any): component is typeof Tab =>
      component.type === Tab;

    const tabs = computed(() => content.filter(tabFilter))

    return () => h(() => tabs.value)
  }
})
```
\begin{center}
Rendering the tabs using h.
\end{center}

I removed the content for now - let's focus on the tabs first. 

Finally, we have something rendering:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-render-tabs-basic.png}
  \caption{Rendered Tabs}
  \label{fig}
\end{figure}
\pagebreak

You may have noticed I did `() => h(() => tabs.value)` instead of just `return tabs`. `h` also accepts a callback - in which case, it will evaluate the callback function when it renders. I recommend always returning `() => h(() => ...) in `setup` (or `h(() => /* render function */)` if you are using `render` and the Options API). If you don't, you may run into subtle caching issues. Vue will usually print a console warning - if you change `return () => h(...)` to just `return h(...)` you can see a warning using this example.

You can also return an array from `setup` or `render` - this is known as a *fragment*, where there is no root node.

If this looks confusing, don't worry - here comes the `h` crash course.

## What is `h`? A Crash Course

A more complex example of a component with a `setup` function that returns an array of render functions, consisting of both regular HTML elements and a custom component.

```ts
import { defineComponent, h } from "vue";

export const Comp = defineComponent({
  setup() {
    const e1 = h("div");
    const e2 = h("span");
    const e3 = h({
      setup() {
        return () => h("p", {}, ["Some Content"]);
      },
    });

    return () => [h(() => e1), h(() => e2), h(() => e3)];
  },
});
```
\begin{center}
A more complex example of a render function with h.
\end{center}

Note `e3` is a component - a component is really just an object with a `setup` function that returns something to render.  `e3` could also be written as:

```ts
const e3 = defineComponent({
  setup() {
    return () => h("p", {}, ["Some Content"]);
  },
});
```

`defineComponent` is just for type safety - it doesn't actually have any runtime implications. 

In the above examples, we are using `h` to render our component. In the actual component we are building, it will be `h(Tab)` or `h(TabContent)` - where the component is a `VNode`, which in turn has a `setup` function that returns a `h` call or an array of `h` calls. 

What is `h`? It is derived from the term "hyperscript", which in turn owes its roots to `HTML` - specifically the `H`, which is stands for *hyper*. Think of it as HTML + JavaScript = HyperScript. `h` is shorter and easier to type. It can be thought of as "a JavaScript function that creates HTML structures".

It has quite a few overloads. For example, a minimal usage would be:

```js
const el = h('div')
```
\begin{center}
A minimal VNode representing a div.
\end{center}

This will create a single `<div>` - not very useful. The second argument can be attributes, represented by an object.

```js
const el = h('div', { class: 'tab', foo: 'bar' })`
```
\begin{center}
The second argument to h is an object containing attributes.
\end{center}

The attributes object can take an attribute - standard or not. This would render:

```html
<div class="tab" foo="bar" />
```

The third and final argument is children, usually an array:

```js
const el = h('div', { class: 'tab', foo: 'bar' }, ['Content'])`
```
\begin{center}
The third argument is the children.
\end{center}

Which renders:

```html
<div class="tab" foo="bar">
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
\begin{center}
Children can be plain text or VNodes.
\end{center}

I spread it out to make it more readable. `render` functions using `h` can get messy - you need to be displined. Some tips will follow relating to this. The above call to `h` gives us:

```html
<div class="tab" foo="bar">
  <span>Hello world!</span>
</div>
```

As shown above, you are not just limited to standard HTML elements. You can pass a custom component to `h`, too:

```js
const Tab = {
  setup() {
    return () => h('span')
  }
}

const el = h('div', {}, [h(Tab), {}, ['Tab #1']])
```
\begin{center}
Passing a custom component, Tab, as a child.
\end{center}

This can get difficult to read quickly. The main strategy I use to work around this is creating a separate variable for each `VNode`, and returning them all at the end of the `render` function (keep reading to see this in action). You won't write these types of components much in production code - you do find it a lot more often in libraries, though. One other strategy is to use JSX or TSX, which compiles to what we are writing here. I think this is probably more ideal for a complex system - but only once you understand what's going on under the hood. If you don't, debugging will be a lot more difficult!

## Adding a Dynamic Class Attribute

Now we have a better understanding of `h`, we can add some classes to the `<Tab>` components. Each `<Tab>` will have a `tab` class, and the active tab will have an `active` class. Update the code:

```ts
export const TabContainer = defineComponent({
  // ...
  setup(props, { emit }) {
    const slots = useSlots() as any;

    const content: Array<typeof Tab | typeof TabContent> =
      slots.default?.() ?? [];

    const tabFilter = (component: any): component is typeof Tab =>
      component.type === Tab;

    const tabs = computed(() => {
      return content.filter(tabFilter).map((tab) => {
        return h(tab, {
          ...tab.props,
          class: {
            key: tab.props.tabId,
            tab: true,
            active: tab.props.tabId === props.modelValue,
          },
        });
      });
    });

    return () => h(() => tabs.value);
  },
});
```
\begin{center}
Passing an dynamic "active" prop.
\end{center}

Does this look familiar?

```ts
{
  class: {
    tab: true,
    active: tab.props.tabId === props.modelValue
  }
}
```
\begin{center}
A dynamic class binding.
\end{center}

It's `v-bind:class` syntax! This is how you write `v-bind:class="{ tab: true, active: tabId === activeTabId }"` in a render function. Here's how it looks in a browser (I added some CSS - grab the CSS from `examples/render-functions/RenderFunctionsApp.vue`):

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-tabs-classes.png}
  \caption{Dynamic Classes}
  \label{fig}
\end{figure}
\pagebreak

## Event Listeners in Render Functions

The active tab needs to update when the user clicks a tab. Let's implement that. Add an event listener is much the same as attributes like `class`. 

```ts
const tabs = computed(() => {
  return content.filter(tabFilter).map((tab) => {
    return h(tab, {
      ...tab.props,
      class: {
        key: tab.props.tabId,
        tab: true,
        active: tab.props.tabId === props.modelValue,
      },
      onClick: () => {
        emit("update:modelValue", tab.props.tabId);
      },
    });
  });
});
```
\begin{center}
An inline onClick listener
\end{center}

This is the `h` function version of `<Tab v-on:click="update:activeTabId(tabId)" />`. `on:click` (or `@click`) becomes `onClick`. When writing components using `h`, events need to be prepended with `on`. `@click` translates to `onClick`. This change is enough to update the active tab (I added some debugging information):

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-active.png}
  \caption{Emitting Events in Render Functions}
  \label{fig}
\end{figure}
\pagebreak

## Filtering Content

The last feature we need to implement is rendering the content - but only the content that matches the `activeTabId`. Instead of using `filter` to get the `contents` `VNodes`, we should use `find` - there will only ever be one tab selected at any given time. Use `find` instead of `filter` in the `render` function:

```js
const contentFilter = (
  component: any
): component is typeof TabContent => {
  return (
    component.type === TabContent &&
    component.props.tabId === props.modelValue
  )
};

const tabContent = computed(() => {
  const slot = content.find(contentFilter)!;
  return h(slot, { ...slots.props, key: slot.props.tabId });
});
```
\begin{center}
Finding the active content among the slots.
\end{center}

Finally, we need to change what is returned. Instead of just rendering the tabs, we will render the content as well. Here is the completed `setup` function:

```ts
export const TabContainer = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: {
    "update:modelValue": (activeTabId: string) => true,
  },
  setup(props, { emit }) {
    const slots = useSlots() as any;

    const content: Array<typeof Tab | typeof TabContent> =
      slots.default?.() ?? [];

    const tabFilter = (component: any): component is typeof Tab =>
      component.type === Tab;

    const tabs = computed(() => {
      return content.filter(tabFilter).map((tab) => {
        return h(tab, {
          ...tab.props,
          class: {
            key: tab.props.tabId,
            tab: true,
            active: tab.props.tabId === props.modelValue,
          },
          onClick: () => {
            emit("update:modelValue", tab.props.tabId);
          },
        });
      });
    });

    const contentFilter = (
      component: any
    ): component is typeof TabContent => {
      return (
        component.type === TabContent &&
        component.props.tabId === props.modelValue
      )
    };

    const tabContent = computed(() => {
      const slot = content.find(contentFilter)!;
      return h(slot, { ...slots.props, key: slot.props.tabId });
    });

    return () => [
      h("div", { class: "tabs" }, tabs.value),
      h("div", { class: "content" }, tabContent.value),
    ];
  },
});
```
\begin{center}
Completed TabContainer component.
\end{center}

It's possible to return an array of `VNodes` from `render`, which is what we do here. We kept everything nice and readable by creating separate variables for each of the different elements we are rendering - in this case, `tabs` and `tabContent`. 

It works!

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-tabs-done.png}
  \caption{Completed Tabs Component}
  \label{fig}
\end{figure}
\pagebreak


## Testing Non SFC Components

Now that we finished the implementation, we should write a test to make sure everything continues working correctly. Writing a test is pretty straight forward - the `render` function from Testing Library works fine with non SFC components (`vue` files are compiled into `setup` functions anyway, so all the tests we've been writing have been using `setup` functions returning `h` under the hood).

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import App from './app.vue'

test('tabs', async () => {
  render(App)
  expect(screen.queryByText('Content #2')).toBeFalsy()

  fireEvent.click(screen.getByText('Tab #2'))
  await screen.findByText('Content #2')
})
```
\begin{center}
Testing render function components is the same as template components.
\end{center}

## Exercises

- Attempt to refactor the other examples throughout this book to use setup functions that render using `h` instead of `vue` files (these are not included in the solutions - you can email me if you want help writing a specific example using TypeScript and `setup`).

You can find the completed source code in the [GitHub repository under examples/render-functions](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-ts.png}
  \caption{Typesafe Component with Render Function}
  \label{fig}
\end{figure}
\pagebreak

