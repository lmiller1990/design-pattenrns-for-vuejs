In the previous chapter, we build a Tic Tac Toe game, encapsulating the logic in a composable. We conciously decided to couple our implementation to Vue, when we used reactivity APIs like `computed` and `ref` in the business logic. 

In this chapter, we will explore an paradigm best characterized as "functional core, imperative shell". We will refactor the Tic Tic Toe logic to be purely functional, avoiding all mutation. This will be decoupled from Vue's reactivity system, which relies on mutation and side effects, something the functional paradigm avoids. 

*Immutability* is the name of the game here. In our previous implementation, `makeMove` looks like this:

```js
function makeMove({ row, col }) {
  const newBoard = [...boards.value[boards.value.length - 1]]
  newBoard[row][col] = currentPlayer.value
  currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
  boards.value.push(newBoard)
}
```

On line 3, we mutation the `newBoard` variable. We then mutates `boards` on line 4, by pushing a new value in. In addition to this mutation, we are also using two global variables: `boards` and `currentPlayer`. If we want to approach in a functional manner, the function needs to have the following signature:

```ts
type Board = string[][]

function makeMove(board, col, row, counter): Board
```

In other words, `makeMove` needs to receive all required arguments to create a new board, and should return a new board. This makes it pure; the return value is determined exclusively by the inputs.

This begs the question: if we cannot mutate anything, how do we get anything done? The answer is that the business logic is the *functional core*. We will then write a thin layer, the *imperative shell*, which wraps the functional core, or the business logic, in Vue's reactivity APIs. All mutation will occur in the imperative shell. 

By making the business logic mutation free, it's very easy to test. We will then test the imperative shell, or the Vue integration, using Vue Test Utils - a library designed for this very purpose - to test Vue components.

The final API is going to be the same:

```js
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { currentBoard, makeMove } = useTicTacToe()

    return {
      currentBoard,
      makeMove
    }
  }
}
```

## Core Logic - The Functional Core

Let's start with the functional core, starting with a `createGame` function:

```js
/**
 * Core Logic
 * Framework agnostic
 */
export const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]

export function createGame(initialState) {
  return [...initialState]
}
```

While we could have just done `createGame` without passing any arguments, this makes it easy to seed an initial state for testing. Also, we avoid relying on a global variable.

A test is so trivial it's almost pointless to write, but let's do it anyway:

```js
describe('useTicTacToe', () => {
  it('initializes state to an empty board', () => {
    const expected = [
      ['-', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    expect(createGame(initialBoard)).toEqual(expected)
  })
})
```

## Immutable makeMove

Then bulk of the logic is in the `makeMove` function. To update the board, we need the current game state, the column and row to update, and the counter (`x` or `o`). So those will be the arguments we pass to the function.

```js
export function makeMove(board, { col, row, counter }) {
  // copy current board
  // return copy with updated cell
}
```

I decided to have two arguments: the first is the `board`, which I consider the "main" argument. I decided to implement `col`, `row` and `counter` as an object, since I consider those to be "options", which will change depending on the move the player makes.

Before going any further, a test will be useful. I'm going to write a verbose implementation of `makeMove` and then refactor it; the test will help ensure nothing breaks during the refactor.

```js
describe('makeMove', () => {
  it('returns a new updaed board', () => {
    const board = createGame()
    const updatedBoard = makeMove(board, {
      row: 0, 
      col: 0, 
      counter: 'o'
    })

    expect(updatedBoard).toEqual([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```

Let's start with a verbose implementation. Since we do not want to mutate anything, we are going to create a copy of the game state. Then we will `map` each row. In each row, we will `map` each column, and when we find the row and column the user has chosen, we will update the cell.

```js
export function makeMove(board, { col, row, counter }) {
  //  make a copy. Don't mutation the arguments!
  const copy = [...board]

  // loop each row with map.
  return copy.map((theRow, rowIdx) => {
    
    // for each row, loop each column with map.
    return theRow.map((cell, colIdx) => {

      // if we are on the row and column the user
      // has chosen, return the counter (o or x).
      if (rowIdx === row && colIdx === col) {
        return counter
      }
      // otherwise just return the current cell.
      return cell
    })
  })
}
```

The test passes! I left some comments to make it clear what's going on. If you haven't seen this type of code before, it can be a little difficult to understand - it was for me. Once I got used to using tools like `map` and `reduce` instead of a for loop and mutation, I started to find this style of code more concise, and also less prone to bugs.

