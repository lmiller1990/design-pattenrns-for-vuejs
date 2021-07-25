# HTTPとAPIのリクエスト

ほとんど全てのVue.jsアプリケーションで行われていることは、何らかのAPIに対してHTTPリクエストを送ることです。これは、認証やデータローディング、あるいはそれ以外の目的であったりします。HTTPリクエストを管理し、さらにテストするため、多くのデザインパターンが考案されてきました。

この章では、HTTPリクエストを構築する様々な方法、リクエストをテストする異なる方法を見ていき、各々のアプローチの長所と短所を論じていきます。

## Loginコンポーネント

今後の例で使用するのは`<login>`コンポーネントです。このコンポーネントは、ユーザーに名前とパスワードを入力させ、認証を試みさせるものです。以下のことについて考えていきたいです:

- HTTPリクエストはどこから発せられるべきか？コンポーネント、別のモジュール、ストア（Vuexのような）？
- 各アプローチに対してどのようにテストできるか？

万能のソリューションは存在しません。以下では最近お気に入りの構成方法を共有しますが、他のアーキテクチャーについても私見を述べます。

## シンプルに始める

アプリケーションがシンプルであれば、Vuexや独立したHTTPリクエストサービスは不要でしょう。単に全ての作業をコンポーネントの中ですることができます:

```html
<template>
  <h1 v-if="user">
    Hello, {{ user.name }}
  </h1>
  <form @submit.prevent="handleAuth">
    <input v-model="formData.username" role="username" />
    <input v-model="formData.password" role="password" />
    <button>Click here to sign in</button>
  </form>
  <span v-if="error">{{ error }}</span>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      password: '',
      user: undefined,
      error: ''
    }
  },

  methods: {
    async handleAuth() {
      try {
        const response = await axios.post('/login')
        this.user = response.data
      } catch (e) {
        this.error = e.response.data.error
      }
    }
  }
}
</script>
```
\begin{center}
シンプルなログインフォームコンポーネント。axiosを用いてリクエストを行います。
\end{center}

この例ではaxiosのHTTPライブラリを使用していますが、fetchを使用した場合も同様の考え方が当てはまります。

このコンポーネントをテストする際に、実際のサーバーにリクエストを投げたくありません－単体テストは分離して実行するべきです。ここでの選択肢の一つは、`jest.mock`を用いて`axios`モジュールをモックすることです。

このコンポーネントをテストする際に、実際のサーバーにリクエストを投げたくありません－単体テストは分離して実行するべきです。ここでの選択肢の一つは、`jest.mock`を用いて`axios`モジュールをモックすることです。

- 正しいエンドポイントが使われているか？
- 正しいペイロードが含まれているか？
- レスポンスに基づいて適宜DOMが更新されたか？

ユーザーが認証に成功した場合のテストは以下のようになるはずです:

```js
import { render, fireEvent, screen } from '@testing-library/vue'
import App from './app.vue'

let mockPost = jest.fn()
jest.mock('axios', () => ({
  post: (url, data) => {
    mockPost(url, data)
    return Promise.resolve({
      data: { name: 'Lachlan' }
    })
  }
}))

describe('login', () => {
  it('認証に成功すること', async () => {
    render(App)
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    expect(mockPost).toHaveBeenCalledWith('/login', {
      username: 'Lachlan',
      password: 'secret-password'
    })
    await screen.findByText('Hello, Lachlan')
  })
})
```
\begin{center}
ログイン時のワークフローをテストするために、asiosのモックを利用します。
\end{center}

リクエストが失敗した場合のテストも簡単です－mockの実装の中でエラーを投げればいいだけです。

## storeにリファクタリングする

小規模ではないアプリケーション上で実装する場合、コンポーネント内のローカルなstateにレスポンスを保存したくはないでしょう。Vueをスケールする伝統的に最も一般的な方法はVuexを用いることでしょう。大抵、Vuexストアは以下のようになるでしょう:

```js
import axios from 'axios'

export const store = {
  state() {
    return {
      user: undefined
    }
  },
  mutations: {
    updateUser(state, user) {
      state.user = user 
    }
  },
  actions: {
    login: async ({ commit }, { username, password }) => {
      const response = await axios.post('/login', { 
        username, 
        password 
      })
      commit('updateUser', response.data)
    }
  }
}
```
\begin{center}
シンプルなVuexのストア。
\end{center}

