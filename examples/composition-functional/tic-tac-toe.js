import { ref, readonly, computed } from 'vue'

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

export function makeMove(board, { col, row, counter }) {
  return board.map((theRow, rowIdx) =>
    theRow.map((cell, colIdx) => 
      rowIdx === row && colIdx === col
      ? counter
      : cell
    )
  )
}

/**
 * Vue integration layer
 * State is mutable
 */
export function useTicTacToe() {
  const boards = ref([initialBoard])
  const counter = ref('o')
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

  const currentBoard = computed(() => {
    return boards.value[boards.value.length - 1]
  })

  return {
    currentBoard,
    makeMove: move
  }
}
