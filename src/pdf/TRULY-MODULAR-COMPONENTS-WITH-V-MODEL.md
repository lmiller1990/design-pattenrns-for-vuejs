# モジュラーコンポーネント、v-model、Strategyパターン

完全なソースコードは[GitHubリポジトリのexamples/reusable-date-time配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

______

この章では、再利用可能なdateコンポーネントを作ります。使用方法は以下のようになります:

```html
<date-time 
  v-model="date" 
  :serialize="..."
  :deserialize="..."
/>
```
\begin{center}
ゴール－Strategyパターンによって、どのDateTimeライブラリでも動作する<datetime>コンポーネント。
\end{center}

完成したコンポーネントは以下のようになります:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-done.png}
  \caption{完成したDateTimeコンポーネント}
  \label{fig}
\end{figure}

コンポーネントには3つのプロパティがあります: `v-model`, `serialize`, `deserialize`。`serialize`や`deserialize`が何なのかについて、詳細は後ほど議論します。

そのアイデアは、`v-model`に渡された値`date`は、開発者が望むいかなるDateTimeライブラリであっても使えるようにする、というものです。開発者にDateTimeライブラリの選択を許容し、特定のライブラリを強制しないようにしたいです。

JavaScript固有の`Date`オブジェクトを使うアプリケーションもあります（これはしないでください。あまり良いことがありません）。比較的古いアプリケーションは[Moment](https://momentjs.com/)を使っている傾向にあり、最近のものは[Luxon](https://moment.github.io/luxon/)を選択する傾向にあります。

ここでは、その両方をサポートしたいです－加えて、ユーザーが選択しうる、その他のいかなるライブラリをも！言い換えると、コンポーネントをアグノスティック※なものにしたいのです－コンポーネントは特定のDateTimeライブラリと結びつくべきでありません。

※【訳者註】ソフトウェアやハードウェアが、特定のプロトコル、プログラミング言語、オペレーティング、システムに依存しない、あるいはその仕様の詳細に関知しない設計であること。

この問題を取り扱う方法の一つは、例えば`YYYY-MM-DD`といった独自のシンプルなフォーマットを選び、コンポーネントをラップして独自のインテグレーション層を供給することでしょう。例えば、Luxonを用いたいユーザーは`<date-time>`を独自の`<date-time-luxon>`コンポーネントでラップすることになるでしょう:

```html
<template>
  <date-time
    :modelValue="date"
    @update:modelValue="updateDate"
  />
</template>

<script>
import { ref } from 'vue'
import { DateTime } from 'luxon'

export default {
  setup() {
    return {
      date: ref(DateTime.local()),
      updateDate: (value) => {
        // YYYY-MM-DD を Luxon DateTime に
        // 変換する何らかのロジック
      }
    }        
  }
}
</script>
```
\begin{center}
`<datetime>`をラッピングして、Luxonとのインテグレーションを提供します。
\end{center}

このやり方はうまくいくはずです－配布用にnpmに`<luxon-date-time>`を追加し、`luxon`を`peerDependency`として`package.json`に列挙することができます。しかし、`updateValue`を呼ぶ前に、v-model上のdateをバリデートするために別の方法を用いる人がいるかもしれませんし、`<date-time-luxon>`が提供するAPIについて異なる意見を持っている人がいるかもしれません。より柔軟に対応できないでしょうか？momentについてはどうでしょう？`<moment-date-time>`コンポーネントも作る必要があるでしょうか？

"wrapper"による解決の問題の中核にあるのは、別の抽象化－すなわち別のレイヤーを加えようとしていることです。これは望ましくありません。解決すべき問題は、ライブラリを問わない方法で`v-model`の*シリアライズ*と*デシリアライズ*を行うことです。`<date-time>`コンポーネントは、取り扱うDateTimeオブジェクトの詳細を知る必要がありません。

以下は、`<date-time>`を真にアグノスティックなもの、すなわちDateライブラリの実装の詳細を知る必要がないものにするために、私が提案するAPIです:

```html
<date-time 
  v-model="date" 
  :serialize="serialize"
  :deserialize="deserialize"
/>
```
\begin{center}
シリアライズ及びデシリアライズのプロパティを伴った<datetime>。
\end{center}

`date`はどのようなものでも構いません－`serialize`と`deserialize`は、なんらかのDateTimeオブジェクトになるであろう値を、どのように取り扱うかを`<date-time>`に伝える関数になります。このデザインパターンは"Strategy"パターンとして一般化されます。教科書的な定義は以下となります:

> コンピュータプログラミングにおいて、Strategyパターン（Policyパターンとしても知られる）とは、ソフトウェアのふるまいに関するデザインパターンであり、実行時にアルゴリズムを選択できるようにするものである。一つのアルゴリズムを直接実装する代わりに、コードは実行時に複数のアルゴリズムからどれを使うべきかの指示を受け取る(https://en.wikipedia.org/wiki/Strategy_pattern)。Strategyパターンは、アルゴリズムがそれを使用するクライアントから独立して変化することを許容する。

キーとなるのは最後の一文です。アルゴリズムの選択という責務を開発者に与えるのです。

以下の図はこのことをより明確にします:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{dt-ss-1.png}
  \caption{DateTimeのデータの流れ}
  \label{fig}
\end{figure}

この図において、`<date-time>`の内部的な実装は右側です。開発者が`v-model`に何を渡すかに関わらず、これをフレームワークを問わない表現に変換します。この場合は、`{ year: '', month: '', day: '' }`という形式です。値が更新された場合は、望む値に変換し*返し*ます。

開発者がLuxonを使用している場合、ワークフローは`luxon.DateTime()` `->` `{ year: '', month: '', day: '' }` `->` `luxon.Datetime()`のようになるでしょう。インプットとアウトプットは*どちらも*Luxon DateTimeです－開発者は内部的な表現を知ったり気を配る必要はありません。

## v-modelの基礎

Strategyパターンの実装（今回の例では`serialize`関数と`deserialize`関数）をする前に、`<date-time>`のベースを書いてみましょう。これには`v-model`を使用します。つまり、`modelValue`プロパティを受け取り、`update:modelValue`イベントをemitすることで値を更新します。シンプルに保つため、year, mounth, dayの3つの`<input>`要素のみを用います。

```html
<template>
  <input :value="modelValue.year" @input="update($event, 'year')" />
  <input :value="modelValue.month" @input="update($event, 'month')" />
  <input :value="modelValue.day" @input="update($event, 'day')" />
<pre>
Internal date is:
{{ modelValue }} 
</pre>
</template>

<script>
import { reactive, watch, computed } from 'vue'
import { DateTime } from 'luxon'

export default {
  props: {
    modelValue: {
      type: Object
    },
  },

  setup(props, { emit }) {
    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue
      if (field === 'year') {
        newValue = { year: $event.target.value, month, day }
      }
      if (field === 'month') {
        newValue = { year, month: $event.target.value, day }
      }
      if (field === 'day') {
        newValue = { year, month, day: $event.target.value }
      }
      emit('update:modelValue', newValue)
    }

    return {
      update
    }
  }
}
</script>
```
\begin{center}
datetimeのv-modelの実装。
\end{center}

使用法は以下のようになります:

```html
<template>
  <date-time v-model="dateLuxon" />
  {{ dateLuxon }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'

export default {
  components: { dateTime },
  setup() {
    const dateLuxon = ref({
      year: '2020',
      month: '01',
      day: '01',
    })

    return {
      dateLuxon
    }
  }
}
</script>
```

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-progress.png}
  \caption{Date入力フォームの表示}
  \label{fig}
\end{figure}

最終的にはLuxon `DateTime`に変更する予定なので、変数は`dateLuxon`と命名しました。現在は単なるJavaScriptオブジェクトにすぎず、`ref`を通してリアクティブとなっています。これらは全てスタンダードなやり方です－`:value`を`modelValue`と紐づけることでカスタムコンポーネントが`v-model`を使えるようにして、親コンポーネント内の元の値を`emit('update:modelValue')`で更新します。

## modelValueのためのDeserialize

内部のAPIは作り終えました。これは、`<date-time>`コンポーネントが値をどのように管理するかについてのものでした。ついでに言及すると、TypeScriptでInterfaceを書くとした場合には、以下のようになるでしょう:

```ts
interface InternalDateTime {
  year?: string
  month?: string
  day?: string
}
```

ここから`deserialize`プロパティを作成していきますが、これは（Luxonの`DateTime`オブジェクトやMomentの`Moment`オブジェクトなどの）いかなるオブジェクトをも`InternalDateTime`に変換するための関数です。これは、`<date-time>`コンポーネントが内部的に用いる表現です。

## modelValueのDeserialize

次のゴールは`deserialize`関数を書くことです。擬似コードで示すと以下のようなものです:

```js
export function deserialize(inputDateTime) {
  // inputDateTimeを { year, month, day } の
  // JSオブジェクトに変換するために必要な
  // 全処理をここに記載
  return yearMonthDateObject
```

ここではLuxonの`DateTime`を用います。新しい`DateTime`は以下のように作成できます:

```js
import { DateTime } from 'luxon'

const date = DateTime.fromObject({
  year: '2020',
  month: '10',
  day: '02'
})
```

ここでのゴールは、`v-model`から受け取ったインプットから（今回の例ではLuxonの`DateTime`から）、内部的な表現である`InternalDateTime`を取得することです。この変換はLuxonのDateTimeの場合は簡単なものです。`date.get()`に`year`, `month`, `day`を渡すだけです。結果、`deserialize`関数は以下のようになります:

```js
// valueはv-modelに渡された値で、
// 今回の例ではLuxon DateTimeとなります
// InternalDateTimeを返却する必要があります
export function deserialize(value) {
  return {
    year: value.get('year'),
    month: value.get('month'),
    day: value.get('day')
  }
}
```

使用方法も改善してみましょう:

```html
<template>
  <date-time 
    v-model="dateLuxon" 
    :deserialize="deserialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'

export function deserialize(value) {
  return {
    year: value.get('year'),
    month: value.get('month'),
    day: value.get('day')
  }
}

export default {
  components: { dateTime },

  setup() {
    const dateLuxon = ref(DateTime.fromObject({
      year: '2019',
      month: '01',
      day: '01',
    }))

    return {
      dateLuxon,
      deserialize
    }
  }
}
</script>
```

次に、`<date-time>`を改善して`deserialize`プロパティを使うようにしましょう:

```html
<template>
  <input :value="date.year" @input="update($event, 'year')" />
  <input :value="date.month" @input="update($event, 'month')" />
  <input :value="date.day" @input="update($event, 'day')" />
<pre>
Internal date is:
{{ date }} 
</pre>
</template>

<script>
import { reactive, computed } from 'vue'

export default {
  props: {
    modelValue: {
      type: Object
    },
    deserialize: {
      type: Function
    }
  },

  setup(props, { emit }) {
    const date = computed(() => {
      return props.deserialize(props.modelValue)
    })

    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue
      if (field === 'year') {
        newValue = { year: $event.target.value, month, day }
      }
      if (field === 'month') {
        newValue = { year, month: $event.target.value, day }
      }
      if (field === 'day') {
        newValue = { year, month, day: $event.target.value }
      }
      emit('update:modelValue', newValue)
    }

    return {
      update,
      date
    }
  }
}
</script>
```

主な変更は以下です:

1. `modelValue`に対して`computed`プロパティを使用して、`InternalDateTime`の表現に正しく変換できるようにする必要があります。
2. `modelValue`を更新する準備をする際に、`update`関数内の`modelValue`に対して`deserialize`を使用します。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-progress-2.png}
  \caption{Seriarizeプロパティの使用}
  \label{fig}
