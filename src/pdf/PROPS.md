# Propsのテストにおけるデザインパターン

完全なソースコードについては、[GitHubリポジトリのexmples/props配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)をご覧ください: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

______

この章では、`props`について論じます。また、テストを書く上で考慮すべきことも見ていきます。こちらは、より基礎的で重要なトピックに繋がっていきます。すなわち、ビジネスロジックとUIの間に明確な線を引くこと、つまり*関心の分離*についてです。そしてテストがどのようにしてこれらの区別を明確にするのに役立つかを見ていきましょう。

VueやReactといったフレームワークの背景にある、大きな概念の一つについて考えてみましょう:

\begin{center}
ユーザーインターフェースは、データにとってのある種の関数である。
\end{center}

このアイデアは様々な形で現れます。その一つは"データ駆動インターフェース"です。これは、基本的にユーザーインターフェース(UI)はデータの内容によって決定されるべきであるというものです。Xというデータを与えれば、UIはYになるべき、ということです。コンピュータサイエンスの分野では、*決定論*として言及されます。以下の`sum`関数を例に見てみましょう:

```js
function sum(a, b) {
  return a + b
}
```
\begin{center}
シンプルなsum関数。これは純粋関数です。
\end{center}

`a`と`b`が同じ値で呼ばれれば、常に同じ結果を得ることになります。結果はあらかじめ決まっていると言えます。これが*決定論的*ということの意味です。純粋関数でない関数の例は以下のようなものでしょう:

```js
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```
\begin{center}
純粋でない関数－副次的効果を持っています。理想的ではありませんが、ほとんどのシステムで何かしら有益なことをする時に必要です。
\end{center}

これは純粋関数*ではありません*。なぜなら外部のリソースに依存しているからです－このケースではAPIとデータベースに依存しています。関数が呼ばれる際にデータベースの中身が何であるかによって、異なる結果を得ることになるでしょう。これは*予測不可能*ということです。

これが`props`とどう関係があるのでしょうか？`props`の値に基づいて何が表示されるか決まるコンポーネントを想像してみて下さい（ここでは、まだ`data`、`computed`、`setup`については気にしなくて大丈夫です。しかし同じアイデアが当てはまることは、本書を通してご理解いただけるでしょう）。コンポーネントを関数、`props`を引数と考えると、`props`に同じ値を与えれば、コンポーネントは常に同じ内容を表示すると理解できるでしょう。結果は決定論的に決まっています。コンポーネントに`props`としてどの値を渡すかを決めれば、テストは簡単です。なぜなら、コンポーネントの中身がどのようになるかは完全に明らかだからです。

## 基本

propsを宣言する方法はいくつかあります。今回の例では`<message>`コンポーネントを使っていきましょう。実際のソースは`examples/props/message.vue`をご覧ください。

```html
<template>
  <div :class="variant">Message</div>
</template>

<script>
export default {
  // 'success', 'warning', 'error'のいずれかの値をとります
  props: ['variant']
}
</script>
```
\begin{center}
低次の表現である配列構文を用いて、variantプロパティを宣言します。
\end{center}

この例では、配列構文: `props: ['variant']`によってpropsを宣言しています。配列構文を用いるのは避けることをお勧めします。オブジェクト構文を用いることで、`variant`がとりうる値の形式について、読者により多くの洞察を与えることができます:

```js
export default {
  props: {
    variant: {
      type: String,
      required: true
    }
  }
}
```
\begin{center}
高次の表現であるオブジェクト構文を用いて、variantプロパティを宣言します。
\end{center}

TypeScriptを使っている場合はなお良いです－型を作りましょう:

```ts
type Variant = 'success' | 'warning' | 'error'

export default {
  props: {
    variant: {
      type: String as () => Variant,
      required: true
    }
  }
}
```
\begin{center}
TypeScriptを用いて、強力に型付けされたvariantプロパティ
\end{center}