この場合のエラーハンドリングには様々な方法があります。コンポーネント内にローカルの`try/catch`を書いてもいいですし、Vuexのstate内にエラーを保存する開発者もいます。

いずれにせよ、Vuexを用いた`<login>`コンポーネントは以下のようになるでしょう:

```js
<template>
  <!-- no change -->
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    }
  },
  methods: {
    async handleAuth() {
      try {
        await this.$store.dispatch('login', {
          username: this.username,
          password: this.password
        })
      } catch (e) {
        this.error = e.response.data.error
      }
    }
  }
}
</script>
```
\begin{center}
ログインコンポーネントの中でVuexを使用。
\end{center}

また、テストの中でもVuexストアが必要になります。いくつかやり方がありますが、最も一般的な方法は以下の2つです:

- 実際のVuexストアを用いる－axiosのモックは継続する
- Vuexストアのモックを用いる

最初の方法は以下のようになるでしょう:

```js
import { store } from './store.js'

describe('login', () => {
  it('認証に成功すること', async () => {
    // 以下を加える
    render(App, { store })
  })
})
```
\begin{center}
Vuexを用いて、テストを更新。
\end{center}

こちらの方法の方が好みです。`axios`のモックは継続します。テストに対して行った唯一の変更は`store`を渡したことだけです。ユーザーが直面する実際の挙動は変わっていないので、テストも大幅に変える必要はありません－事実、実際のテストコードは変わっていません（ユーザー名とパスワードを入力してフォームを送信する）。これはまた、実装の詳細をテストしていないことを示しています－テストを変えずに大きなリファクタリングを行うことができました（Vuexストアを利用したことは除きます－この依存関係は我々が追加したのですから、変更は予期されたものです）。

このテストが優れたものであることをさらに示すため、今一度リファクタリングを行い、コンポーネントがComposition APIを用いるように変更してみましょう。ここでも、すべてのケースは依然としてパス*するはず*です:

```js
<template>
  <!-- no changes -->
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup () {
    const store = useStore()
    const formData = reactive({
      username: '',
      password: '',
    })
    const error = ref('')
    const user = computed(() => store.state.user)

    const handleAuth = async () => {
      try {
        await store.dispatch('login', {
          username: formData.username,
          password: formData.password
        })
      } catch (e) {
        error.value = e.response.data.error
      }
    }

    return {
      user,
      formData,
      error,
      handleAuth
    }
  }
}
</script>
```
\begin{center}
コンポーネントを変更して、Composition APIを用います。
\end{center}

全てのケースは依然パスします－このことからも、実装の詳細ではなくコンポーネントの振る舞いをテストしていることがわかります。

「実際のstore + axiosのモック」という組み合わせをVueとReactの双方でずいぶん長い間使ってきましたが、うまく機能してきました。唯一の欠点は`axios`を何度もモックしなければならないことです－しばしば、テスト間でコピー&ペーストを何度も繰り返すはめになるでしょう。これを避けるために有用な方法はいくつかありますが、それでも多少のボイラープレート※が残ってしまうでしょう。

※【訳者註】boilerplate (英) 殆ど、または全く変化することなく、複数の場所で繰り返される定型コードのセクションのこと。

## Mockを用いるか否か？

アプリケーションが大きくなればなる程、実際のstoreを使うのは複雑になっていきます。こういったシナリオでは、store全体をモックすることを選択する開発者もいるでしょう。そうすることで確実にボイラープレートを減らすことができます。特にVue Test Utilsを使っている場合、例えば`this.$store`のように、`this`が持つ値をモックするために作られた`mocks`マウントオプションが使えます。

Testing Libraryはこのような簡単にモックを利用する機能をサポートしていません－これは意図的なものです。Testing Libraryはできる限り本物に近いテストを推奨しています。つまり、可能な限り実際の依存関係を利用するということです。私はこの考え方が好きです。私がなぜ実際のVuexストアを用いる方を好むのかを理解するために、`jest.mock`を使ってVuexをモックすると何が起こるのか見てみましょう。

