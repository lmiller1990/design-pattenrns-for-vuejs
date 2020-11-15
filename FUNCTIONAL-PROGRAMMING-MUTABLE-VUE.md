# Functional Core, Imperative Shell - Immutable Logic, Mutable Vue

You can find the completed source code in the [GitHub repository under examples/composition-functional](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In the previous chapter, we build a Tic Tac Toe game, encapsulating the logic in a composable. We consciously decided to couple our implementation to Vue, when we used reactivity APIs like `computed` and `ref` in the business logic. 

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
\begin{center}
Original makeMove implemented using mutation.
\end{center}

On line 3, we mutation the `newBoard` variable. We then mutates `boards` on line 4, by pushing a new value in. In addition to this mutation, we are also using two global variables: `boards` and `currentPlayer`. If we want to approach in a functional manner, the function needs to have the following signature:

```ts
type Board = string[][]
type Options {
  col: number
  row: number
  counter: 'o' | 'x'
}

function makeMove(board: Board, { col, row, counter }: Options): Board
```
\begin{center}
The new makeMove will return an updated board based on it's arguments.
\end{center}

In other words, `makeMove` needs to receive all required arguments to create a new board, and should return a new board. This makes it pure; the return value is determined exclusively by the inputs.

This begs the question: if we cannot mutate anything, how do we get anything done? The answer is that the business logic is the *functional core*. We will then write a thin layer, the *imperative shell*, which wraps the functional core, or the business logic, in Vue's reactivity APIs. All mutation will occur in the imperative shell. 

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/functional-core-imperative-shell.jpg}
  \caption{Functional Core, Imperative Shell. Image Credit: mokagio (Twitter)}
  \label{fig}
\end{figure}

In this diagram the solid white circles represents the "functional core". These are a collection of pure functions that are written in plain JavaScript - no reactivity and no global variables.

The thin layer surrounding the solid circles represents the "imperative shell". In this system, it is the `useTicTacToe` composable - a thin layer written using Vue's reactivity system, marrying the functional business logic and the UI layer.

The solid rectangles on the right represent interactions between the system and the outside world - things like user input, updating the DOM, the response to a HTTP request to a third party system or a push notification.

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
\begin{center}
Final API does not change - only the implementation details.
\end{center}

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
\begin{center}
So far, no mutation.
\end{center}

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
\begin{center}
A simple for the initial game state.
\end{center}

## Immutable `makeMove`

Then bulk of the logic is in the `makeMove` function. To update the board, we need the current game state, the column and row to update, and the counter (`x` or `o`). So those will be the arguments we pass to the function.

```js
export function makeMove(board, { col, row, counter }) {
  // copy current board
  // return copy with updated cell
}
```
\begin{center}
The new makeMove function (without implementation).
\end{center}

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
\begin{center}
A test to guide us.
\end{center}

Let's start with a verbose implementation. Since we do not want to mutate anything, we are going to create a copy of the game state. Then we will `map` each row. In each row, we will `map` each column, and when we find the row and column the user has chosen, we will update the cell.

```js
export function makeMove(board, { col, row, counter }) {
  // loop each row with map. 
  return board.map((theRow, rowIdx) => {
    
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
\begin{center}
A verbose and heavily commented makeMove.
\end{center}

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
\begin{center}
Functional code can be very concise. Careful - readability can suffer.
\end{center}

We avoided making a new variable by just returning the result of `board.map`. We also remove the `if` statements by using a ternary operator, and the `return` keyword from the `map` functions. The test still passes, so we are good. I think both implementations are fine; pick the one that you like best.

## Vue Integration - Imperative Shell

Most of the business logic is encapsulated in the `createGame()` and `makeMove()` functions. They are stateless. All the values required are received as arguments. We do need some persisted state somewhere, as well as some mutation to do anything; that comes in the form of Vue's reactivity - the *imperative shell*.

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
\begin{center}
The composable integrates the functional core with Vue's reactivity system - the "imperative shell" around the functional core.
\end{center}

I added an empty `move` function, assigning it to `makeMove` in the return value of `useTicTacToe`. We will be implementing that soon. 

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
\begin{center}
Testing out the implementation.
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ttt-1.png}
  \caption{Rendered game board}
  \label{fig}
\end{figure}

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
\begin{center}
move is just a wrapper around the functional `makeMove`.
\end{center}

Everything now works in it's functional, loosely coupled, immutable glory.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ttt-2.png}
  \caption{Rendered game board}
  \label{fig}
\end{figure}

From a user point of view, nothing has changed, and we can verify this by reusing the UI test (first exercise from the previous section):

```js
import { mount } from '@vue/test-utils'
import TicTacToeApp from './tic-tac-toe-app.vue'

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
\begin{center}
The UI test from previous section, ensuring the behavior has not changed.
\end{center}