`<message>`の例では、通常のJavaScriptを用います。そのため、TypeScriptの例のように、`variant`プロパティの値を特定の文字列に限定することはできません。しかし、他のパターンを採用することができます。

`variant`プロパティを`required`にしましたが、さらに受け取る文字列の値を特定の集合に限定したいです。Vueは`validator`キーを用いることで、propsをバリデートすることを可能にします。これはこのように用います:

```js
export default {
  props: {
    variant: {
      validator: (val) => {
        // trueを返す場合、propは有効です。
        // falseを返す場合、ランタイムの警告が表示されます。
      }
    }
  }
} 
```
\begin{center}
プロパティのバリデーターは関数です。falseを返却した場合、Vueはコンソールに警告を表示します。
\end{center}

propsバリデーターは、純粋関数であるという点で上述した`sum`関数と似ています。つまり、テストが簡単であるということです－Xというプロパティが与えられれば、バリデーターはYという結果を返します。

バリデーターを追加する前に、`<message>`コンポーネントのためのシンプルなテストを書きましょう。*インプット*と*アウトプット*をテストしたいです。`<message>`のケースでは、`variant`プロパティがインプットで、何が表示されるかがアウトプットです。Testing Libraryと`classList`属性を用いることで、正しいクラスが適用されたかを判定するテストを書くことができます:

```js
import { render, screen } from '@testing-library/vue'
import Message, { validateVariant } from './message.vue'

describe('Message', () => {
  it('渡されたvariantが、正しく表示されること', () => {
    const { container } = render(Message, {
      props: {
        variant: 'success'
      }
    })

    expect(container.firstChild.classList).toContain('success')
  })
})
```
\begin{center}
プロパティのテストはクラスに適用されています。
\end{center}

上記は、有効な`variant`プロパティが`<message>`に渡された時に、全てが期待通りに動作するかを検証しています。不正な`variant`が渡された時はどうでしょう？不正な`variant`で`<message>`コンポーネントが使用されることを禁止したいです。これは、`validator`の優れたユースケースです。

## バリデーターの追加

`variant`プロパティを更新して、シンプルなバリデーターを追加してみましょう:

```js
export default {
  props: {
    variant: {
      type: String,
      required: true,
      validator: (variant) => {
        if (!['success', 'warning', 'error'].includes(variant)) {
          throw Error(
            `variant is required and must` + 
            `be either 'success', 'warning' or 'error'.` +
            `You passed: ${variant}`
          )
        }

        return true
      }
    }
  }
}
```
\begin{center}
variantが有効でない場合、エラーをスローします。
\end{center}

これで、不正なプロパティが渡された場合はエラーとなります。エラーをスローする代わりに、単に`false`を返すこともできるでしょう。その場合、`console.warn`を通してコンソールに警告が表示されます。個人的には、コンポーネントが正しく使用されていない場合は、明示的にはっきりとそれを伝えたいので、エラーをスローする方を選びました。

バリデーターはどのようにテストすれば良いでしょうか？全ての可能性を網羅するためには、4つのテストが必要です。`variant`の有効な型のそれぞれに対してと、不正な型の1つに対してです。

propバリデーターを独立してテストする方が好ましいです。バリデーターはたいてい純粋関数であるため、テストは簡単です。propバリデーターを独立してテストする理由はもう一つがありますが、それについては実際のテストを書いてから言及しましょう。

バリデーターを独立してテストするために、`<message>`を少しばかりリファクターして、バリデーターをコンポーネントから分離したいと思います:

```html
<template>
  <div :class="variant">Message</div>
</template>

<script>
export function validateVariant(variant) {
  if (!['success', 'warning', 'error'].includes(variant)) {
    throw Error(
      `variant is required and must` + 
      `be either 'success', 'warning' or 'error'.` +
      `You passed: ${variant}`
    )
  }

  return true
}

export default {
  props: {
    variant: {
      type: String,
      required: true,
      validator: validateVariant
    }
  }
}
</script>
```
\begin{center}
バリデーターをコンポーネントから分離して抽出します。
\end{center}