We can make this a lot more concise! This is optional; there is some merit to verbose, explicit code too. Let's see the concise version, and you can make a decision which one you think is more readable.

```js
export function makeMove(board, { col, row, counter }) {
  return board.map((theRow, rowIdx) =>
    theRow.map((cell, colIdx) => 
      rowIdx === row && colIdx === col
      ? counter
      : cell
    )
  )
}
```

We avoided making a new variable by just returning the result of `board.map`. We also remove the `if` statements by using a ternary operator, and the `return` keyword from the `map` functions. The test still passes, so we are good. I think both implementations are fine; pick the one that you like best.

## Vue Integration - Imperative Shell

All of the business logic is encapsulated in the `createGame()` and `makeMove()` functions. They are stateless; all the values required are received as arguments. We do need some state somewhere, as well as some mutation to actually do anything; that comes in the form of Vue's reactivity.

Let's start with the composable, `useTicTacToe()`, and get something rendering:

```js
/**
 * Vue integration layer
 * State here is mutable
 */
export function useTicTacToe() {
  const boards = ref([initialBoard])
  const counter = ref('o')

  const move = ({ col, row }) => {}

  const currentBoard = computed(() => {
    return boards.value[boards.value.length - 1]
  })

  return {
    currentBoard,
    makeMove: move
  }
}
```

I added an empty `move` function, assigning it to `makeMove` in the return value of `useTicTacToe`. We will be implementating that soon. 

Let's get something rendering:

```html
<template>
  <div v-for="row, rowIdx in currentBoard" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
      :data-test="`row-${rowIdx}-col-${colIdx}`"
      @click="makeMove({ row: rowIdx, col: colIdx })"
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup(props) {
    const { currentBoard, makeMove } = useTicTacToe()

    return {
      currentBoard,
      makeMove
    }
  }
}
</script>

<style>
.row {
  display: flex;
}

.col {
  border: 1px solid black;
  height: 50px;
  width: 50px;
}
</style>
```


[](./images/ttt-1.png)

## Integrating makeMove

The last thing we need to do is wrap the functional, stateless `makeMove` function from the functional core. This is easy:

```js
const move = ({ col, row }) => {
  const newBoard = makeMove(
    currentBoard.value,
    {
      col,
      row,
      counter: counter.value
    }
  )
  boards.value.push(newBoard)
  counter.value = counter.value === 'o' ? 'x' : 'o'
}
```

That's it! Everything now works in it's functional, immutable glory.

[](./images/ttt-2.png)

From a user point of view, nothing has changed, and we can verify this by reusing the UI test from the previous section:

```js
import { mount } from '@vue/test-utils'
import { createGame  } from './tic-tac-toe.js'

describe('TicTacToeApp', () => {
  it('plays a game', async () => {
    const wrapper = mount(TicTacToeApp)

    await wrapper.find('[data-test=row-0-col-0]').trigger('click')
    await wrapper.find('[data-test=row-0-col-1]').trigger('click')
    await wrapper.find('[data-test=row-0-col-2]').trigger('click')

    expect(wrapper.html()).toContain('data-test="row-0-col-0">o</div>')
    expect(wrapper.html()).toContain('data-test="row-0-col-1">x</div>')
    expect(wrapper.html()).toContain('data-test="row-0-col-2">o</div>')
  })
})
```

## Reflections and Philosophy

This section explores what I consider to be the difference between really good developers who write highly maintainable, robust code and those who do not; effective sepearation of concerns. 

There are some easy ways to see if you are separating your Vue UI logic from your business logic, or in a more general sense, your imperative shell from your functional core: 

- are you accessing Vue reactivity APIs in your business logic? This usually comes in the form of `.value` for accessing the values of `computed` and `ref`.
- are you relying

This also prompts another question: what and how should we be testing our functional core and imperative shell? In the previous section, we tested both in one go. This worked out fine, however, we still needed to write some UI tests with Vue Test Utils, which kind of duplicated our `useTicTacToe` composable tests.

Another problem we encountered when testing the `useTicTacToe` composable in the previous section was *cross test contamination*. This is primarily caused by shared state in tests. This wasn't a problem when testing our functional core, because there is no shared state.

Of course there is no one way to write applications, but I am more and more of the opinion that testing composables is generally not ideal. Instead, you should extract your logic into a immutable functional core with no shared state and test that. Then, you test your imperative shell, in this case the `useTicTacToe` composable, in the context of the UI - using something like Vue Test Utils.

## Exercises

- Trying adding an undo/redo functionality. This should be easy, because we keep track of each previous state in the `boards` array.