## Pushing Business Logic into the Functional Core

There is one last improvement we can make. We currently wrap the stateless `makeMove` function:

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

Ideally all the business logic should be in the functional core. This includes changing the counter after each move. I think this is part of the core gameplay - not the UI. For this reason I would like to push `counter.value = counter.value === 'o' ? 'x' : 'o'` into the functional core.

Update `makeMove` to change the counter after updating the board, and return an object representing the new board as well as the updated counter:

```js
export function makeMove(board, { col, row, counter }) {
  const newBoard = board.map((theRow, rowIdx) =>
    // ...
  )
  const newCounter = counter === 'o' ? 'x' : 'o'

  return {
    newBoard,
    newCounter
  }
}
```

Now `makeMove` handles updating the counter, as well as the board. Update `move` to use the new return value:

```js
const move = ({ col, row }) => {
  const { newBoard, newCounter } = makeMove(
    currentBoard.value,
    {
      col,
      row,
      counter: counter.value
    }
  )
  boards.value.push(newBoard)
  counter.value = newCounter
}
``` 

Finally, since we changed the return value, the `makeMove` test needs an update (the UI test using Vue Test Utils still passes, since the actual behavior from the user's point of view has not changed):

```js
describe('makeMove', () => {
  it('returns a new updated board and counter', () => {
    const board = createGame(initialBoard)
    const { newBoard, newCounter } = makeMove(board, {
      row: 0, 
      col: 0, 
      counter: 'o'
    })

    expect(newCounter).toBe('x')
    expect(newBoard).toEqual([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```

All the tests are now passing. I think this refactor is a good one; we pushed the business logic into the functional core, where it belongs.

## Reflections and Philosophy

This section explores what I consider to be the difference between really good developers who write highly maintainable, robust code and those who do not; effective separation of concerns. 

There are some easy ways to see if you are separating your Vue UI logic from your business logic, or in a more general sense, your imperative shell from your functional core: 

- are you accessing Vue reactivity APIs in your business logic? This usually comes in the form of `.value` for accessing the values of `computed` and `ref`.
- are you relying on global or pre-defined state?

This also prompts another question: what and how should we be testing in our functional core and imperative shell? In the previous section, we tested both in one go - they were so tightly coupled together, so this was the natural way to test them. This worked out fine, however, we still needed to write some UI tests with Vue Test Utils (which was left as an exercise), which meant we were testing a lot of logic twice - in the `useTicTacToe` composable tests and the UI tests.

There is no one true way to write applications. It is also very hard to transition an application from one paradigm to another. I am more and more of the opinion that coupling Vue's reactivity to your composables and business logic is generally not a good idea. 

Instead, you should extract your logic into a functional core that is immutable and relies on no shared state. Test this in isolation. Next, you write and test your imperative shell - in this case the `useTicTacToe` composable, in the context of the UI - using something like Vue Test Utils. These test are not testing business logic as such, but that your integration layer (the composable and Vue's reactivity) is correctly hooked up to your functional core. 

## Exercises

Repeat the exercises from the last chapter - undo/redo, defensive checks to prevent illegal moves, check if a player has won the game and display it on the UI.

You can find the completed source code in the [GitHub repository under examples/composition-functional](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
