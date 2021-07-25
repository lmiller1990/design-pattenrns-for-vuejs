# レンダーレスコンポーネント

完全なソースコードは[GitHubリポジトリのexamples/renderless-password配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

______


コンポーネントを再利用する主要な方法は*slots*です。多くの場合これはとても有用ですが、時には*より*柔軟性を必要とします。

例えば、2つの異なるインターフェースで再利用する必要がある複雑なロジックがあるといった場合です。異なるインターフェースで複雑なロジックを再利用する方法の一つに、*rederless*コンポーネントのパターンがあります。

この章では、以下の「パスワード強度チェックフォーム」コンポーネントを作成します:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-done.png}
  \caption{完成したパスワード複雑度チェックフォーム}
  \label{fig}
\end{figure}

このコンポーネントにはいくつかの要件があります。まず、これをnpm上で公開したいです。できる限り柔軟性を高めるため、"レンダーレス"コンポーネントとして知られるテクニックを利用します。つまり、コンポーネントは特定のマークアップを提供しません。その代わり、開発者はそれを自前で用意する必要があります。

つまり、`<template>`がコンパイルされた結果生成される、より低次元のJavaScriptである`render`関数を使う必要があるということです。そうすることで、開発者は自分が望ましいと思う方法でマークアップとスタイルを完全にカスタマイズすることができます。

以下の機能をサポートしたいと思います:

- `matching`変数: パスワードとパスワードの確認がマッチした場合にtrueを返却する。
- `minComplexity`プロパティのサポート: デフォルトでは、複雑度の最小値は0で最大値は3となる。これは、上のスクリーンショット内で送信ボタン上部の黄色のバーとして表現される。
- 複雑度のカスタムアルゴリズムのサポート（e.g. パスワード内に特定の文字列や数値を要求する）。
- パスワードとパスワードの確認が一致し、パスワードが複雑度の最小値を満たした場合にtrueとなる、値`valid`を返却する。

早速やってみましょう。

## マークアップなしのレンダリング

これから`renderless-password.js`というファイル上で作業していきます。そうです－`vue`ファイルではありません。その必要はありません－`<template>`を利用しないからです。

```js
export default {
  setup(props, { slots }) {
    return () => slots.default({
      complexity: 5
    })
  }
}
```
\begin{center}
setupまたはrenderでslots.default()を返却するレンダーレス関数。
\end{center}

これがレンダーレスコンポーネントの使い方です。オブジェクトを入れて`slots`を呼ぶことで、オブジェクトに渡したどんなプロパティも、`v-slot`ディレクティブを通じて表示することができます。

これから実際の使い方を見ていきますが、通常の`vue`ファイル上のコンポーネントを使ってみましょう。今回の例では`app.vue`となります。完全なバージョンはソースコードをご覧ください。

```html
<template>
  <renderless-password 
    v-slot="{ 
      complexity
    }"
  >
    {{ complexity }}
  </renderless-password>
</template>

<script>
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  }
}
</script>
```
\begin{center}
renderless-passwordを試してみます。
\end{center}

`v-slot`内で`slots.default()`に渡されたオブジェクトを取り出して、`<template>`の中でどのようにでも好きに利用できます。素晴らしいですね！現在はただ5を表示しているだけなので、あまり面白くありませんが、`v-slot`を通してプロパティを表示するというアイデアを説明しています。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss1.png}
  \caption{slots.default()とv-slotを用いたレンダリング}
  \label{fig}
\end{figure}

## パスワードとパスワードの確認の入力を追加する

次に追加する機能はパスワードとパスワードの確認のフィールドです。さらに`matching`プロパティも追加することで、パスワードとパスワードの確認が等しいかを確認します。

最初に、`renderless-password.js`を更新して、`password`と`confirmation`のプロパティを受け取るようにしましょう。また、パスワードが一致したかを確認するロジックも加えます:

```js
import { computed } from 'vue'

export function isMatching(password, confirmation) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}

export default {
  props: {
    password: {
      type: String
    },
    confirmation: {
      type: String
    }
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
      props.password, props.confirmation))

    return () => slots.default({
      matching: matching.value
    })
  }
}
```
\begin{center}
パスワードとパスワードの確認が合致するかをチェック。
\end{center}

`isMatching`を独立した関数として実装してエクスポートしている点にお気づきかもしれません。`isMatching`をUIではなく*ビジネスロジック*の一部と見なしたので、分離させることにしました。そうすることでテストが非常に容易になりますし、`setup`関数を優れて簡潔に保つことができます。`setup`の中で宣言するスタイルの方がお好みであれば、そうすることも可能です。

また、`slots.default()`から`complexity: 5`を取り除きました。後ほどこの話題に戻りますが、今すぐには使いません。

`slots.default()`に`matching.value`を渡す必要があるのか、と驚かれたかもしれません。これは、開発者に`matching`を`v-slot="{ matching }"`という形で取得してほしいからです。そうしなければ、`v-slot="{ matching: matching.value }"`という形で取得することになりますが、個人的には前者の方がスッキリしていると思います。

