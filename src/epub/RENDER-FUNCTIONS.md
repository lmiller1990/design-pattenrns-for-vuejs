# Render Functionsの力

完全なソースコードは[GitHubリポジトリのexamples/render-functions配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

この本ではこれまでのところ、全ての例でコンポーネントを構築するのに`<template>`を用いてきました。しかし実際には、`<template>`内にマークアップを書くことと、それをブラウザ上に表示することの間で、Vueは大量の厄介な仕事を裏でやってくれているのです。これは主に、Vueの中核となるパッケージの一つである`@vue/compiler-sfc`が行っています。

`<template>`内のコードはコンパイルされて*render functions*と呼ばれるものになります。このコンパイル中に色々なことが行われますが、以下はその例です:

- `v-if`や`v-for`といったディレクティブが（例えば`if`や`for`、`map`といった）通常のJavaScriptに変換される。
- 最適化。
- CSSがスコープされる（`<style scoped>`を使用した場合）。

`<template>`を用いてコンポーネントを書く方が一般的にはより人間工学に適っていますが、render functionsを自分で書く方が有益なシチュエーションもあります。そういったシチュエーションの一つが、非常に一般的なUIライブラリを作る場合です。また、内部でどういったことが起きているのか理解するのもいいことです。

この章では、tabコンポーネントを作成します。使用方法は以下のようになります:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab tabId="1">Tab #1</tab>
    <tab tabId="2">Tab #2</tab>
    <tab tabId="3">Tab #3</tab>

    <tab-content tabId="1">Content #1</tab-content>
    <tab-content tabId="2">Content #2</tab-content>
    <tab-content tabId="3">Content #3</tab-content>
  </tab-container>
</template>
```
\begin{center}
tabsコンポーネントの最終的なマークアップ。
\end{center}

![完成したTabsコンポーネント](ss-tabs-done.png)

`<tab-container>`コンポーネントは、`tabId`プロパティを伴う`<tab>`コンポーネントを持つことで動作します。これは、同じ`tabId`を持つ`<tab-content>`コンポーネントとペアとなります。`tabId`プロパティが`activeTabId`の値に一致する`<tab-content>`のみが表示されます。`<tab>`がクリックされると、`activeTabId`が動的に更新されます。

## なぜRender Functionsなのか？

この例はrender functionsの優れたユースケースを示しています。render functionsがないと、以下のように書く必要があるでしょう:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab @click="activeTabId = '1'">Tab #1</tab>
    <tab @click="activeTabId = '2'">Tab #2</tab>
    <tab @click="activeTabId = '3'">Tab #3</tab>

    <tab-content v-if="activeTabId === '1'">
      Content #1
    </tab-content>
    <tab-content v-if="activeTabId === '2'">
      Content #2
    </tab-content>
    <tab-content v-if="activeTabId === '3'">
      Content #3
    </tab-content>
  </tab-container>
</template>
```
\begin{center}
代替となる、より柔軟性の低い構文。
\end{center}

一般的な開発においては、前者の方がよりスッキリしており、より優れた開発エクスペリエンスをもたらしてくれると思います。

render functionsのもう一つのユースケースは、一般的なコンポーネントライブラリ（例えばVuetifyのような）を作成する場合です。こういったケースでは、ユーザーが何個のタブを使うのか知る術がありません。そのため、上記のように`v-if`を使うことはできません。より包括的で一般化可能な方法が必要です。ほかにも選択肢はありますが、render functionsは再利用可能なコンポーネントを書く場合に非常に有用です。

## コンポーネントを作成する

render functionsコンポーネントにおける優れた点の一つは、同じファイル内に複数作成できることです。一般的には1つのファイルにつき1つのコンポーネントの方が望ましいですが、特に今回のようなケースでは、`<tab-container>`、`<tab-content>`、`<tab>`を同じファイルに配置することに問題はありません。その主な理由は、`<tab>`と`<tab-content>`はどちらもとてもシンプルであり、`<tab-container>`内でネストして使う以外の方法で利用するユースケースは想定できないからです。

それではこの2つのコンポーネントを作成するところから始めてみましょう。`vue`ファイルは使わず、単に普通の`js`ファイルを使います:

```js
import { h } from 'vue'

export const TabContent = {
  props: {
    tabId: {
      type: String,
      required: true
    }
  },

  render() {
    return h(this.$slots.default)
  }
}

export const Tab = {
  props: {
    tabId: {
      type: String,
      required: true
    }
  },

  render() {
    return h('div', h(this.$slots.default))
  }
}
```
\begin{center}
テンプレートの代わりにレンダー関数を用いた、Tab及びTabContentコンポーネント。
\end{center}

`h`については、後ほどすぐに深く論じます－そのため、今すぐ完全に理解できなくても心配しないでください。

話を先に進める前に、我々は今render functionsを用いて作業していますが、これは*ただのJavaScriptに過ぎません*。つまり、こっそりとリファクターしてボイラープレートを減らすことができます。どちらのコンポーネントも同じプロパティ: `tabId`を持っています。`withTabId`関数とスプレッド(`...`)演算子を使うことで、これを一般化できます:

```js
const withTabId = (content) => ({
  props: {
    tabId: {
      type: String,
      required: true
    }
  },
  ...content
})

export const TabContent = withTabId({
  render() {
    return h(this.$slots.default)
  }
})

export const Tab = withTabId({
  render() {
    return h('div', h(this.$slots.default))
  }
})
```
\begin{center}
重複を減らしたwithTabId関数。
\end{center}

このテクニックはコンポーネントライブラリを作る際に、多くのコンポーネントで同じpropsを用いる場合に非常に有用です。

## コンポーネントを用いてSlotsをフィルタリングする

それではここからが面白いところです－`<tab-container>`コンポーネントの`render`ファンクションを見ていきましょう。プロパティは一つだけ、`activeTabId`のみです:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    console.log(this.$slots.default())
  }
}
```
\begin{center}
TabContainerコンポーネントの作成とデフォルトスロットのロギング。
\end{center}

Composition APIの方がお好みでしたら、同じことを`setup`でできます:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  setup(props, { slots }) {
    console.log(slots.default())
  }
}
```
\begin{center}
Composition APIを用いたスロットへのアクセス。
\end{center}

