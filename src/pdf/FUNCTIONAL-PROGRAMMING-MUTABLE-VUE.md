# Functional CoreとImperative Shell－不変のロジックと可変のVue

完全なソースコードは[GitHubリポジトリのexamples/composition-functional配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

______

前の章では、五目並べゲームを作成し、ロジックをコンポーザブルの中にカプセル化しました。ビジネスロジックの中で`computed`や`ref`といったリアクティブなAPIを使う際には、意図してビジネスロジックの実装とVueを結びつけることにしました。

この章では、"functional core, imperative shell"が最大の特徴であるパラダイムについて考察します。この命名とそれが何を意味するかは、後ほどすぐに説明します。

本章の目的は、Tic Tac Toeロジックをより関数プログラミングのパラダイムに沿ったものにすることです－つまり、純粋関数と値の不変性のことです。値の変更を避けるというのは、ロジックを（値の操作と副次的効果に依存した）Vueのリアクティブシステムから分離するということです。

まずは、値の操作だらけの`makeMove`から始めましょう。前章の実装では、`makeMove`は以下のようになりました:

```js
function makeMove({ row, col }) {
  const newBoard = [...boards.value[boards.value.length - 1]]
  newBoard[row][col] = currentPlayer.value
  currentPlayer.value  = currentPlayer.value === 'o' ?  'x' : 'o'
  boards.value.push(newBoard)
}
```
\begin{center}
値の操作を用いて実装された、オリジナルのmakeMove。
\end{center}

3行目で`newBoard`変数を操作しています。次に4行目で、新しい値をプッシュして`boards`を操作しています。また、2つのグローバル変数: `boards`と`currentPlayer`を使用しています。関数指向的な方法でアプローチするには、関数が必要とする全てのデータを引数として持ち、グローバル変数に依存しないようにする必要があります。グローバル変数に依存してしまうと、関数はもはや決定論的なものでなくなってしまいます（つまり、グローバル変数の値を知ることなしに返却される値を知ることができなくなります）。つまり、`makeMove`は以下の用法に従う必要があります:

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
新しいmakeMoveは、引数に基づき更新された表を返却します。
\end{center}

言い換えると、`makeMove`は新しい表を作るのに必要な全ての引数を受け取る必要があり、新しい表を返却すべきということです。こうすることで`makeMove`は純粋関数になります。返却値はインプットによってのみ決定されます。

もしかしたら、「何も値を操作することができないとすれば、どうやってコーディングすればいいのか？どうやってUIを更新したらいいのか？」と疑問をお感じかもしれません。

## Functional CoreとImperative Shell

答えは、値の変更を避けるのはビジネスロジックの中でのみ、という点にあります。これがパラダイムにおける"functional core"の部分です。DOMの更新やユーザーによる入力のリスニングといった、あらゆる副次的作用や操作、予測不能な行動は、薄いレイヤーで取り扱われます。この薄いレイヤーこそが、パラダイムにおける*imperative shell*の部分です。imperative shellはfunctional core（すなわちビジネスロジック）をVueのリアクティブシステムでラップします。全ての値の操作はimperative shellの中で起こります。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{functional-core-imperative-shell.jpg}
  \caption{Functional CoreとImperative Shell。クレジット: mokagio (Twitter)}
  \label{fig}
\end{figure}

この図の中で、複数の白い円が"functional core"を表しています。これは単純なJavaScriptで書かれた純粋関数の集合で、リアクティブでなく、グローバル変数も存在しません。これは、これから書き直す新しい`makeMove`関数のようなメソッドを含みます。

円を囲む薄い層は"imperative shell"を表します。このシステムでは、`useTicTacToe`コンポーザブルが該当します－Vueのリアクティブシステムを用いて書かれたレイヤーで、純粋関数のビジネスロジックとUIレイヤーを結びつけます。

右側の四角は、システムと外部の世界とのやり取りを表現しています－ユーザーの入力やDOMの更新、サードパーティーのシステムへのHTTPリクエストに対するレスポンス、通知のプッシュなどです。

ビジネスロジックを値の操作から分離することで、テストは非常に容易になります。次にimperative shell、あるいはVueとの統合をテストします。その際は、（まさにそのために設計されたライブラリである）Testing Libraryを使い、Vueコンポーネントをテストします。複雑な部分やエッジケースは全てfunctional coreのテストでカバーされているので、そんなに多くのテストは不要です。

最終的なAPIは同じ形となります:

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
最終的にAPIは変わりません－実装の詳細が変わるだけです。
\end{center}

## ビジネスロジック－Functional Core

まずはfunctional coreである`createGame`関数から始めましょう:

```js
/**
 * フレームワークに依存しない
 * 中核のロジック
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
これまでのところ、値の操作はありません。
\end{center}

`createGame`を引数を渡さずに作ることもできましたが、引数を渡すことでテスト用の初期状態の設定が容易になります。また、グローバル変数に依存するのを避けました。

テストは些細なものでほとんど記載の必要もありませんが、ひとまずやってみましょう:

```js
describe('useTicTacToe', () => {
  it('空の表に対して状態を初期化すること', () => {
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
ゲームの初期状態のためのシンプルなテスト。
\end{center}

## 不変の`makeMove`

ほとんどのロジックは`makeMove`関数の中にあります。表をアップデートするためには、現在のゲームの状態、アップデートする行と列、順番（`x`または`o`）が必要です。そのため、これらは関数に渡す引数となります。

```js
export function makeMove(board, { col, row, counter }) {
  // 現在の表をコピー
  // マスを更新したコピーを返却
}
```
\begin{center}
新しいmakeMove関数（実装を除く）。
\end{center}

2つの引数を持つようにしたいと思います。最初の引数は`board`で、"主要な"引数と考えます。`col`, `row`, `counter`はオブジェクトとして実装することとしました。というのも、それらは"オプション"であると考えられ、プレイヤーが行った操作により変化するものだからです。

先に進める前に、テストは有益です。最初に`makeMove`を冗長な方法で実装し、それをリファクターします。テストすることでリファクターの間、何も壊れていないことを確かめることができます。

```js
describe('makeMove', () => {
  it('更新された新しい表を返却すること', () => {
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
道しるべとなるテスト。
\end{center}

冗長な実装から始めてみましょう。`map`を使って各行に対して繰り返し処理を行います。さらに各行において、各列に対して`map`処理を行います。ユーザーが選択した行と列に当たった場合は、マスを更新します。そうでなかった場合は、単に現在のマスを返却します。

```js
export function makeMove(board, { col, row, counter }) {
  // mapを用いて各行に対してループ処理をする
  return board.map((theRow, rowIdx) => {
    
    // 各行において、mapを用いて各列に対してループ処理をする
    return theRow.map((cell, colIdx) => {

      // ユーザーが選択した行と列に当たった場合、
      // 順番(oまたはx)を返却する。
      if (rowIdx === row && colIdx === col) {
        return counter
      }
      // それ以外の場合、単に現在のマスを返却する。
      return cell
    })
  })
}
```
\begin{center}
冗長でコメントを多用したmakeMove。
\end{center}

テストがパスしました！何が起こっているか明確にするためにコメントを書きました。今までにこういったタイプのコードを見たことがなければ、少し理解しづらいかも知れません－私も以前はそうでした。forを用いた繰り返し処理の代わりに、`map`や`reduce`といったツールを使うことに一度慣れると、こちらのスタイルの方がより簡潔で、（さらに重要なことには）バグが発生しづらいと考えるようになりました。

上記をはるかに簡潔にすることができます！しかしこれはオプションです。冗長だが明瞭なコードにも一定のメリットがあります。簡潔なバージョンを見てみましょう。どちらの方がより読みやすいと思うか、ご自身で決めてください。

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
中核となるコードは極めて簡潔にできます。が、注意してください－可読性が犠牲になる可能性もあります。
\end{center}

`board.map`の結果を返却することで、新しい変数を作ることを避けました。また、三項演算子を用いることで`if`ステートメントを除外し、`map`関数から`return`キーワードを除外しています。テストは依然パスしますので、リファクターはうまくいったと確信を持つことができます。私はどちらの実装も問題ないと考えます。望ましいと思う方を選択してください。

## Vueとの統合－Imperative Shell

ほとんどのビジネスロジックは`createGame()`や`makeMove()`の中にカプセル化されています。これらはステートレスです。必要な全ての値は引数として受け取ります。どこかで永続的なステートを持ち、DOMを更新する操作が必要となります。これらはVueのリアクティブシステムの形式をとります－つまり、*imperative shell*です。

`useTicTacToe()`コンポーザブルから始めて、何か表示してみましょう:

```js
/**
 * Vueとのインテグレーション層
 * ここでのステートは可変です
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
コンポーザブルがfunctional coreとVueのリアクティブシステムを統合します－functional coreを囲む"imperative shell"です。
\end{center}

空の`move`関数を加え、`useTicTacToe`の返却値の中で`makeMove`に割り当てましたが、後ほどすぐに実装します。

何か表示してみましょう:

```html
<template>
  <div v-for="(row, rowIdx) in currentBoard" class="row">
    <div 
      v-for="(col, colIdx) in row" 
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
実装を行っていきます。
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ttt-1.png}
  \caption{表示されたゲームの表}
  \label{fig}
\end{figure}

## makeMoveの統合

最後にやるべきことは、純粋関数的でステートレスな`makeMove`関数をfunctional coreから取り出してラップすることです。実装は簡単です:

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
moveは、中核となる`makeMove`を囲むラッパーに過ぎません。
\end{center}

これですべてが純粋関数的、疎結合、不変な状態で動作するようになりました。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ttt-2.png}
  \caption{表示されたゲームの表}
  \label{fig}
\end{figure}

ユーザーの視点から見ると、何も変わっていません。このことはUIテストを再利用することで検証できます（前章の最初のエクササイズです）:

```js
import { render, fireEvent, screen } from '@testing-library/vue'
import TicTacToeApp from './tic-tac-toe-app.vue'

describe('TicTacToeApp', () => {
  it('ゲームをプレイすること', async () => {
    render(TicTacToeApp)

    await fireEvent.click(screen.getByTestId('row-0-col-0'))
    await fireEvent.click(screen.getByTestId('row-0-col-1'))
    await fireEvent.click(screen.getByTestId('row-0-col-2'))

    expect(screen.getByTestId('row-0-col-0').textContent).toContain('o')
    expect(screen.getByTestId('row-0-col-1').textContent).toContain('x')
    expect(screen.getByTestId('row-0-col-2').textContent).toContain('o')
  })
})
```
\begin{center}
前章から持ってきたUIテスト。振る舞いが変わっていないことを確かめます。
\end{center}

## ビジネスロジックをFunctional Coreに移動させる

最後に一つ、改善できる点があります。現在、ステートレスな`makeMove`関数をラップしました:

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

理想的には、全てのビジネスロジックはfunctional coreの中にあるべきです。これには各操作後の順番の変更も含まれます。これはUIではなく、ゲームプレイの中核の一部だと考えられます。このため、`counter.value === 'o' ? 'x' : 'o'`をfunctional core内に移動させたいと思います。

`makeMove`を更新して、表を更新した後に順番を変更し、新しい表と更新された順番を表すオブジェクトを返却するようにしましょう:

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

これで`makeMove`は、表に加えて順番の更新を取り扱えるようになりました。新しい返却値を用いて`move`を更新しましょう:

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

最後に、返却値を変更したので、`makeMove`のテストを更新する必要があります（Testing Libraryを用いたUIテストは依然パスします。というのも、ユーザー視点からみた実際の振る舞いは変わっていないからです）:

```js
describe('makeMove', () => {
  it('新しい表と順番を返却すること', () => {
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

これですべてのテストが通ります。このリファクターはいいことだと思います。ビジネスロジックを本来所属すべきfunctional core内に移動させたからです。

## 考察と哲学

この章では、偉大な開発者をその他大勢と区別する（と私が考える）コンセプトについて考察しました。関心の分離とはまさに、関数は何をすべきで、システムの異なる部分のどこに線を引くべきかを理解することです。

VueのUIロジックがビジネスロジックから分離しているか、より一般的にはimperative shellがfunctional coreから分離しているか、見分ける簡単な方法があります:

- ビジネスロジックの中でVueのリアクティブなAPIにアクセスしているか？これは一般的に`computed`や`ref`の値にアクセスするための`.value`という形式をとります。
- グローバルな、あるいは前もって定義された状態に依存しているか？

これはさらなる疑問をもたらします。functional coreやimperative shellの中で、何に対するどのようなテストを行うべきか？という疑問です。前の章では、両方をいっぺんに行いました－双方は固く結びついていたので、このようなテストは自然な方法でした。非常にシンプルなコンポーザブルではうまくいきましたが、コンポーザブルはすぐに複雑になってしまうかもしれません。ビジネスロジック周りでは多くのテストをしておきたいです。ビジネスロジックをこの章で行ったように純粋関数として書けば、テストは非常に簡単となり、とても早く動作します。

imperative shellのテスト（この場合はTesting Libraryを用いたVueのUIレイヤーのテスト）をする際には、ユーザーの視点に立ったより高度なレベルのテストに注力したいです－つまり、ボタンをクリックして、正しいテキストやDOM要素が表示されているかをアサートする、といったテストです。imperative shellはfunctional coreがどのように動作するかを知りません（また、知るべきではありません）－これらのテストは、ユーザーの視点からアプリケーションのふるまいをアサートすることに注力します。

アプリケーションを書くのに唯一正しい方法というのは存在しません。また、アプリケーションを値の操作に非常に依存したパラダイムから、この章で議論したようなスタイルに移行することは非常に難しいです。Vueのリアクティブシステムをコンポーザブルやビジネスロジックと結びつける方法は一般的に良いアイデアではないと、私は近年ますます考えるようになりました－このシンプルな分離によって、予測やテストがはるかに容易になり、一方で欠点は非常に少ないです（多少コードは増えるでしょうが、大した問題ではないと考えています）。

ロジックは、不変であり共有されたステートに依存しないfunctional coreに抽出すべきです。そしてこれを個別にテストします。次に、imperative shellを実装してテストします－この章の文脈では、`useTicTacToe`コンポーザブルになります。テストはTesting Library（または似たようなUIテストフレームワーク）を用いることになります。これらのテストはビジネスロジックはあまり検証せず、インテグレーション層（コンポーザブルやVueのリアクティブシステム）がfunctional coreと正しく連動しているかを検証します。

## エクササイズ

前章のエクササイズを繰り返してみましょう－「元に戻す／やり直す」機能、不正な操作を防ぐ防御的なチェック、プレイヤーが勝利したことをチェックしてそれをUI上に表示すること、です。

完全なソースコードは[GitHubリポジトリのexamples/composition-functional配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

\pagebreak