早速試してみましょう:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching
    }"
  >
    <div class="wrapper">
      <div class="field">
        <label for="password">Password</label>
        <input v-model="input.password" id="password" />
      </div>
      <div class="field">
        <label for="confirmation">Confirmation</label>
        <input v-model="input.confirmation" id="confirmation" />
      </div>
    </div>

    <p>Matches: {{ matching }}</p>

  </renderless-password>
</template>

<script>
import { reactive } from 'vue'
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  },

  setup(props) {
    const input = reactive({
      password: '',
      confirmation: ''
    })

    return {
      input
    }
  }
}
</script>
```
\begin{center}
パスワードとパスワードの確認はリアクティブなオブジェクトに保存されます。
\end{center}

大きな違いは、`password`と`confirmation`をプロパティとして持つ、`reactive`なinputがある点です。1つは`password`に対して、もう1つは`confirmation`に対して、`ref`を2回使うこともできたはずです。関連するプロパティは`reactive`を用いてグループ化したかったので、ここでは`reactive`を使用しました。

いくつか追加で`<div>`エレメントとclassを加えましたが、これは主にスタイルのためです。最終的なスタイルはソースコードでご覧いただけます。コンポーネントは以下のようになります:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss2.png}
  \caption{インプットとデバッグ情報の表示}
  \label{fig}
\end{figure}

うまくいきました！複雑な部分やビジネスロジックは、`renderless-password`内に望ましい形で抽出されました。開発者はこのロジックを使って、アプリケーションやユースケースに適するように、コンポーネントをスタイルすることができます。

続いて、カスタマイズ可能な`complexity`機能を追加して、パスワードの複雑度が十分かを評価してみましょう。

## パスワードの複雑度の追加

今から、非常に繊細な複雑度チェックを実装していきます。ほとんどの開発者はこれをカスタマイズしたいと思うでしょう。今回の例では、シンプルに保つため、パスワードの長さに基づいて複雑度を評価するアルゴリズムを採用します:

- 高: length >= 10
- 中: length >= 7
- 低: length >= 5

`isMatching`の場合と同様に、`calcComplexity`を純粋関数にしましょう。その方が、疎結合で、決定論的であり、テストしやすいです。

```js
import { computed } from 'vue'

export function isMatching() {
  // ...
}

export function calcComplexity(val) {
  if (!val) {
    return 0
  }

  if (val.length >= 10) {
    return 3
  }
  if (val.length >= 7) {
    return 2
  }
  if (val.length >= 5) {
    return 1
  }

  return 0
}

export default {
  props: {
    // ...
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
      props.password, props.confirmation))
    const complexity = computed(() => calcComplexity(
      props.password))

    return () => slots.default({
      matching: matching.value,
      complexity: complexity.value
    })
  }
}
```
\begin{center}
シンプルなcalcComplexity関数を追加します。
\end{center}

全体的に、`isMatching`関数とcomputedな`matching`プロパティを使った場合と非常に似ています。将来的には、カスタムの複雑度関数をpropを通して渡す機能をサポートしましょう。

それではさっそく使ってみましょう:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching,
      complexity
    }"
  >
    <div class="wrapper">
      <div class="field">
        <label for="password">Password</label>
        <input v-model="input.password" id="password" />
      </div>
      <div class="field">
        <label for="confirmation">Confirmation</label>
        <input v-model="input.confirmation" id="confirmation" />
      </div>
      <div class="complexity-field">
        <div
          class="complexity"
          :class="complexityStyle(complexity)"
        />
      </div>
    </div>

    <p>Matches: {{ matching }}</p>
    <p>Complexity: {{ complexity }}</p>

  </renderless-password>
</template>

<script>
import { reactive } from 'vue'
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  },

  setup(props) {
    const input = reactive({
      password: '',
      confirmation: ''
    })

    const complexityStyle = (complexity) => {
      if (complexity >= 3) {
        return 'high'
      }
      if (complexity >= 2) {
        return 'mid'
      }
      if (complexity >= 1) {
        return 'low'
      }
    }

    return {
      input,
      complexityStyle
    }
  }
}
</script>

<style>
/**
  簡潔性のためにスタイルの一部を省略
  完全なスタイルはソースコードをご覧ください
*/
.complexity {
  transition: 0.2s;
  height: 10px;
}

.high {
  width: 100%;
  background: lime;
}

.mid {
  width: 66%;
  background: yellow;
}

.low {
  width: 33%;
  background: red;
}
</style>
```
\begin{center}
computeされたスタイルに基づいてフォームをスタイリング。
\end{center}

また、`complexityStyle`関数を追加して、複雑度に応じて異なるCSSクラスを適用するようにしました。今回は意識的に、`setup`の外部に関数を定義してエクスポート*しない*ことを選択しました－その代わり、`setup`の*中に*定義しています。