この例では、Options APIと`render`ファンクションを用います。

最初にやることはslotsを分けることです。今回は開発用に以下の例を用います:

```html
<template>
  <tab-container v-model:activeTabId="activeTabId">
    <tab tabId="1" />
    <tab tabId="2" />

    <tab-content tabId="1" />
    <tab-content tabId="2" />
  </tab-container>
</template>

<script>
import { ref } from 'vue'

import { 
  Tab,
  TabContent,
  TabContainer
}  from './tab-container.js'

export default {
  components: {
    Tab,
    TabContainer,
    TabContent
  },

  setup() {
    return {
      activeTabId: ref('1')
    }
  }
}
</script>
```
\begin{center}
テンプレート内にレンダーファンクションのコンポーネントを組み込みます。
\end{center}

この例では、`this.$slots.default()`は*4つの*slots(技術的には4つの`VNodes`とも言えます)を持つことになります。2つの`<tab>`コンポーネントと2つの`<tab-content>`コンポーネントです。このことをより明確にするため、"コンソール駆動"開発をしてみましょう。

この例では、`this.$slots.default()`は*4つの*slots(技術的には4つの`VNodes`とも言えます)を持つことになります。2つの`<tab>`コンポーネントと2つの`<tab-content>`コンポーネントです。このことをより明確にするため、"コンソール駆動"開発をしてみましょう。

![Slotsのロギング（VNodesの配列）](ss-render-default-slots.png)

4つの複雑なオブジェクトの配列があります。これらのオブジェクトが`VNodes`です－Vueが仮想DOM上でノードを内部的に表現する方法です。以下では、最初の`VNode`を開いてこの章と関連があるプロパティにマークをつけました:

![Tab VNodeの詳細](ss-slot-details.png)