```js
let mockDispatch = jest.fn()
jest.mock('vuex', () => ({
  useStore: () => ({
    dispatch: mockDispatch,
    state: {
      user: { name: 'Lachlan' }
    }
  })
}))

describe('login', () => {
  it('認証に成功すること', async () => {
    render(App)
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    expect(mockDispatch).toHaveBeenCalledWith('login', {
      username: 'Lachlan',
      password: 'secret-password'
    })
    await screen.findByText('Hello, Lachlan')
  })
})
```
\begin{center}
Vuexのモック。
\end{center}

Vuexストアをモックしているため、`axios`を完全に無視しています。このスタイルのテストは最初は魅力的に見えます。書くべきコードは少なく、非常に簡単に書けます。同時に、`state`を好きなように設定することができます－上記のコードでは、`dispatch`は実際には`state`を更新さえしません。

再度、実際のテストコードはそんなに変わっていないことが見て取れます－`store`を`render`に渡す必要はもうありません（何故ならば、テスト内で実際のstoreすら使っていないからです。storeを完全にモックしています）。`mockPost`はもう使いません－その代わりに`mockDispatch`を使います。`mockDispatch`に対するアサートは`login`アクションが正しいペイロードで呼ばれたかに対するアサートになっていて、正しいエンドポイントに対してHTTPが呼ばれたかに対するものではなくなっています。

ここに大きな問題があります。仮に`login`アクションをstoreから削除しても、テストは*通り続けます*。なんと恐ろしい！テストが全て通っているため、全てはうまくいっているのだと自信を持ってしまいます。現実には、あなたのアプリケーションは完全に壊れているのに。

これは実際のVuexストアを用いた場合のテストには当てはまりません－ストアが壊れればテストも「正しく」壊れます。テストを伴わないコードベースよりも駄目なものが一つだけ存在します－*駄目な*テストを伴うコードベースです。テストがないということは少なくとも、結果に確信が持てない状態にあるということですから、一般的には手動でのテストに多くの時間を費やすことになるはずです。間違った自信を与えるテストは、実際にはそれよりもっと駄目なことです－それは、安全だという間違った認識をあなたに与えます。全ては大丈夫なように見えますが、実際には全く大丈夫ではありません。

## モックを減らす－連鎖関係の最下層の要素をモックする

上記の例の問題は、連鎖関係のあまりに上部をモックしていることにあります。良いテストは、できる限り製品に近いものです。それがテストスイートに自信を持つ最善の方法です。以下の図は`<login>`コンポーネントの依存関係を示しています:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-map.png}
  \caption{認証の依存関係}
  \label{fig}
\end{figure}

直前のテストでは、Vuexをモックしていました。つまり依存関係のこの部分をモックしています:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-vuex.png}
  \caption{Vuexのモック}
  \label{fig}
\end{figure}

これはつまり、Vuex、HTTPコール、サーバーのいずれかが壊れていても、テストは失敗しないということです。

axiosのテストは若干ましです－1つ下の階層をモックしているからです:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./api-axios.png}
  \caption{Axiosのモック}
  \label{fig}
\end{figure}

こちらの方が良いです。`<login>`かVuexのいずれかが壊れていた場合、テストは失敗します。

`axios`をモックするのも避けることができたら、もっと良いとは思いませんか？この場合、全てのテストで以下が不要となります:

```js
let mockPost = jest.fn()
jest.mock('axios', () => ({
  post: (url, data) => {
    mockPost(url, data)
    return Promise.resolve({
      data: { name: 'Lachlan' }
    })
  }
}))
```
\begin{center}
axiosをモックするためのボイラープレートのコード。
\end{center}

また、依存関係のより下部に行くことで、より自信を持つことができます。

## Mock Service Worker