素晴らしい！`validateVariant`は独立してエクスポートされ、簡単にテストできるようになりました:

```js
import { render, screen } from '@testing-library/vue'
import Message, { validateVariant } from './message.vue'

describe('Message', () => {
  it('渡されたvariantが、正しく表示されること', () => {
    // 簡潔のため省略 ...
  })

  it('有効なvariantプロパティが正しく検証されること', () => {
    ;['success', 'warning', 'error'].forEach(variant => {
      expect(() => validateVariant(variant)).not.toThrow()
    })
  })

  it('不正なvariantプロパティに対して、エラーがスローされること', () => {
    expect(() => validateVariant('invalid')).toThrow()
  })
})
```
\begin{center}
バリデーターの全てのケースをテストします。
\end{center}

単に`validateVariant`を独立した関数としてエクスポートするだけでは、大した変化に見えないかもしれませんが、実際には大きな改善があります。こうすることで、`validateVariant`のテストを簡単に記述することができます。`<message>`コンポーネントが有効な`variant`を伴ってのみ利用されていると、確信を持つことができるのです。

開発者が不正なプロパティを渡した場合、コンソール上にとても明確なメッセージが表示されます:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{props-error.png}
  \caption{Error! Passed variant is invalid.}
  \label{fig}
\end{figure}

## キーコンセプト: 関心の分離

ここまで、2つの異なるタイプのテストを書いてきました。最初はUIテストで、 `classList`に対してアサートを行いました。2つ目はバリデーターに対してで、ビジネスロジックをテストしています。

これをより明確にするために、あなたの会社はデザインシステムを専門にしていると考えて下さい。会社にはデザイナーが複数いて、（おそらく）FigmaやSketchなどを使ってボタンやメッセージのようなものをデザインしています。

デザイナー達は、以下3種類のメッセージをサポートすることにしました: success、warning、error。そして、あなたはフロントエンドの開発者です。この例では、あなたはVueフレームワーク上で業務を行うことになります－つまり、デザイナーによって提供されるCSSで使用される、特定のクラスを適用したVueコンポーネントを作成する、ということです。

将来的には、同一のCSSやガイドラインを用いて、ReactやAngularのコンポーネントを構築する必要が生じるかもしれません。その際には、3つのフレームワークのいずれの場合でも、`validateVariant`関数やそのテストを利用することができるでしょう。`validateVariant`はコアとなるビジネスロジックだからです。

この区別こそが重要です。（例えば`render`等の）Testing Libraryのメソッドや（`classList`のような）DOM APIを使用する際には、VueのUIレイヤーが正しく動作しているかを検証しようとしています。それに対して、`validateVariant`のテストはビジネスロジックを検証するためのものです。これらの違いは、*関心*と呼ばれます。あるコード群はUIに関心があり、他方はビジネスロジックに関心があるのです。

こうした区別は良いことです。こうすることで、テストと保守が容易になります。このコンセプトは*関心の分離*として知られます。本書を通して何度もこのテーマに立ち帰ることになるでしょう。

あるコードがUIとビジネスロジックのどちらに属するのかを知りたい時には、このように自問をしてみてください－「もしReactに切り替えた場合、同じコードとテストを再利用できるだろうか？」

今回のケースでは、Reactフレームワークを用いた場合でもバリデーターとそのテストは再利用できます。バリデーターはビジネスロジックに関心があり、UIフレームワークについては何も知らないからです。VueであってもReactであっても、以下3種類のメッセージ変数のみがサポートされます: success、warning、error。コンポーネントとコンポーネントのテスト（`classes()`を用いてアサートしている箇所）は、ReactコンポーネントとReact Testing Libraryを用いて書き直す必要があるでしょう。

理想的には、ビジネスロジックをどのフレームワークを選ぶかという問題と結びつけたくありません。フレームワークには流行り廃りがありますが、ビジネスが解決すべき問題が著しく変わるということはそうそうありません。