最初のプロパティは`children`です。この中にslotsが入ります。例えば以下の中では:

```html
<tab tabId="1">Tab #1</tab>
```

`Tab #1`というchildが一つあります。今回の場合、これは*text*ノード－つまりただのテキストとなります。childは他の`VNode`であることもできます。その中でさらに`VNodes`を持つこともできます－つまりツリー構造をとります。

次にマークをつけたプロパティは`props`です－こちらはとてもわかりやすく、渡したpropsのことです。今回の場合、`tabId`の1つだけになります。

最後は`type`です。`type`には複数のパターンがあります－通常のHTML要素、例えば`<div>`の場合、ただの`div`となります。コンポーネントの場合は、コンポーネントの全体を含みます。今回の場合は、定義したコンポーネント - `<tab>` - となり、`props`属性と`render`属性を持ちます。

`VNode`がどのコンポーネントを使用しているのか特定する方法が分かりました－`type`プロパティです。この知識を使って`slots`をフィルタリングしてみましょう。

## default slotsをフィルタリングする

`type`プロパティは`VNode`が用いる、コンポーネントへの*直接参照*です。つまり、オブジェクトと厳密等価を用いて合致できるということです。説明が少し抽象的に聞こえた場合は、早速使ってみましょう。slotsを`tabs`と`contents`にソートします:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
    const contents = $slots
      .filter(slot => slot.type === TabContent)

    console.log(
      tabs,
      contents
    )
  }
}
```
\begin{center}
フィルターを用いて異なるスロットを分けます。
\end{center}

`type`はオリジナルのコンポーネントへの直接参照であるため（コピー等ではない）、`===`（厳密等価）を用いてslotsをフィルターできます。

![フィルタリングされたVNodes](ss-sorted-slots.png)

次のゴールはtabsを表示することです。見栄えを良くするためにいくつかクラスを加え、さらに、どのタブが現在選択されているのか分かるようにしてみましょう。

## Render Functionsに属性を追加する

まずは大事なことから始めて、なにかを表示してみましょう。コンソール駆動開発はもう十分です。vueから`h`をインポートし、フィルタリングしたtabsを`map`します－このクレイジーな（素晴らしい？）`h`関数については後ほど説明します:

```js
import { h } from 'vue'

export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(tab)
      })

    const contents = $slots
      .filter(slot => slot.type === TabContent)

    return h(() => tabs)
  }
}
```
\begin{center}
hを使ってtabsをレンダーします。
\end{center}

ついに、表示できました:

![表示されたTabs](ss-render-tabs-basic.png)

単に`tabs`を返す代わりに`h(() => tabs)`をしていることにお気づきかもしれません。`h`はコールバックを引き受けることができます－その場合、レンダーされた際にコールバック関数を評価します。`render`内の最終的な値には、`h(() => /* render function */)`を返すことをお勧めします－そうしないと、キャッシュにおける微妙な問題に遭遇するかもしれません。

`render`では配列を返却することもできます－これは*fragment*として知られており、root nodeがありません。

複雑に感じたようでしたら、ご安心ください－次は`h`の集中講義を行います。

## 集中講義－`h`とは何か？

`render`ファンクションのコンポーネントのより複雑な例として、render functionsの配列を返却し、HTML要素と独自のコンポーネントの両方から構成されるコンポーネントを見てみましょう。

```js
const Comp = {
  render() {
    const e1 = h('div')
    const e2 = h('span')
    const e3 = h({
      render() {
        return h('p', {}, ['Some Content'])
      }
    })

    return [
      h(() => e1),
      h(() => e2),
      h(() => e3)
    ]
  }
}
```
\begin{center}
hを用いたレンダーファンクションのより複雑な例。
\end{center}

Tabsを表示するするために、`h(tab)`という形で`h`を使っていましたね－`tab`は`VNode`で、さらにこの中に`h`を返すrender functionがあります。それでは`h`とはなんでしょうか？これは"hyperscript"という用語に由来し、さらにこの言葉は`HTML`にルーツを持ちます－より具体的には、*hyper*を意味する`H`に由来します。`h`の方が短くタイピングが容易です。特にこれは「HTML構造を生成するJavaScript関数」と考えることができます。

`h`にはたくさんのオーバーロードがあります。例えば、一番簡単な記法は以下です:

```js
const el = h('div')
```
\begin{center}
divを表現する最小のVNode。
\end{center}

これは`<div>`を一つ生成しますが、あまり有益ではありません。2番目の引数にはobjectで表現された属性をとれます。

```js
const el = h('div', { class: 'tab', foo: 'bar' })`
```
\begin{center}
hの2番目の引数は、属性を含むオブジェクトです。
\end{center}