\end{figure}
\pagebreak
  
ここまでくれば、`deserialize`関数に対してテストを書くいいタイミングだと思います。Vueコンポーネントに対して独立して関数をエクスポートしており、Vueのリアクティブシステムを用いていないことにお気づきでしょうか。これは意図的なものです。上記は純粋関数なので、テストは非常に簡単です。簡潔のため、テストは掲載しませんが、GitHubリポジトリ上でご覧いただけます。

この実装は今のところうまく動作します－大体は。`<input>`要素に正しい値を表示できますが、値を更新することができません。`deserialize`の反対－`serialize`が必要となります。

## modelValueのSerialize

`emit('update:modelValue')`はLuxonの`DateTime`（`InternalDateTime`オブジェクトではない）と一緒に呼ばれるべきです。それが開発者が期待するところだからです。思い出してください。インプットとアウトプットは開発者が提供するいかなるDateTime Libraryであってもいいはずです。

値を変換するための`serialize`関数を書いてみましょう。これはシンプルです。偶然にも、Luxonの`DateTime.fromObject`は`InternalDateTime`と同じ形のオブジェクト - `{ year, month, day }` - をとります。Momentの場合、サンプルはより複雑になるでしょう。

```js
export function serialize(value) {
  return DateTime.fromObject(value)
}
```