私はこれまで、関心の分離が十分でなかったために、企業が数万ドルを支払う羽目になった例をたくさん見てきました。彼らは、新しい機能を追加することは危険で時間がかかるという状態に陥ってしまいました。なぜなら、コアとなるビジネスロジックはUIとあまりに密接に結びついてしまっているからです。UIを書き直すことは、すなわちビジネスロジックを書き直すことを意味します。

## 関心の分離－ケーススタディ

関心の分離が十分でなかったがために企業にコストが生じた一例として、とある電気部品のサプライヤー向けに私が携わったアプリケーションがあります。サプライヤーは、顧客が部品の概算見積りを計算するためのアプリケーションを持っていました。計算の工程は非常に複雑で、いくつもステップを経る必要があり、前のステップから生じた値が、次のステップのフィールドに影響を持つような状態でした。

アプリケーションはJQueryを使って書かれていました（JQuery自体が悪いわけではありません。フレームワークは悪くないのです－それが正しく使用されている限りは）。すべてのビジネスロジックはUIロジックとごちゃ混ぜになっていました（この点こそが問題です）。サプライヤーは、数量ベースの割引制度を持っていました－「抵抗器を50個以上買ってくれれば、Xという割引を適用します。そうでなければYです」といったイメージです。サプライヤーはもう少しモダンなシステムに移行することに決めました－UIはとても時代遅れで、全くモバイルフレンドリーではありませんでした。JQueryコードの複雑性は非常に大きく、コードは散らかっていました。

UI層の全体を書き直す必要があっただけでなく（その作業に対して私はお金をもらっていたわけですが）、ビジネスロジックの圧倒的大部分がJQueryコードの中に埋もれており、これを抽出して書き直す羽目になってしまいました。この「探し出して抽出する」というミッションのせいで、作業は当初の想定よりもはるかに難しくリスキーなものになってしまいました－単にUIレイヤーをアップデートするだけでなく、サプライヤーのビジネスや価格体系にも深く立ち入って学ぶ必要がありました（そのために、当初の見積もりよりもはるかに多くの時間と費用が必要になってしまいました）。

上記の現実にあったシナリオを用いて、具体的な例を以下に提示します。ある抵抗器（電気部品の一種）が$0.60するとします。50個以上買うと、20%の割引を受けることができます。JQueryのコードベースは以下のようなものでした:

```js
const $resistorCount = $('#resistors-count')

$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  const totalCost = 0.6 * amount
  const $price = $("#price")
  if (amount > 50) {
    $price.value(totalCost * 0.8)
  } else {
    $price.value(totalCost)
  }
})
```

上記の例では、どこでUIロジックが終わり、どこからビジネスロジックが始まるのか、注意深く判断する必要があります。今回のシナリオでは、Vue（非常に動的でリアクティブなフォームのための優れたツール）に移行する必要があります。そのために、コードベースを深堀りしてビジネスロジックの中核を理解し、抽出し、いくつかのテストを加えて書き直す必要が生じました（当然ながら、以前のコードベースにはテストは一切ありませんでした。2000年代初頭の多くのコードベースにはよくあることですが）。この、「探し出し、抽出し、分離し、書き直す」という作業は危険に満ちており、間違いを犯したり、ロジックの一部を喪失してしまう可能性は極めて高いです！仮にビジネスロジックとUIが分離していれば、はるかに状況は良かったでしょう:

```js
const resistorPrice = 0.6
function resistorCost(price, amount) {
  if (amount > 50) {
    return price * amount * 0.8
  } else {
    return price * amount
  }
}

$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  $("#price").value = resistorCost(resistorPrice, amount)
})
```