属性のオブジェクトは、標準的なものも標準外のものも引き受けることができます。上記は以下を表示します:

```html
<div class="tab" foo="bar" />
```

三番目にして最後の引数は子要素で、通常は配列となります:

```js
const el = h('div', { class: 'tab', foo: 'bar' }, ['Content'])`
```
\begin{center}
三番目の引数は子要素です。
\end{center}

これは以下を表示します:

```html
<div class="tab" foo="bar">
  Content
</div>
```

`h`をネストして呼ぶことで、さらなる`VNodes`を渡すこともできます:

```js
const el = h(
  'div', 
  { 
    class: 'tab', 
    foo: 'bar' 
  }, 
  [
    h(
      'span', 
      {}, 
      ['Hello world!']
    )
  ]
)
```
\begin{center}
子要素はプレーンテキストまたはVNodesとなります。
\end{center}

読みやすくするために改行を行いました。`render`ファンクションで`h`を使うと複雑になりやすいですので、注意が必要です。これに関連して、いくつかTipsがあります。上記のように`h`を呼ぶと、以下のようになります:

```html
<div class="tab" foo="bar">
  <span>Hello world!</span>
</div>
```

前述の通り、子要素は標準のHTMLに限定されません。`h`には独自のコンポーネントを渡すこともできます:

```js
const Tab = {
  render() {
    return h('span')
  }
}

const el = h('div', {}, [h(Tab), {}, ['Tab #1']])
```
\begin{center}
カスタムコンポーネントであるTabを子要素として渡します。
\end{center}

このようにするとすぐに読みづらくなります。この問題に対する主な解決策は、`VNode`毎に別々の変数を作り、`render`関数の最後でそれらをまとめて返却する、というものです（具体例は後述します）。

## 動的クラス属性の付与

`h`について理解が深まったところで、`<tab>`コンポーネントにclassをいくつか付与してみましょう。それぞれの`<tab>`は`tab`クラスを持ち、活性化したtabは`active`クラスを持ちます。`render`ファンクションをアップデートしてみましょう:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(
          tab,
          {
            class: {
              tab: true,
              active: tab.props.tabId === this.activeTabId
            }
          }
        )
      })

    const contents = $slots
      .filter(slot => slot.type === TabContent)

    return h(() => h('div', { class: 'tabs' }, tabs))

  }
}
```
\begin{center}
動的な"active"プロパティを渡します。
\end{center}

どこかで見たことがある記法ではありませんか？

```js
{
  class: {
    tab: true,
    active: tab.props.tabId === this.activeTabId
  }
}
```
\begin{center}
動的なクラスバインディング。
\end{center}

そうです、`v-bind:class`構文です！これは`render`ファンクション内で`v-bind:class="{ tab: true, active: tabId === activeTabId }"`を表現する方法です。ブラウザ上では以下のように表示されるはずです（CSSをいくつか追加しました - CSSは`examples/render-functions/app.vue`にてご覧下さい）:

![動的なクラス](ss-tabs-classes.png)

## Render Functions内のイベントリスナー

アクティブなタブは、ユーザーがタブをクリックすると更新される必要があります。これを実装してみましょう。イベントリスナーは`class`のような属性とほとんど同じです。

```js
{
  class: {
    tab: true,
    active: tab.props.tabId === this.activeTabId
  },
  onClick: () => {
    this.$emit('update:activeTabId', tab.props.tabId)
  }
}
```
\begin{center}
レンダーファンクションに実装されたonClickリスナー
\end{center}

