# ProvideとInjectを用いた依存性の注入

完全なソースコードは[GitHubリポジトリのexamples/provide-inject配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

この章ではペアとなる2つの関数、`provide`と`inject`について論じます。これらを用いることで、Vueにおける*依存性の注入*※が促進されます。この機能はVue 2から利用できるようになりました。Vue 2では、Vueプロトタイプのthisにグローバル変数を加え、`this.$`を通してアクセスするのが一般的でした。これの良く知られた例としては、`this.$router`や`this.$store`があります。このため、`provide`や`inject`は一般的にはあまり用いられてきませんでした。Vue 3とCompsition APIはグローバルのVueプロトタイプを操作することを非推奨にしているため、`provide`と`inject`を用いた依存性の注入はより一般的になものになりました。

※【訳者註】コンポーネント間の依存関係をプログラムのソースコードから排除するために、外部の設定ファイルなどでオブジェクトを注入できるようにするソフトウェアパターンのこと（[ウィキペディア](https://ja.wikipedia.org/wiki/%E4%BE%9D%E5%AD%98%E6%80%A7%E3%81%AE%E6%B3%A8%E5%85%A5)）。

トイ・サンプルを作る代わりに、シンプルなストア（Vuexのような）を作って、`useStore`コンポーサブルを通して利用できるようにすることで、実際のユースケースを見ていきましょう。これは内部で`provide`と`inject`を用います。`useSore`関数を実装する方法は他にもいくつかあります。例えば、単にグローバルシングルトンをインポート/エクスポートする方法です。なぜ、`provide`と`inject`がグローバル変数を共有するためのより優れた方法であるかを見ていきましょう。

![完成したデモアプリ](ss-complete.png)

## シンプルなストア

それでは早速、極めてシンプルなストアを定義してみましょう。Vuexのような複雑なAPIは作成しません－単に、いくつかのメソッドを持つクラスとして定義します。まずはリアクティブなstateを作り、`getState`関数を通してreadonly形式でアクセスできるようにしてみましょう。

```js
import { reactive, readonly } from 'vue'

export class Store {
  #state = {}

  constructor(state) {
    this.#state = reactive(state)
  }

  getState() {
    return readonly(this.#state)
  }
}
```
\begin{center}
プライベートなstateとreadonlyのアクセサーを伴ったシンプルなストア。
\end{center}

もし`#state`という構文を見たことがなければ、これはプライベートプロパティと呼ばれるものです－JavaScriptのクラスにおける比較的新しい機能の一つです。これを書いている現時点では、これはコンパイルなしにはChromeでしか動作しません。お望みでしたら、`#`を省略してください－それでも問題なく動作します。

この`#`は、プロパティがクラスインスタンスの内部からしかアクセスできないことを意味します。そのため`this.#state`は、`Store`クラス内で宣言されたメソッド内では使えますが、`new Store({ count: 1 }).#state.count`は許可されません。その代わりに、`getState()`を用いることでREADONLY形式でstateにアクセスします。

コンストラクタに`state`を渡して、ユーザーがstateの初期値を設定できるようにしましょう。規律の取れたアプローチをとり、テストを書きましょう。

```js
import { Store } from './store.js'

describe('store', () => {
  it('stateの初期値を設定すること', () => {
    const store = new Store({
      users: []
    })

    expect(store.getState()).toEqual({ users: [] })
  })
})
```
\begin{center}
テストによって全てが正しく動作していることを検証します。
\end{center}

## importを用いた使用法

それでは先に進む前に、何か表示してみましょう。まず、ストアの新しいインスタンスをエクスポートします:

```js
import { reactive, readonly } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: [{ name: 'Alice' }]
})
```
\begin{center}
初期値を伴ったグローバルシングルトンとしてストアをエクスポート。
\end{center}

次に、コンポーネントにこれをインポートし、usersに対して反復処理を行います:

```html
<template>
  <ul>
    <li 
      v-for="user in users"
      :key="user"
    >
      {{ user.name }}
    </li>
  </ul>
</template>

<script>
import { computed } from 'vue'
import { store } from './store.js'

export default {
  setup() {
    return {
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
インポートされたstore経由でstateにアクセスします。
\end{center}

![ストアのstateからuserを表示。](ss-basic.png)

うまくいきました！素晴らしい進歩です－若干のCSSも追加しましたが、そちらはソースコードをご覧ください。

この共有された唯一の`store`は*グローバルシングルトン*として知られています。

フォームを通してさらにuserを追加できるようにしましょう－が、まずはTesting Libraryを用いてUIテストを追加しましょう。

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import { Store } from './store.js'
import Users from './users.vue'

describe('store', () => {
  it('stateの初期値を設定すること', () => {
    // ...
  })

  it('userを表示すること', async () => {
    render(Users, {
      global: {
        provide: {
          store: new Store({
            users: []
          })
        }
      }
    })

    await fireEvent.update(screen.getByRole('username'), 'Alice')
    await fireEvent.click(screen.getByRole('submit'))
    await screen.findByText('Alice')
  })
})
```
\begin{center}
Testing Libraryを用いたUIテスト
\end{center}

うまくいきました！しかし、ストアの中にusersをハードコードしたくありません。このことは、グローバルシングルトンの短所の一つを表しています－テスト目的でstateを初期化したり更新する、簡単な方法がないことです。フォーム経由で新しいusersを作成する機能を追加してみましょう。

## usersフォームを追加する

userを追加するため、まずはstoreに`addUser`関数を追加してみましょう:

```js
import { reactive, readonly } from 'vue'

export class Store {
  #state = {}

  // ...

  addUser(user) {
    this.#state.users.push(user)
  }
}

export const store = new Store({
  users: []
})
```
\begin{center}
addUserはStoreクラスの中で宣言されているので、プライベートなstateにアクセスできます。
\end{center}

また、初期ユーザーのAliceはstoreから除外しました。テストを更新して、`addUser`を分離してテストできるようにしてみましょう。

```js
describe('store', () => {
  it('stateの初期値を設定すること', () => {
    // ...
  })

  it('userを表示すること', async () => {
    // ...
  })

  it('userを追加すること', () => {
    const store = new Store({
      users: []
    })

    store.addUser({ name: 'Alice' })

    expect(store.getState()).toEqual({ 
      users: [{ name: 'Alice' }]
    })
  })
})
```
\begin{center}
addUserを独立してテスト－コンポーネントもマウントもありません。
\end{center}

今はまだ、UIテストは失敗します。`addUser`を呼ぶフォームを実装する必要があります:

```html
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" />
    <button>Add User</button>
  </form>
  <ul>
    <li 
      v-for="user in users"
      :key="user"
    >
      {{ user.name }}
    </li>
  </ul>
</template>

<script>
import { ref, computed } from 'vue'
import { store } from './store.js'

export default {
  setup() {
    const username = ref('')
    const handleSubmit = () => {
      store.addUser({ name: username.value })
      username.value = ''
    }

    return {
      username,
      handleSubmit,
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
新しいuserを作るためのフォーム。
\end{center}

素晴らしい！今度はテストをパスしました－今度も、多少のCSSといい感じのタイトルを加えましたので、興味があればソースコードをご覧ください。

![完成したアプリ](ss-complete.png)

## クロステスト汚染を回避するためのProvide/Inject

表面上は全てうまくいっているようですが、アプリケーションが大きくなるにつれて問題に直面することになるでしょう: テストをまたいでstateが共有されることです。全てのテストに*唯一の*storeインスタンスを用いています－stateを操作すると、その変更は他の全てのテストにも影響を与えます。

理想的には、全てのテストは分離的に行われるべきです。それぞれのテストに同じグローバルシングルトンをインポートしてしまうと、ストアを個別に管理できなくなります。ここに`provide`と`inject`の便利な点があります。

以下の図は公式ドキュメントから持ってきたものですが、このことをよく説明しています:

![Provide/Inject図。クレジット: Vue公式ドキュメント](ss-provde-inject.png)

例えば、`Parent.vue`コンポーネントがあるとしましょう。それは以下のようなものです:

```html
<template>
  <child />
</template>

<script>
import { provide } from 'vue'

export default {
  setup() {
    const theColor = 'blue'
    provide('color', theColor)
  }
}
</script>
```

`color`変数にアクセスしたい*いかなる*子コンポーネントからでも、変数にアクセスできるようになりました。コンポーネントの階層がどれだけ深くても問題ありません。`Child.vue`は以下のようになります:

```html
<template>
  <!-- renders Color is: blue -->
  Color is: {{ color }}
</template>

<script>
import { inject } from 'vue'

export default {
  setup() {
    const color = inject('color')
    return {
      color
    }
  }
}
</script>
```

`provide`にはリアクティブなストアを含め、何でも渡すことができます。実際にやってみましょう。appを作成した最上位のファイルに移動してください（私の場合は`index.js`です。完全な例はソースコードをご覧ください）:

```js
import { createApp } from 'vue'
import { store } from './examples/provide-inject/store.js'
import Users from './examples/provide-inject/users.vue'

const app = createApp(Users)
app.provide('store', store)
app.mount('#app')
```
\begin{center}
ストアを全てのコンポーネントで利用可能にするためにprovideを使用。
\end{center}

コンポーネント内の`setup`関数で`provide`を呼ぶことができます。そうすることで、provideされた値はコンポーネントの全ての子供（とその子供…以下略）から利用可能となります。`provide`を`app`上で呼ぶこともできます。そうすることで、値は全てのコンポーネントから利用可能となり、この例でやりたいことと一致します。

これで、storeをインポートする代わりに、`const store = inject('store')`を呼び出すだけでよくなります:

```html
<template>
  <!-- ... -->
</templat>

<script>
import { ref, inject, computed } from 'vue'

export default {
  setup() {
    const store = inject('store')
    const username = ref('')

    const handleSubmit = () => {
      // ...
    }

    return {
      username,
      handleSubmit,
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
ストアにアクセスするためにinjectを利用します。
\end{center}

## Testing LibraryにおけるProvide

最後のUIテストは失敗します。appを作成した際には`provide('store', store)`しましたが、テスト上では行っていません。Testing Libraryは特に`provide`と`inject`のためのマウンティングオプションを持っています－`global.provide`です:

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import { Store } from './store.js'
import Users from './users.vue'

describe('store', () => {
  it('stateの初期値を設定すること', () => {
    // ...
  })

  it('userを追加すること', () => {
    // ...
  })

  it('userを表示すること', async () => {
    render(Users, {
      global: {
        provide: {
          store: new Store({
            users: []
          })
        }
      }
    })

    await fireEvent.update(screen.getByRole('username'), 'Alice')
    await fireEvent.click(screen.getByRole('submit'))
    await screen.findByText('Alice')
  })
})
```
\begin{center}
global.provideのマウンティングオプションを利用します。
\end{center}

再び全てのテストが通りました。これで、クロステスト汚染を避けることができました－`global.provide`を用いて新しいstoreインスタンスを供給することは簡単です。

## useStoreコンポーサブル

ストアの使用方法をもう少し人間工学に適ったものとするため、多少のリファクターをしてみましょう。全ての箇所で`const store = inject('store')`と書く代わりに、`const store = useStore()`とだけ書く方がいいでしょう。

storeを更新してみましょう:

```js
import { reactive, readonly, inject } from 'vue'

export class Store {
  // ...
}

export const store = new Store({
  users: []
})

export function useStore() {
  return inject('store')
}
```
\begin{center}
useStoreコンポーサブル。
\end{center}

次はコンポーネントです:

```html
<template>
  <!-- ... -->
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from './store.js'

export default {
  setup() {
    const store = useStore()
    const username = ref('')

    const handleSubmit = () => {
      store.addUser({ name: username.value })
      username.value = ''
    }

    return {
      username,
      handleSubmit,
      users: computed(() => store.getState().users)
    }
  }
}
</script>
```
\begin{center}
useStoreコンポーザブルを使用します。
\end{center}

全てのテストは依然パスしますので、全ては依然うまくいっていると確信できます。

storeにアクセスが必要な全ての場所で、`useStore`を呼ぶだけで良くなります。これはVuexが使用するのと同じAPIです。useXXX関数を通してグローバルシングルトンにアクセスする（その背景では`provide`と`inject`を利用する）というのは、一般的なやり方です。

## エクササイズ

1. ストアを更新して、`removeUser`関数を追加してください。それを分離してテストしてください。
2. 各userの隣にボタンを追加してください－ボタンを押すとストアから該当のuserを削除します。ここで`removeUser`関数を使用してください。
3. Testing Libraryを用いて、上記がうまくいっているかUIテストを書いて確かめてください。`globals.provide`を使って既に作成済みのuserをストアに渡すことで、userが入ったストアをセットアップできます。

完全なソースコードは[GitHubリポジトリのexamples/provide-inject配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

