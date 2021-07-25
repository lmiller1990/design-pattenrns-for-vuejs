# コンポーザブルを用いて機能をグループ化する

完全なソースコードは[GitHubリポジトリのexamples/composition配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

Vue 3のフラッグシップ機能はComposition APIです。その主要なセールスポイントは、*機能毎に*コードをグループ化して再利用することが容易な点です。この章では、（「元に戻す/やり直す」機能を含む）五目並べゲームを作成して、テストしやすいコンポーザブルを書くテクニックを見ていきましょう。

![完成したゲーム](ss-tic-tac-toe-done.png)

最終的なAPIは以下のようになります:

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
最終的なAPI
\end{center}

`currentBoard`は以下のような`computed`プロパティです:

```js
[
  ['x', 'o', '-'],
  ['x', 'o', 'x'],
  ['-', 'o', '-']
]
```
\begin{center}
多次元配列として表現したゲームの表の例。
\end{center}

`makeMove`は2つの引数: `col`, `row`をとる関数です。以下の表があったとして:

```js
[
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

`makeMove({ row: 0, col: 1 })`を呼ぶと（`o`が最初として）以下の表が生成されます:

```js
[
  ['-', 'o', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

また、「元に戻す/やり直す」機能もサポートします。そのため、前に戻ってゲームがどのように進んだのかを見ることができます。この機能の実装はエクササイズに回しますが、解法は最終的なソースコードに含まれます。

## 初期状態の表を定義する

ゲームの状態を管理する方法から始めましょう。この変数を`initialBoard`と呼びます:

```js
const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```
\begin{center}
表の初期値。
\end{center}

ゲームのロジックに深く立ち入る前に、何か表示してみましょう。「元に戻す/やり直す」を行うために、記録を残したかったことを覚えていますか？このため、各操作ごとに現在のゲームの状態を上書くのではなく、新しいゲームの状態を作成して、それを配列に追加する必要があります。それぞれの要素の登録は、ゲームにおける操作を表します。同時に、表はリアクティブにして、VueがUIを更新できるようにする必要があります。このために`ref`が使用できます。コードを更新してみましょう:

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
useTicTacToeコンポーザブルの始まり。
\end{center}

boardsは`readonly`としました。コンポーネント内で直接ゲームの状態を更新せずに、コンポーザブル内にこの後すぐ実装するメソッドを通して行いたいからです。

早速やってみましょう！新しいコンポーネントを作成し、`useTicTacToe`関数を使用します:

```html
<template>
  <div v-for="(row, rowIdx) in boards[0]" class="row">
    <div 
      v-for="(col, colIdx) in row" 
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
新しいuseTicTacToeコンポーザブルのテスト。
\end{center}

素晴らしい！うまくいきました:

![表示されたゲームの表](ttt-1.png)

## 現在の値を計算する

今のところ、コンポーネントは`boards[0]`を使うようにハードコードされています。実際にやりたいことは、最後の要素、すなわち最新のゲームの状態を利用することです。このために`computed`プロパティを使うことができます。コンポーザブルを更新してみましょう:

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
computedなプロパティを伴う最新のゲームの状態を取得。
\end{center}

コンポーネントを改善して、computedな新しい`currentBoard`プロパティを使用しましょう:

```html
<template>
  <div v-for="(row, rowIdx) in currentBoard" class="row">
    <div 
      v-for="(col, colIdx) in row" 
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
computedなcurrentBoardプロパティを使用。
\end{center}

全ては依然正しく動作します。いくつかテストを書いて、本当に全てが正しく動作し続けているのかを確かめましょう。

## テスト

私の好みに反して、テストなしで多くのコードを書きすぎてしまいました。この辺りが、テストを書くにはいい頃合いだと思います。また、テストによって設計に伴う（潜在的な）問題を明らかにできるでしょう。

```js
import { useTicTacToe } from './tic-tac-toe.js'

describe('useTicTacToe', () => {
  it('空の表に対して状態を初期化すること', () => {
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
初期状態のテスト。
\end{center}

テストは通ります！素晴らしい。しかし現状では、ゲームの状態をプリセットする簡単な方法がありません－実際にゲームを通してプレイする以外の方法で、多くの操作が行われた場合のシナリオをテストする手段がありません。そうなると、ゲームに勝ったかどうかのテストを書く前に、`makeMove`を実装する必要があります。なぜなら、現状では勝利または敗北のシナリオをテストするために表を更新する手段がないからです。これは望ましくありません。その代わりに、例えば`useTicTacToe(initialState)`のように、`useTicTacToe`に初期値を渡せるようにしましょう。

## 初期値の設定

`useTicTacToe`を更新して、`initialState`引数を受け取り、テストを簡単に行えるようにしましょう:

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
テストしやすいように初期値を許容します。
\end{center}

テストを加えて初期値を設定できるかを確かめましょう:

```js
describe('useTicTacToe', () => {

  it('空の表に対して状態を初期化すること', () => {
    // ...
  })

  it('初期値の設定をサポートすること', () => {
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
初期状態のテスト。
\end{center}

`[initialState]`を配列として渡している点に注目してください。状態を配列として表現することで、履歴を保存できるようにしています。こうすることで、完全に終了したゲームを設定でき、プレイヤーが勝ったかどうかを確かめるロジックを書く際に役立ちます。

## 操作を実装する

最後に追加すべき機能は、プレイヤーが操作できるようにすることです。現在のプレイヤーがどちらかを記録し、`boards`に次のゲームの状態を追加して、表を更新する必要があります。テストから始めてみましょう:

```js
describe('makeMove', () => {
  it('表を更新して、新しい状態を追加すること', () => {
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
makeMoveのテスト。
\end{center}

特に驚くべきところはありません。操作後に、2つのゲームの状態（初期値と現在値）があります。現在のプレイヤーは`x`です（`o`が先行のため）。最後に、`currentBoard`は更新されます。

注目すべきは以下のコードです:

```js
game.makeMove({ row: 0, col: 0 })
```

関数が何も返さずに呼ばれる場合、通常それは副産物があることを意味します－例えば、なんらかのグローバルなステートを操作することです。この場合は、まさにそれが起こっています－`makeMove`は`board`というグローバルな変数を変更します。これがグローバルであると見なすことができる理由は、`makeMove`に引数として渡されていないからです。これは、関数が純粋関数でないことを意味します－`makeMove`が呼ばれた後の新しいゲームの状態を知る方法は、前回の状態を知る以外にありません。

他に強調したい点としては、`.value`に3度もアクセスしていることです（`game.boards.value`, `game.currentPlayer.value`, `game.currentBoard.value`）。`.value`はVueのリアクティブシステムの一部です。つまり、ビジネスロジック（tic tac toeロジック）とUIレイヤー（この場合は、Vue）を結びつけてしまっていることは、テストから明らかです。これは必ずしも悪いことではありませんが、常に意識して行うべきことです。次の章ではこのトピックをより深く取り上げ、この結びつきを回避する代替構造を提案します。

`makeMove`に戻りましょう－テストはできたので、実装を見ていきましょう。実装は非常にシンプルです。`JSON.parse(JSON.stringify())`を使っていますが、非常に煩雑な感じがします－なぜそうなるのか、以下を見てください。

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
    const newBoard = JSON.parse(JSON.stringify(boards.value))[boards.value.length - 1]
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
makeMoveの実装。
\end{center}

これでテストは通ります。上で言及したように、幾分冗長な`JSON.parse(JSON.stringify(...))`を用いることで、表をクローンしてリアクティビティを失わせています。単純なJavaScriptの配列のように、*リアクティブでない*コピーが取得したいのです。多少驚くべきことに、`[...boards.value[boards.value.length - 1]]`でもうまくいきません－新しいオブジェクトは依然リアクティブであり、元の配列が操作された時に更新されてしまいます。これでは、`boards`上でゲームの履歴を操作してしまうことになります！望ましくありません。

以下のような実装が必要になります:

```js
const newState = [...boards.value[boards.value.length - 1]]
const newRow = [...newState[row]];
```

これはうまくいきます－`newRow`はこれでリアクティブでない単純なJavaScriptの配列となります。しかしながら、これでは何が起こっているのかすぐに明らかであるとは思えません。このコードがなぜ必要なのかを理解するには、Vueとリアクティブシステムをとても良く理解する必要があります。他方、`JSON.parse(JSON.stringify(...))`のテクニックは実際のところ、多少はより分かりやすいものになっています－ほとんどの開発者はオブジェクトをクローンするこの古典的な方法をどこかで見たことがあるはずだからです。

どちらか好きな方を選んでください。続けて使用方法を改善してみましょう:

```html
<template>
  <div v-for="(row, rowIdx) in currentBoard" class="row">
    <div 
      v-for="(col, colIdx) in row" 
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

![完成したゲーム](ss-tic-tac-toe-done.png)

以上です！すべてうまく動作します。ゲームはプレイ可能になりました－そうです、操作ができます。とはいえ、いくつか問題が残っています:

1. プレイヤーが勝利したか知るすべがない。
2. 不正な移動ができてしまう（例えば、すでに取られているマスに置く）
3. 「元に戻す/やり直す」機能を実装していない。

これらの問題を直して実装することはそう難しくないので、エクササイズに残しておきます。解法はソースコードをご覧ください。「元に戻す/やり直す」機能の実装がおそらく一番面白いでしょう－解法を見る前に、是非自分で試して実装してみてください。

## 結論

コンポーザブル内にビジネスロジックを分離し、テストや再利用を容易にする方法を見てきました。また、採用したアプローチのトレードオフについても議論してきました－つまり、ビジネスロジックをVueのリアクティブシステムに結び付けることです。このコンセプトについては次章で掘り下げてみましょう。

## エクササイズ

1. Testing Libraryを用いてテストを書き、UIが正しく動作しているか確かめてください。解法はGitHubリポジトリをご覧ください。
2. すでに取られているマスを操作できないようにして下さい。
3. 操作する毎にプレイヤーが勝利したかを確認するチェックを加えてください。結果をUIのどこかに表示して下さい。
4. `undo`と`redo`を実装してください。

完全なソースコードは[GitHubリポジトリのexamples/composition配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