これは`<tab v-on:click="update:activeTabId(tabId)" />`のrender function版です。`on:click`が`onClick`になります。イベントの先頭に`on`を付ける必要があります。これでアクティブなタブを更新するには十分です（いくつかデバッグ情報も追加しました）:

![Render Functions内でのイベントのEmit](ss-active.png)
  

## Contentのフィルタリング

実装すべき最後の機能はcontentを表示することです。しかし、`activeTabId`にマッチしたcontentのみを表示する必要があります。`contents`の`VNodes`を取得するために`filter`を使用する代わりに、`find`を使うべきです－どんな場合でもタブは一つしか選択されないからです。`render`ファンクション内で`filter`ではなく`find`を使ってみましょう:

```js
const content = $slots.find(slot => 
  slot.type === TabContent &&
  slot.props.tabId === this.activeTabId
)
```
\begin{center}
スロット内からアクティブなcontentを見つけます。
\end{center}

最後に、返却される内容を変える必要があります。tabsを表示するだけではなく、contentも表示する必要があります。以下が完全な`render`ファンクションです:

```js
export const TabContainer = {
  props: {
    activeTabId: String
  },

  render() {
    const $slots = this.$slots.default()
    const tabs = $slots
      .filter(slot => slot.type === Tab)
      .map(tab => {
        return h(
          tab,
          {
            class: {
              tab: true,
              active: tab.props.tabId === this.activeTabId
            },
            onClick: () => {
              this.$emit('update:activeTabId', tab.props.tabId)
            }
          }
        )
      })

    const content = $slots.find(slot => 
      slot.type === TabContent &&
      slot.props.tabId === this.activeTabId
    )

    return [
      h(() => h('div', { class: 'tabs' }, tabs)),
      h(() => h('div', { class: 'content' }, content)),
    ]
  }
}
```
\begin{center}
TabContainer用のレンダーファンクションの完成版。
\end{center}

上記の例のように、`render`からは`VNodes`の配列を返すことができます。表示する異なる要素毎に別々の変数を作ることで、可読性を保つことができます－今回のケースでは、`tabs`と`content`です。

うまくいきましたね！

![完成したTabsコンポーネント](ss-tabs-done.png)


## Render Functionコンポーネントのテスト

実装は終わりましたので、全てが問題なく動作し続けているか、テストを書いて確かめてみましょう。テストを書くのは非常にシンプルです－Testing Libraryの`render`関数はrender functionsと非常に相性がいいです（`vue`ファイルはrender functionsにコンパイルされるので、今まで書いてきた全てのテストは内部で`render` functionsを使ってきました）。

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import App from './app.vue'

test('tabs', async () => {
  render(App)
  expect(screen.queryByText('Content #2')).toBeFalsy()

  fireEvent.click(screen.getByText('Tab #2'))
  await screen.findByText('Content #2')
})
```
\begin{center}
レンダーファンクションコンポーネントのテストは、テンプレートコンポーネントのテストと同様です。
\end{center}

## エクササイズ

- コンポーネントをリファクタリングして、`setup`関数を用いるようにしてください。`render`関数を用いる代わりに、`setup`からレンダリングを処理する関数を返却するということです。
- 今回のサンプルをTypeScriptを用いて書き直してください。できる限り型安全とするため、`defineComponent`とCompsition APIを使用したいはずです。以下のスクリーンショットは、TypeScriptのメリットのいくつかを示しています。`emits`の宣言と組み合わせることで、emitされたイベントとpropsの両方の型安全を保証できます。
- 本書全体の他のサンプルをリファクタリングし、`vue`ファイルの代わりにrender functionsを用いてください（これは解法には含まれません－TypeScriptとCompsition APIを用いて特定のサンプルを書き直すのに助けが必要な場合は、私にメールをください）。

完全なソースコードは[GitHubリポジトリのexamples/render-functions配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

![Render Functionを用いた型安全なコンポーネント](ss-ts.png)