この理由は、コンポーネントに対して`complexityStyle`を独立してテストすることに意味を見出さないからです－正しいクラス (`high`, `mid`, `low`) が返却されたかを知るだけでは十分ではありません。このコンポーネントを十分にテストするには、DOMに対するアサートが必要です。

もちろん`complexityStyle`をエクスポートして個別にテストすることは可能ですが、正しいクラスが適用されたかをテストすることは依然として必要です（例えば、`:class="complexityStyle(complexity)"`のコードを忘れることはあり得ますが、`complexityStyle`のテストはパスしてしまいます）。

テストを書いてDOMに対してアサートすることで、間接的に`complexityStyle`をテストできます。テストは以下のようになるでしょう（実際に動作するサンプルはソースコードをご覧ください）:

```js
it('デフォルトの条件を満たすこと', async () => {
  render(TestComponent)

  await fireEvent.update(
    screen.getByLabelText('Password'), 'this is a long password')
  await fireEvent.update(
    screen.getByLabelText('Confirmation'), 'this is a long password')

  expect(screen.getByRole('password-complexity').classList)
    .toContain('high')
  expect(screen.getByText('Submit').disabled).toBeFalsy()
})
```
\begin{center}
複雑度を満たしたクラスが含まれるかどうかのテスト。
\end{center}

アプリケーションは現在以下のようになっています:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss3.png}
  \caption{複雑度インジケーター}
  \label{fig}
\end{figure}

## フォームの妥当性を検証する

最後の機能を追加しましょう: `valid`プロパティが`true`の場合だけ活性化するボタンです。`valid`プロパティは`<renderless-password>`によって提供され、`v-slot`を通してアクセスします。

```js
import { computed } from 'vue'

export isMatching() {
  // ...
}

export calcComplexity() {
  // ...
}

export default {
  props: {
    minComplexity: {
      type: Number,
      default: 3
    },
    // ... その他のprops ...
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
          props.password, props.confirmation))
    const complexity = computed(() => calcComplexity(
          props.password))
    const valid = computed(() => 
        complexity.value >= props.minComplexity && 
        matching.value)

    return () => slots.default({
      matching: matching.value,
      complexity: complexity.value,
      valid: valid.value
    })
  }
}
```
\begin{center}
matchingとcomplexityに由来する、computedなvalidプロパティを用いたフォームの検証。
\end{center}

`complexity`と`matching`の結果に基づく、computedな`valid`プロパティを追加しました。これを個別にテストしたい場合、独立した関数とすることもできます。このnpmを配布したい場合には、恐らく私もそうするでしょう。今回はその代わりに、`valid`をボタンの`disabled`属性にバインディングすることで、これを間接的にテストすることができます。これからそれを行い、属性が正しく付与されたかDOMに対してアサートしましょう。

`valid`をバインドした`<button>`を追加してみましょう:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching,
      complexity,
      valid
    }"
  >
    <div class="wrapper">
      <! -- ... omitted for brevity ... --> 
      <div class="field">
        <button :disabled="!valid">Submit</button>
      </div>
    </div>

    <p>Matches: {{ matching }}</p>
    <p>Complexity: {{ complexity }}</p>

  </renderless-password>
</template>
```
\begin{center}
validを取り出してバインドします。
\end{center}

うまくいきましたね！また、要素を変更することで、簡単に`<renderless-password>`の見映えや操作感を変えることができます。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-done.png}
  \caption{完成したパスワードの複雑度チェックコンポーネント}
  \label{fig}
\end{figure}

おもしろ半分で、代替のUIを作ってみました。必要なことは、マークアップを変更することだけです:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-alt.png}
  \caption{代替のパスワードの複雑度チェックコンポーネント}
  \label{fig}
\end{figure}

他に思い付くことを考えてみましょう。レンダーレスコンポーネントのパターンには改良の余地が多く残されていると思います。少なくとも一つ、レンダーレスコンポーネントを利用したプロジェクトがあります。Headless UIです－インスピレーションをより得るためにチェックしてみてください: https://headlessui.dev/

## エクササイズ

この章では、コンセプトに集中するために、意図的にテストを省略しましたが、テストに関するいくつかのテクニックについては言及しました。練習のために、以下のテストを書いてみて下さい（答えはソースコードをご覧ください）:

- Testing Libraryを用いて、正しいcomplexityクラスが適用されているかアサートするテスト。
- ボタンが正しく非活性になるかのテスト。

加えて、ビジネスロジックに対するテストを書いて、エッジケースを見落としていないか確かめることもできます:

- `calcComplexity`関数と`isMatching`関数を独立してテストする。

いくつかの機能改善を試してみることもできます:

- 開発者が独自の`calcComplexity`関数をpropとして渡せるようにする。渡された場合はそちらを使う。
- カスタムの`isValid`ファンクションをサポートし、`password`, `confirmation`, `isMatching`, `complexity`を引数とする。

完全なソースコードは[GitHubリポジトリのexamples/renderless-password配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

\pagebreak