2番目の例の方がはるかに優れています。ビジネスロジックがどこで終わり、UIがどこから始まるのか一目で分かります－それらは文字通り2つの関数に分かれています。価格決定の仕組みは明らかです－50個以上買えば割引があります。ビジネスロジックを個別にテストすることも非常に容易です。いつの日かフレームワークの選択がもはや適切でないと判断する時が来たとしても、他のフレームワークに移行することは容易です－ビジネスロジックの単体テストは、手を付けずにそのまま利用することができますし、安全を確保するためにE2Eのブラウザテストを実施するとより望ましいでしょう。

Vueに移行するのは簡単です－ビジネスロジックに手を付ける必要はありません:

```html
<template>
  <input v-model="amount" />
  <div>Price: {{ totalCost }}</div>
</template>

<script>
import { resistorCost, resistorPrice } from './logic.js'

export default {
  data() {
    return {
      amount: 0
    }
  },
  computed: {
    totalCost() {
      return resistorCost(resistorPrice, this.amount)
    }
  }
}
</script>
```

システム内の異なる関心を理解して峻別し、正しくアプリケーションを構築する能力は、良いエンジニアと偉大なエンジニアを区別する違いと言えます。

## その他の例

デザインパターンの考え方は十分ご理解いただけたでしょうから、propsに関連するその他の例を見てみましょう。今回の例では`<navbar>`コンポーネントを用います。実際のソースは`examples/props/navbar.vue`をご覧ください。サンプルコードは以下のようになります:

```html
<template>
  <button v-if="authenticated">Logout</button>
  <button v-if="!authenticated">Login</button>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
navbarコンポーネント。authenticatedというプロパティを1つ持ちます。デフォルトではfalseとなります。
\end{center}

実際のテストを見ずとも、全てのユースケースをカバーするのにテストが*2つ*必要なことは明らかです。理由は即座に明らかで、`authenticated`プロパティが`Boolean`だからです。とりうる値は2つしかありません。そのため、テストは特段面白くありません（その後の議論は面白くなります！）:

```js
import { render, screen } from '@testing-library/vue'
import Navbar from './navbar.vue'

