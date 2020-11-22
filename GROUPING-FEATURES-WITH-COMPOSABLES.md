# Grouping Features with Composables

You can find the completed source code in the [GitHub repository under examples/composition](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

Vue 3's flagship feature is The Composition API; it's main selling point is to easily group and reuse code by *feature*. In this section we will see some techniques to write testable composables by building a tic tac toe game, including undo and redo.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-tic-tac-toe-done.png}
  \caption{Completed Game}
  \label{fig}
\end{figure}

The API we will end with looks like this:

```js
export default {
  setup() {
    const { 
      currentBoard, 
      makeMove,
      undo,
      redo
    } = useTicTacToe()

    return {
      makeMove,
      currentBoard
    }
  }
}
```
\begin{center}
Final API.
\end{center}

`currentBoard` is a `computed` property that looks like this:

```js
[
  ['x', 'o', '-'],
  ['x', 'o', 'x'],
  ['-', 'o', '-']
]
```
\begin{center}
Example game board represented as multi-dmensional array.
\end{center}

`makeMove` is a function that takes two arguments: `col` and `row`. Given this board:

```js
[
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

Calling `makeMove({ row: 0, col: 1 })` would yield the following board (where `o` goes first)

```js
[
  ['-', 'o', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

We will also support undo and redo, so you can go back and see see how the game progressed. Implementing this will be an exercise, and the solution is included in the final source code.

## Defining the Initial Board

Let's start with some way to maintain the game state. I will call this variable `initialBoard`:

```js
const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```
\begin{center}
Initial board.
\end{center}

Before diving too far into the game logic, let's get something rendering. Remember we want to keep a history of the game for undo/redo? This means instead of overriding the current game state each move, we should just create a new game state and push it into an array. Each entry will represent a move in the game. We also need the board to be reactive, so Vue will update the UI. We can use `ref` for this. Update the code:

```js
import { ref, readonly } from 'vue'

export function useTicTacToe() {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref([initialBoard])

  return {
    boards: readonly(boards)
  }
}
```
\begin{center}
The start of a useTicTacToe composable.
\end{center}

I made the board `readonly`; I don't want to update the game state direct in the component, but via a method we will write soon in the composable.

Let's try it out! Create a new component and use the `useTicTacToe` function:

```html
<template>
  <div v-for="row, rowIdx in boards[0]" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards } = useTicTacToe()

    return {
      boards
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
Testing out the new useTicTacToe composable.
\end{center}

Great! It works:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ttt-1.png}
  \caption{Rendered game board}
  \label{fig}
\end{figure}

## Computing the Current State

Currently the component is hard coded to use `boards[0]`. What we want to do is use the last element, which is the latest game state. We can use a `computed` property for this. Update the composable:

```js
import { ref, readonly, computed } from 'vue'

export function useTicTacToe() {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref([initialBoard])

  return {
    boards: readonly(boards),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```
\begin{center}
Getting the latest game state with a computed property.
\end{center}

Update the component to use the new `currentBoard` computed property:

```html
<template>
  <div v-for="row, rowIdx in currentBoard" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards, currentBoard } = useTicTacToe()

    return {
      boards,
      currentBoard
    }
  }
}
</script>
```
\begin{center}
Using the currentBoard computed property. 
\end{center}

Everything is still working correctly. Let's make sure everything continues to work correctly by writing some tests.

## Tests

We've written a little too much code without any tests for my liking. Now is a good time to write some, which will reveal some (potential) problems with our design.

```js
import { useTicTacToe } from './tic-tac-toe.js'

describe('useTicTacToe', () => {
  it('initializes state to an empty board', () => {
    const initialBoard = [
      ['-', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    const { currentBoard } = useTicTacToe()

    expect(currentBoard.value).toEqual(initialBoard)
  })
})
```
\begin{center}
Testing the initial game state.
\end{center}

It passes! Great. As it stands, there is no easy way to pre-set the game state - we currently cannot test a scenario where many moves have been played, without actually playing though the game. This means we need to implement `makeMove` before writing tests to see if the game has been won, since there is no way to update the board as it stands to test winning or losing scenarios. This is not ideal. Instead, let's pass in an initial state to `useTicTacToe`, for example `useTicTacToe(initialState)`.

## Setting an Initial State

Update `useTicTacToe` to receive an `initialState` argument to facilitate easier testing:

```js
import { ref, readonly, computed } from 'vue'

export function useTicTacToe(initialState) {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref(initialState || [initialBoard])

  return {
    boards: readonly(boards),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```
\begin{center}
Accept an initialState to facilitate testing.
\end{center}

Add a test to ensure we can seed an initial state:

```js
describe('useTicTacToe', () => {

  it('initializes state to an empty board', () => {
    // ...
  })

  it('supports seeding an initial state', () => {
    const initialState = [
      ['o', 'o', 'o'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    const { currentBoard } = useTicTacToe([initialState])

    expect(currentBoard.value).toEqual(initialState)
  })
})
```
\begin{center}
A test for initial state.
\end{center}

Notice we pass in `[initialState]` as an array - we are representing the state as an array to preserve the history. This allows us to seed a fully completed game, which will be useful when writing the logic to see if a player has won.

## Making a Move

The final feature we will add is the ability for a player to make a move. We need to keep track of the current player, and then update the board by pushing the next game state into `boards`. Let's start with a test:

```js
describe('makeMove', () => {
  it('updates the board and adds the new state', () => {
    const game = useTicTacToe() 
    game.makeMove({ row: 0, col: 0 })

    expect(game.boards.value).toHaveLength(2)
    expect(game.currentPlayer.value).toBe('x')
    expect(game.currentBoard.value).toEqual([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```
\begin{center}
Testing makeMove.
\end{center}

There isn't anything too surprising here. After making a move, we have two game states (initial and the current one). The current player is now `x` (since `o` goes first). Finally, the `currentBoard` should be updated.

One thing you should look out for is code like this:

```js
game.makeMove({ row: 0, col: 0 })
```

When a function is called without returning anything, it usually means it has a side-effect - for example, mutating some global state. In this case, that is exactly what is happening - `makeMove` mutates the global `board` variable. It's considered global because it is not passed into `makeMove` as an argument. This means the function is not pure - there is no way to know the new state of the game after `makeMove` is called without knowing the previous state.

Another thing I'd like to highlight is that we are accessing `.value` three times - `game.boards.value`, `game.currentPlayer.value` and `game.currentBoard.value`. `.value` is part of Vue's reactivity system. Our tests have revealed we've coupled our business logic (the tic tac toe logic) to our UI layer (in this case, Vue). This is not necessarily bad, but it's something you should always be concious of doing. The next chapter discusses this topic in more depth and suggests an alternative structure to avoid this coupling.

Back to the `makeMove` - now we have a test, let's see the implementation. The implementation is quite simple. We are using `JSON.parse(JSON.stringify())`, which feels pretty dirty - see below to find out why.

```js
export function useTicTacToe(initialState) {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref(initialState || [initialBoard])
  const currentPlayer = ref('o')

  function makeMove({ row, col }) {
    const newBoard = JSON.parse(
      JSON.stringify(boards.value)
    )[boards.value.length - 1]
    newBoard[row][col] = currentPlayer.value
    currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
    boards.value.push(newBoard)
  }


  return {
    makeMove,
    boards: readonly(boards),
    currentPlayer: readonly(currentPlayer),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```
\begin{center}
Implementing makeMove.
\end{center}

This gets the test to pass. As mentioned above we are using the somewhat dirty `JSON.parse(JSON.stringify(...))` to clone the board and lose reactivity. I want to get *non reactive* copy of the board - just a plain JavaScript array. Somewhat surprisingly, `[...boards.value[boards.value.length - 1]]` does not work - the new object is still reactive and updates when the source array is mutated. This means we are mutating the game history in `boards`! Not ideal. 

What you would need to do is this:

```js
const newState = [...boards.value[boards.value.length - 1]]
const newRow = [...newState[row]];
```

This works - `newRow` is now a plain, non-reactive JavaScript array. I don't think it's immediately obvious what is going on, however - you need to know Vue and the reactivity system really well to understand why it's necessary. On the other hand, I think the `JSON.parse(JSON.stringify(...))` technique is actually a little more obvious - most developers have seen this classic way to clone an object at some point or another.

You can pick whichever you like best. Let's continue by updating the usage:

```html
<template>
  <div v-for="row, rowIdx in currentBoard" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
      @click="makeMove({ row: rowIdx, col: colIdx })"
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards, currentBoard, makeMove } = useTicTacToe()

    return {
      boards,
      currentBoard,
      makeMove
    }
  }
}
</script>
```

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/ss-tic-tac-toe-done.png}
  \caption{Completed Game}
  \label{fig}
\end{figure}

That's it! Everything now works. The game is now playable - well, you can make moves. There are several problems:

1. No way to know if a player has won. 
2. You can make an invalid move (for example, going on a square that is already taken). 
3. Did not implement undo/redo.

Fixing/implementing these is not very difficult and will be left as an exercise. You can find the solutions in the source code. Undo/redo is probably the most interesting one - you should try and implement this yourself before looking at the solutions.

## Conclusion

We saw how you can isolate business logic in a composable, making it testable and reusable. We also discussed some trade-offs of our approach - namely, coupling the business logic to Vue's reactivity system. This concept will be further explored in the next section.

## Exercises

1. Write some tests with Testing Library to ensure the UI is working correctly. See the GitHub repository for the solutions.
2. Do not allow moving on a square that is already taken.
3. Add a check after each move to see if a player has won. Display this somewhere in the UI.
4. Implement `undo` and `redo`.

You can find the completed source code in the [GitHub repository under examples/composition](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