新しいライブラリーが比較的最近登場しました－Mock Service Worker(略して`msw`)です。これはまさに先ほど議論したことができます－`axios`よりも一段階下で動作し、実際のネットワークリクエストをモックすることができます。ここでは`msw`がどのように動くかは説明しませんが、[website](https://mswjs.io/): https://mswjs.io/ でより詳しく知ることができます。`msw`の素晴らしい機能の一つとして、Node.js環境のテストにおいても、ローカル開発におけるブラウザにおいても利用できる点があります。

早速試してみましょう。基本的な使い方は以下のようになります:

```js
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)
```
\begin{center}
mswを用いた基本的なサーバー。
\end{center}

素晴らしいことに、`axios`をモックする必要はもうありません。代わりに、`fetch`を使うようにアプリケーションに変更を加える必要があります。そして、テストは一切変える必要がありません。何故ならば、以前よりも低い階層をモックしているからです。

`msw`を使用した完全なテストは以下のようになります:

```js
import { render, fireEvent, screen } from '@testing-library/vue'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import App from './app.vue'
import { store } from './store.js'

const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)

describe('login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('認証に成功すること', async () => {
    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText('Hello, Lachlan')
  })
})
```
\begin{center}
axiosのモックの代わりにmswを使用。
\end{center}

[以下のドキュメント](https://mswjs.io/docs/getting-started/integrate/node): https://mswjs.io/docs/getting-started/integrate/node に示されるように、別のファイルでサーバーをセットアップして自動的にインポートすることで、さらにボイラープレートを減らすことができます。そうすると、上記のコードを全てのテストにコピーする必要がなくなります－あたかも、期待通りにレスポンスする実際のサーバーがある本番環境下のようにテストができます。

以前は行っていたのにこのテストではやっていないことが一つあります。サーバーに送るべきペイロードに対するアサートです。もしこれを行いたい場合、ポストされたデータを配列に入れて追跡し続けることができます。以下がその例です:

```js
const postedData = []
const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    postedData.push(req.body)
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)
```
\begin{center}
ポストされたデータを追跡。
\end{center}

後は、`postedData[0]`が期待するペイロードを含むことをアサートするだけです。ポストリクエストの中身をテストすることに何かしら意味がある場合、配列を`beforeEach`フック内でリセットできます。

`msw`は他にもたくさんのことができます。例えば、特定のHTTPコードでレスポンスすることで、失敗したリクエストを簡単にシミュレートすることもできます。ここに、`jest.mock`を用いて`axios`をモックすることに対して、`msw`が輝く点があります。まさにこのケースに対して、テストを追加してみましょう:

```js
describe('login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('認証に成功すること', async () => {
    // ...
  })

  it('間違った認証情報を処理できること', async () => {
    const error = 'Error: please check the details and try again' 
    server.use(
      rest.post('/login', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({ error })
        )
      })
    )

    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText(error)
  })
})
```
\begin{center}
失敗したリクエストに対するテスト。
\end{center}

テストのたびにモックサーバーを簡単に拡張できます。`jest.mock`を用いて`axios`をモックすることで、上記の2つのテストを行うのは非常に煩雑です。

`msw`のもう一つの非常に優れた機能に、開発中にこの機能をブラウザ上で使用できる点があります。ここでは例示しませんが、実際にやってみて経験すると良いエクササイズになると思います。例えば、テストと開発の両方で同じエンドポイントハンドラーを使用できるでしょうか？

## 結論

この章では、コンポーネント上のHTTPリクエストをテストする様々な方法を紹介しました。まず、`axios`のモックと実際のVuexストアの組み合わせが、Vuexストアのモックよりも優れていることを見ていきました。次に、1つ下の階層に移動して実サーバーを`msw`でモックしました。これは以下のように一般化できます－依存関係のより低い部分をモックすると、テストスイートに対してより自信を持つことができます。

ただし、`msw`のテストだけでは十分ではありません－全てが想定通りに動くかを検証するためには、実サーバーに対してもアプリケーションのテストを行う必要があります。それでも、本章で説明してきたテストは依然とても有効です－高速に動作し、とても簡単に書くことができます。私自身は、Testing Libraryと`msw`を開発ツールとして選択することが多いです－こちらの方が、コードに変更を加えるたびにブラウザを開いてページを更新するよりも確実に高速になります。

## エクササイズ

- ブラウザ上で`msw`を使用する。テストと開発の双方で同じエンドポイントハンドラーのモックをつかうことができます。
- `msw`をより探求して、他にも興味深い機能が提供されているので見てみてください。

\pagebreak
