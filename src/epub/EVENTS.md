# イベントのEmit

完全なソースコードは[GitHubリポジトリのexamples/events配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

Vueにおいて*配下の*コンポーネントにデータを渡す主要な仕組みは`props`です。一方で、コンポーネントが階層のより上位のコンポーネントと通信するには、*イベントのemit*を用います。これは、`this.$emit()`(Options APIの場合)、又は`ctx.emit()`(Composition APIの場合)を呼ぶことで実施します。

実際どのように動作するのか、いくつか具体例を見ていきましょう。同時に情報を整理して理解しやすい状態に保つためのガイドラインについても見ていきます。

## シンプルに始める

以下は、ごく最小限ですが完全に動作する`<counter>`コンポーネントです。理想的とは言えませんが、この章の中で改善していきましょう。

この例では、Options APIからスタートして、最終的にはリファクターによってComposition APIを用います（テストを書いて、ロジックが壊れていないことを試しながら進めましょう）。

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
シンプルなcounterコンポーネント。
\end{center}

ボタンが二つあります。一方は`count`の値を1ずつ増加させます。他方は現在のcountの値で`submit`イベントをemitします。自信をもってリファクターできるように、簡単なテストを書いてみましょう。

他の例と同様に、今回もTesting Libraryを使用しています。しかし、テストのフレームワークは何でも大丈夫です－重要なことは、何かを壊してしまった時にそれを知らせる仕組みを持つことです。

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import Counter from './counter.vue'

describe('Counter', () => {
  it('現在のcountでイベントをemitすること', async () => {
    const { emitted } = render(Counter) 
    await fireEvent.click(screen.getByRole('increment'))
    await fireEvent.click(screen.getByRole('submit'))
    console.log(emitted())
  })
})
```
\begin{center}
emitted()を用いてemitされたイベントを観察します。
\end{center}

`console.log(emitted())`を行うことで、Testing Libraryにおいて`emitted`がどのように動作するかを説明します。テストを走らせると、コンソールのアウトプットは以下のようになります:

```json
{ 
  submit: [ 
    [ 1 ] 
  ] 
}
```
\begin{center}
submitイベントは以下の引数を1つ伴ってemitされます: 数字の1。
\end{center}

`emitted`はオブジェクトです－それぞれのイベントがキーとなり、イベントがemitされる度に入力を配列としてマッピングします。`emit`は引数をどれだけの数でも持つことができます。`$emit('submit', 1, 2, 3,)`と書いたとすれば、アウトプットは以下のようになります:

```json
{ 
  submit: [ 
    [ 1, 2, 3 ] 
  ] 
}
```
\begin{center}
submitイベントは以下3つの引数を伴ってemitされます: 1, 2, 3。
\end{center}

メインのトピック（イベントのemitにおけるパターンとプラクティス）に移る前に、アサートを追加しましょう。

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import Counter from './counter.vue'

describe('Counter', () => {
  it('現在のcountでイベントをemitすること', async () => {
    const { emitted } = render(Counter) 

    await fireEvent.click(screen.getByRole('increment'))
    await fireEvent.click(screen.getByRole('submit'))

    expect(emitted().submit[0]).toEqual([1])
  })
})
```
\begin{center}
emitされたイベントに対してアサートを行います。
\end{center}

## Templateをクリーンに保つ

propsを渡したり、イベントを監視したり、ディレクティブを利用したりとすると、templateはすぐにカオス化します。このため、`<script>`タグにロジックを移すことで、可能な限りtemplateをシンプルに保ちたいです。そのための方法の一つは、`count += 1`と`$emit()`を`<template>`内に書くのを避けることです。`<counter>`コンポーネントで、この変更を行ってみましょう。2つの新しいメソッドを作ることでロジックを`<template>`から`<script>`タグに移しましょう:

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
emitロジックをテンプレートからスクリプトに移動します。
\end{center}

テストを走らせることで、全てが依然としてうまく動作していることを確かめることができます。いいですね。良いテストはリファクタリングに強いものです。なぜなら、良いテストはインプットとアウトプットをテストし、実装の詳細をテストしないからです。

`<template>`の中には、いかなるロジックも入れないことをお勧めします。全てを`<script>`の中に移しましょう。`count += 1`は、`<template>`の中にインラインで記述しても良いくらいにシンプルに見えるかもしれません。しかし、個人的には多少のタイピングの手間を節約することよりも、一貫性を保つことに価値を見出します。このため、私は全てのロジックを`<script>`の中に入れることにしています－それがどれだけシンプルであってもです。

もう一点、既にお気付きかもしれないのが、作成したメソッドの*命名*－`submit`についてです。これもまた個人的な好みですが、メソッドの命名に分かりやすい規則を持つことをお勧めします。以下に有益と思う2つのパターンを記載します。

1. イベントをemitするメソッドをイベント名と同名とする。例えば`$emit('submit')`を行うなら、それを呼ぶメソッドも`submit`と命名します。
2. `$this.emit()` または `ctx.emit()` を呼ぶメソッドを `handleXXX` という規則で命名する。今回の例では、関数を`handleSubmit`と命名できます。関数がコンポーネント間のやりとりを*handle*し、対応するイベントをemitするという意味です。

どちらを選ぶかはあまり重要ではありません。より望ましいと思う命名規則があれば、そちらを採用していただいても大丈夫です。ただ、命名規則を持つことは一般的に望ましいことです。一貫性は偉大です！

## Emitを宣言する

Vue 3では、propsを宣言するように、コンポーネントがemitするイベントを宣言することができ（、また推奨され）ます。これは、コンポーネントが何をしているのかを読者に伝える良い方法です。また、TypeScriptを使用するならば、より良い自動補完や型安全が利用できるでしょう。

もし上記を行わないと、ブラウザコンソールに以下の警告が表示されます: *"Component emitted event "[event name]" but it is neither declared in the emits option nor as an "[event name] prop"*. *(コンポーネントはイベントをemitしましたが、イベントはemitオプション内においても"[event name]prop"としても宣言されていません)*

コンポーネントがemitするイベントを宣言することで、他の開発者にとって（あるいは半年後のあなたにとって）、コンポーネントが何を行っていて、どのように使用するのかを理解しやすくなります。

eventは、propsの宣言と同じ方法で宣言できます。配列構文を利用する場合は以下のようになります:

```js
export default {
  emits: ['submit']
}
```
\begin{center}
低次の表現である配列構文を用いて、emitsを宣言します。
\end{center}

より冗長だが明示的なオブジェクト構文の場合は、以下のようになります:

```js
export default {
  emits: {
    submit: (count) => {} 
  }
}
```
\begin{center}
より冗長だが明示的なオブジェクト構文を用いて、emitsを宣言します。
\end{center}

TypeScriptを利用している場合は、この構文に対して（ペイロード内の型定義などの）より良い型安全が利用できます！

オブジェクト構文は*バリデーション*もサポートしています。例えば、仮想の`submit`イベントのペイロードがnumber型であることを検証することができます:

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
emitされたイベントをバリデートします。
\end{center}

バリデーターが`false`を返す場合、イベントはemitされません。

## より頑健なイベントバリデーション

アプリケーションによっては、より徹底的なバリデーションが必要かもしれません。私は防御的プログラミングを好みます。起きそうもないシナリオであっても、危ない橋を渡りたくはありません。

防御的プログラミングの欠如、及び「本番でこんなことは決して起こらないだろう」という見立てによって痛い目に合うというのは、誰もが経験することです。ほとんど通過儀礼とも言えます。この点にこそ、経験豊富な開発者がより注意深く、防御的なコードを書き、テストをたくさん書く傾向にある理由があります。

同時に、テスト、関心の分離、物事をシンプルかつモジュール式に保つことも強調したいです。これらのコンセプトを頭に入れて、このバリデーターを抽出し、より頑強なものにして、いくつかテストを加えてみましょう。

最初のステップとして、バリデーションをコンポーネントの定義の外に移しましょう。簡潔のため、コンポーネントファイル内からexportしていますが、別のモジュール（例えば、`validators`モジュール）に完全に移すこともできます。

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
カスタムのvaridator関数を用いた、より頑健なバリデーター。
\end{center}

新しい慣習が登場しました。イベントのバリデーターを`xxxValidator`と呼ぶことです。

また、`submitValidator`に変更を加えたいと思います。引数は数字で*なければなりません*。そうでなければ、良くないことが起こるでしょう。そのため、悪いことが起こるのを待つのではなく、エラーをスローしたいと思います:

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
防御的プログラミング: 大げさに失敗することは良いことです。
\end{center}

`submitValidator`は単に普通のJavaScript関数にすぎません。また、純粋関数でもあります－アウトプットはインプットのみに依存します。これは、テストを書くのは簡単だということを意味します:

```js
describe('submitValidator', () => {
  it('countがNaNの場合、エラーをスローすること', () => {
    const actual = () => submitValidator('1')
    expect(actual).toThrow()
  })

  it('countが数字の場合、trueを返すこと', () => {
    const actual = () => submitValidator(1)
    expect(actual).not.toThrow()
  })
})
```
\begin{center}
submitValidatorを分離してテストする。
\end{center}

これらの型を特定するバリデーションは、TypeScriptを使うことで部分的に軽減することができます。ただし、TypeScriptは実行時のバリデーションを提供しません。仮に（Sentryのような）エラーロギングサービスを使っているのなら、このようにエラーを投げることで、デバッグにおける有益な情報を得ることができます。

## Composition APIを用いる

`<counter>`の例では、Options APIを用いてきました。これまで議論してきたことは全てCompsition APIにも当てはまります。

実装の詳細ではなく、インプットとアウトプットをテストしているかをチェックするには、Options APIからCompsition APIに（又はその逆方向に）リファクタリングしてみるのが良いでしょう。良いテストはリファクタリングに強いものです。

早速リファクタリングを見ていきましょう:

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
完成した、バリデーションを伴うcounterコンポーネント。
\end{center}

全ては依然パスします－グッドニュースです！

## 結論

本章では、イベントのemitについて、そしてコンポーネントをクリーンかつテストしやすい状態に保つためにVueが提供する様々な方法について論じてきました。また、長期的に保守性を維持し、コードベースに一貫性をもたらすために、お勧めの慣習やベストプラクティスについても、いくつかカバーしました。

最後に、テストにおいていかにインプットとアウトプットに焦点を置くかということを見てきました（今回のケースでは、ボタンを通したユーザーインタラクションがインプットで、アウトプットはemitされた`submit`イベントです）。

eventsについては、`v-model`の章の中で再び触れます－乞うご期待！

完全なソースコードは[GitHubリポジトリのexamples/events配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