再び、使用法も更新しましょう:

```html
<template>
  <date-time 
    v-model="dateLuxon" 
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'

// ...

export function serialize(value) {
  return DateTime.fromObject(value)
}

export default {

    // ...

    return {
      dateLuxon,
      deserialize,
      serialize
    }
  }
}
</script>
```

`:serialize`プロパティを追加し、`setup`関数から`serialize`を返却しました。

次に、`modelValue`を更新しようとする度に`serialize`が呼ばれる必要があります。`<date-time>`を更新しましょう:

```html
<template>
  <!-- 
    簡潔のため省略。
    現時点では何も変更なし。
  -->
</template>

<script>
import { computed } from 'vue'
import { DateTime } from 'luxon'

export default {
  props: {
    modelValue: {
      type: Object
    },
    serialize: {
      type: Function
    },
    deserialize: {
      type: Function
    }
  },

  setup(props, { emit }) {

    // ...

    const update = ($event, field) => {
      const { year, month, day } = props.deserialize(props.modelValue)
      let newValue

      // ...

      emit('update:modelValue', props.serialize(newValue))
    }

    return {
      update,
      date
    }
  }
}
</script>
```

変更点は、`serialize`プロパティを宣言して、新しい値をemitする際に`props.serialize`を呼ぶことだけです。