describe('navbar', () => {
  it('authenticatedがtrueの場合、logoutを表示すること', () => {
    render(Navbar, {
      props: {
        authenticated: true
      }
    })

    // 要素が見つからない場合、getByTextはエラーをスローします。
    screen.getByText('Logout')
  })

  it('デフォルトの場合、loginを表示すること', () => {
    render(Navbar)

    screen.getByText('Login')
  })
})
```
\begin{center}
authenticatedの全ての値に対してnavbarの振る舞いをテストします。
\end{center}

`authenticated`の値によって変わるのはボタンのテキストだけです。`default`の値は`false`なので、2番目のテストでは`props`にfalseを渡す必要はありません。

`renderNavbar`関数を用いて少しだけリファクターすることができます:

```js
describe('Navbar', () => {
  function renderNavbar(props) {
    render(Navbar, {
      props
    })
  }

  it('authenticatedがtrueの場合、logoutを表示すること', () => {
    renderNavbar({ authenticated: true })
    screen.getByText('Logout')
  })

  it('デフォルトの場合、loginを表示すること', () => {
    renderNavbar()
    screen.getByText('Login')
  })
})
```
\begin{center}
より簡潔なテスト。
\end{center}

こちらのバージョンのテストの方が好ましいと思います。このようなシンプルなテストに対しては表面的な違いに過ぎないと感じるかもしれませんが、コンポーネントが複雑になるにつれ、関数化して複雑さを取り除くことはテストの可読性を向上させます。

同時に、コンポーネントを表示する行とアサートする行の間から改行を取り除いています。テストが今回のようにシンプルな場合、通常改行はしませんが、より複雑になった場合には可読性のために改行するようにしています。しかし、これは単に私の個人的なやり方に過ぎません。コーディングのスタイルではなく、テストを書くことそれ自体が重要です。

技術的には既に全てのケースをカバーしていますが、3番目のケースを加えてみたいと思います: `authenticated`に明示的に`false`を与える場合です。

```js
describe('navbar', () => {
  function renderNavbar(props) {
    render(Navbar, {
      props
    })
  }

  it('authenticatedがtrueの場合、logoutを表示すること', () => {
    // ...
  })

  it('デフォルトの場合、loginを表示すること', () => {
    // ...
  })

  it('authenticatedがfalseの場合、loginを表示すること', () => {
    renderNavbar({ authenticated: false })
    screen.getByText('Login')
  })
})
```
\begin{center}
明瞭性のため、3番目のテストを追加。
\end{center}

もちろん、このテストもパスします。3つの対称性のとれたテストが存在し、それら3つのケースが全て非常に簡潔であり、とても望ましいと思います。

それでは、関心の分離というアイデアを再び考えてみましょう。これはUIテストでしょうか？それともビジネスロジックのテストでしょうか？フレームワークを変更した場合、このテストは再利用可能でしょうか？

答えは*No*です－（例えばReactとそのTesting Libraryで動作する）新しいテストを書く必要が生じるでしょう。それでいいのです－つまり、コードベースの該当部分はUIレイヤーに属するもので、ビジネスロジックのコアではないというだけのことです。ビジネスロジックとして抽出すべきものは何もありません。

## 実際のテスト: リファクタリング可能か？

ちょっとしたサニティーチェック※を行い、テストが実装の詳細を検証しているわけではないことを確認してみましょう。実装の詳細とは、プログラムが*どのように*動作しているかということです。テストする際は、どのように動作するのか、その詳細を気にする必要はありません。そうではなく、実装が*何をしているのか*、そしてそれが正しく行れているかが重要となります。思い出してください。与えられたインプットに基づいて、期待するアウトプットが得られるのかをテストすべきでしたよね。今回のケースでは、データに基づいて正しいテキストが表示されるのかをテストしたい訳で、ロジックが実際どのように実装されているのかはあまり気にしていません。

※【訳者註】計算結果が正しいかどうかを素早く評価するための基本的なテストのこと（[ウィキペディア](https://ja.wikipedia.org/wiki/%E5%81%A5%E5%85%A8%E6%80%A7%E3%83%86%E3%82%B9%E3%83%88)）。

`<navbar>`コンポーネントをリファクターすることで、このことを確かめてみましょう。テストが通り続ける限り、プログラムはリファクターに強く、実装の詳細ではなくその振る舞いについてテストしていることを確信できるでしょう。

それではさっそく、`<navbar>`をリファクターしてみましょう:

```html
<template>
  <button>
    {{ `${authenticated ? 'Logout' : 'Login'}` }}
  </button>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
navbarのリファクター。振る舞いは依然と同じです！
\end{center}

テストは依然パスします！検証すべき内容をテストできているわけです。しかし、本当でしょうか？仮に、`<button>`タグの代わりに`<a>`タグを使うことにした場合どうなるでしょうか？

```html
<template>
  <a>{{ `${authenticated ? 'Logout' : 'Login'}` }}</a>
</template>

<script>
export default {
  props: {
    authenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>
```
\begin{center}
ボタンタグの代わりにアンカータグを使用。
\end{center}

実際のシステムでは当然、`href`プロパティが必要でしょうし、`authenticated`によってその値は変わるでしょう。しかし、今回のケースではそれは重要な問題ではありません。テストは今回もパスします。素晴らしい！テストは2回のリファクタリングを生き延びました－つまり、（素晴らしいことに）我々はプログラムの振る舞いをテストしており、実装の詳細はテストしていないということです。

## 結論

この章では、propsのテストにおけるテクニックをいくつか論じました。また、コンポーネントをテストするためにTesting Libraryの`render`メソッドを使用する方法も紹介しました。*関心の分離*という概念について、及びこの概念がいかにビジネスロジックをテストしやすく、アプリケーションを保守しやすくするかについても触れました。最後に、テストによって、いかに自信をもってリファクターできるようになるのかも見ました。

完全なソースコードは[GitHubリポジトリのexamples/props配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります: 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code

\pagebreak