うまくいきました！－大体は。有効な数字を入力する限りは問題ありません。例えば、日にちに`0`を入れたら、すべての入力は`NaN`を示します。何らかのエラーハンドリングが必要です。

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-error.png}
  \caption{エラーハンドリングがないSerializing/Deserializing。}
  \label{fig}
\end{figure}
\pagebreak

## エラーハンドリング

エラーが起きた場合－値をシリアライズまたはデシリアライズできなかったいずれの場合でも－現在の値を返却し、ユーザーに修正の機会を与ましょう。

`serialize`を更新して、より防御的にしましょう:

```js
export function serialize(value) {
  try {
    const obj = DateTime.fromObject(value)
    if (obj.invalid) {
      return 
    }
  } catch {
    return 
  }

  return DateTime.fromObject(value)
}
```

値のserializeに失敗した場合、単に`undefined`と返却されます。この新しいロジックを使って`<date-time>`内の`emit`を改善してみましょう; 値が不正な場合、単純にmodelValueを更新するのをやめます:

```js
export default {
  props: {
    // ...
  },

  setup(props, { emit }) {
    // ...
    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue

      // ...

      const asObject = props.serialize(newValue)
      if (!asObject) {
        return
      }
      emit('update:modelValue', asObject)
    }

    return {
      update,
      date
    }
  }
}
```

単純に`if (!asObject)`のチェックを追加し、`props.serialize`が値を返却しなかった場合、emitの前に`return`するようにしました。

これですべてが正しく動作するようになり、`<date-time>`は日付が有効な場合にのみ`modelValue`を更新するようになりました。この振る舞いこそ私が決めた設計です。`<date-time>`がどのように動作してほしいかに応じて、異なる実装が可能です。

Momentに対するサポートを追加するのは特段難しくも面白くもありませんので、エクササイズに残しておきました。解法はソースコードに含まれます。

## デプロイ

ここでのゴールは、極めて再利用性の高い`<date-time>`コンポーネントを作成することでした。もしこれをnpmにリリースしようと思った場合、いくつかやるべきことがあります。

1. `serialize`と`deserialize`を`<date-time>`コンポーネントから除外して別のファイルに移す。ファイル名はおそらく`strategies.js`等になるだろう。
2. 人気のDateTimeライブラリ（Luxon, Moment等）のためにStrategyを複数書いておく。
3. コンポーネントとストラテジーを別々にビルド及びバンドルする。

こうすることで開発者は、"tree shaking"※の利点を得るためにwebpackやrollupといったツールを使うことができます。本番用の最終的なバンドルをビルドする際は、`<date-time>`コンポーネントと使用しているstrategyだけを含めます。また、開発者が自分たちのより特殊なstrategyを提供することもできます。

※【訳者註】実行されないコードを削除することで、JavaScriptの文脈で利用される用語（[MDN Web Docs 用語集](https://developer.mozilla.org/ja/docs/Glossary/Tree_shaking)）。

レンダーレスコンポーネントの章で説明したように、コンポーネントの再利用性をさらに高めるため、レンダーレスコンポーネントとして書き直すことも検討可能です。

## エクササイズ

- `serialize`と`deserialize`に関して一切テストを書いていません。これらは純粋関数なので、テストを加えるのは簡単です。いくつかのテストの例はソースコードをご覧ください。
- 他のdateライブラリ（例えばMoment）のサポートを加えてください。Momentへのサポートはソースコードに実装しています。
- hours, minutes, seconds, AM/PMのサポートを追加して下さい。
- Testing Libraryを用いて何かテストを書いてください。`<input>`要素の値を更新するには、`fireEvent.update`を使うことができます。

完全なソースコードは[GitHubリポジトリのexamples/reusable-date-time配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

\pagebreak
