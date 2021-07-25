# テストしやすいフォームを書く

（エクササイズを含む）完全なソースコードは[GitHubリポジトリのexamples/form-validation配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

フォームはWEBベースのあらゆるシステムにおいて、ユーザーが情報を入力する主要な方法です。そのため、フォームを正しく取り扱うことは重要です。この章ではフォーム、特に*良いフォームをいかに書くか*という問題にフォーカスしたいと思います。

実際*良い*フォームとはなんでしょうか？

フォームロジックはVueコンポーネントから分離されるべきです－そうすることで、テストを独立して行うことができます。また、バリデーションについても考える必要があります。

伝統的なサーバーサイドレンダリングのアプリでは、フォームを送信した後でしかバリデーションできませんでした。これは良いユーザー体験とは言えません。Vueは、はるかに動的なクライアントサイドのバリデーションを実装することで、素晴らしいユーザー体験の提供を可能にしてくれます。今回はこれを利用し、2つのレベルのバリデーションを実装したいと思います:

1. フィールドバリデーション－1つのフィールド内に不正なデータを入力した場合、即座にエラーメッセージを表示する。
2. フォームバリデーション－全てのフォームが埋められた場合のみ、送信ボタンが有効になること。

最後に、2種類のテストを行う必要があります。最初はビジネスロジックに関するものです。あるフォームが与えられたとして、どのフィールドが不正であり、フォームはいつ完全に正しいといえるのか？という問題に対するテストです。2つ目は相互作用に関するものです－UIレイヤーが正しく動作しているか、そしてユーザーがデータを入力し、エラーメッセージを確認し、すべてのフィールドが有効な場合にフォームを送信できるのかを確かめるテストです。

\pagebreak

## 患者情報フォーム

上記の例として、病院のアプリケーション向けに患者情報を入力するフォームを構築していきましょう。エラーがない場合、フォームは以下のように表示されます:

![有効なフォームとデバッグ情報](ss-done-clean.png)
  
フォームには2つの入力フィールドがあります。一つは患者の名前で、必須かついかなるテキストでも入力可能です。もう一つは患者の体重で、帝国単位とメートル単位のどちらかを選択可能です。条件は以下のようになります:

条件 | 帝国  | メートル
--- | --- | ---
最小 | 66  | 30  
最大 | 440 | 200 

名前と体重の双方を検証する必要があります。エラーの場合、フォームは以下のようになります:

![不正なフォームとデバッグ情報](ss-done-dirty.png)

条件はオブジェクトを使って定義します:

```js
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 }
}
```

両方の入力が正しい場合のみ、送信ボタンは有効となります。最後に、それぞれのフィールドにバリデーションを表示させます。

## フォームバリデーションのミニフレームワーク

世の中にはフル機能のVueの（Vueでなくとも）フォームバリデーションフレームワークがたくさんあります。しかし、今回の単純なサンプル用には、自作のバリデーションを書いていこうと思います－そうすることで、いくつかのアイデアについて論じることができ、特定のAPIやライブラリについて学ぶことを避けることができます。

以下2種類のバリデーションが必要です:

1. 必須フィールド。患者名、体重のいずれも必須フィールドです。
2. 最小値、最大値の制約。これは体重フィールド用の条件です－体重は特定の範囲内である必要があります。また、メートル単位と帝国単位をサポートする必要があります。

フィールドのバリデーションを行うのと同時に、我々のフォームバリデーションフレームワークは、不正な入力に対してエラーメッセージを返却する必要があります。

バリデーション関数を2つ書きましょう: `required`と`isBetween`です。テスト駆動開発（Test Driven Development、略称TDD－テストを最初に書き、あえてテストを失敗させることで実装を行っていく手法）が常に正しいツールであるとは限りませんが、この2つの関数を書く上では正しい方法であると思います。なぜなら、インプットとアウトプット、そしてシステムがとりうる全ての状態が分かっているからです。後は、ただテストを書いてそれをパスさせれば良いという問題になります。

早速やってみましょう－まずは`required`バリデーターのテストからです。バリデーターは、バリデーションの結果、及びエラーがある場合にはそのメッセージから成るオブジェクトを返却します。バリデーション後の入力値は以下のような形状をとります:

```js
interface ValidationResult {
  valid: boolean
  message?: string
}
```

これが、上記2つのバリデーター（そして将来のあらゆるバリデーター）が従うべきフォーマットになります。バリデーションAPIは決まりましたので、`required`のテストを書くことができます。
\pagebreak

## `required`バリデーター

```js
import {
  required,
} from './form.js'

describe('required', () => {
  it('undefinedの場合、不正となること', () => {
    expect(required(undefined)).toEqual({ 
      valid: false, 
      message: 'Required' 
    })
  })

  it('空の文字列の場合、不正となること', () => {
    expect(required('')).toEqual({ 
      valid: false, 
      message: 'Required' 
    })
  })

  it('値が存在する場合、trueを返却すること', () => {
    expect(required('some value')).toEqual({ valid: true })
  })
})
```
\begin{center}
requiredバリデーターに対するテスト。
\end{center}

基本的に、`true`と評価されないものは全て不正となり、それ以外は有効と見なされます。以下のように実装すれば、全てのテストがパスします:

```js
export function required(value) {
  if (!value) {
    return {
      valid: false,
      message: 'Required'
    }
  }

  return { valid: true }
}
```
\begin{center}
requiredバリデーターの実装。
\end{center}

私は、`value`が定義されていないnullのケースを最初にテストするのが好きです。が、これは単に個人的な好みの問題に過ぎません。
\pagebreak

## `isBetween`バリデーター

`isBetween`はもう少し興味深いです。まず、帝国法とメートル法をサポートする必要があります。次に、`isBetween`の上部に、正しい条件の場合にパスする別のファンクションを定義しましょう。

全てのエッジケースを定義するところから始めましょう。下限の体重が66lbで上限の体重が440lbの場合、65lbや441lbは明らかに不正です。他方、66lbや440lbは有効です。よって、これらのケースをテストして確かめる必要があります。

つまり、以下5つのケースが必要です:

1. "ハッピー"パス※、インプットが正しい場合
2. 値が最大値より大きい場合
3. 値が最小値より小さい場合
4. 値が最大値と等しい場合
5. 値が最小値と等しい場合

※【訳者註】例外やエラーの状態のないデフォルトのシナリオのこと。

この関数を利用する上で、数字だけがインプットの値として渡されると見なせた方が安全ですが、このバリデーションはより上位のレベルで取り扱うべきものです。

```js
import {
  required,
  isBetween
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  it('値が最小値と等しい場合、trueを返すこと', () => {
    expect(isBetween(5, { min: 5, max: 10 })).toEqual({ valid: true })
  })

  it('値が最小値と最大値の間の場合、trueを返すこと', () => {
    expect(isBetween(7, { min: 5, max: 10 })).toEqual({ valid: true })
  })

  it('値が最大値と等しい場合、trueを返すこと', () => {
    expect(isBetween(10, { min: 5, max: 10 })).toEqual({ valid: true })
  })

  it('値が最小値より小さい場合、falseを返すこと', () => {
    expect(isBetween(4, { min: 5, max: 10 }))
      .toEqual({ valid: false, message: 'Must be between 5 and 10'  })
    })
  })

  it('値が最大値より大きい場合、falseを返すこと', () => {
    expect(isBetween(11, { min: 5, max: 10 }))
      .toEqual({ valid: false, message: 'Must be between 5 and 10' })
  })
})
```
\begin{center}
isBetweenバリデーターに対するテスト
\end{center}

テストはとても単純なので、全ての要素を一つの`expect`ステートメントの中に含むことにしました。これがより複雑なテストであれば、私ならばおそらく`isBetween()`の結果を変数に入れて（`actual`と命名するのが好みです）、これを`expect`アサーションに渡したでしょう。構造が巨大化するにつれて、テストも複雑になっていくものです。

実装はテストよりもはるかに少ないコードで済みますが、これは珍しいことではありません。

```js
export function isBetween(value, { min, max }) {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Must be between ${min} and ${max}`
    }
  }

  return { valid: true }
}
```
\begin{center}
isBetweenバリデーターの実装。
\end{center}

繰り返しになりますが、バリデーションをファンクションの最初に書くのが個人的な好みです。
\pagebreak

## `isBetween`を用いて`validateMeasurement`を構築する

我々の小さなバリデーションフレームワーク（つまり、2つのファンクション）が書けましたので、次は患者の体重をバリデーションしてみましょう。`isBetween`と`required`を用いて`validateMeasurement`関数を構築していきます。

帝国法とメートル法をサポートするので、条件を引数として渡す必要があります。どちらが選択されたかという問題は後ほどUIレイヤーで取り扱いましょう。

考慮すべきシナリオは3つあります:

1.  ハッピーパス、値が有効な場合
2.  値がnull/undefinedの場合
3.  値は定義されているが、条件の範囲外の場合

`isBetween`で検証した全てのケースのテストを加える必要はないと思います。というのも既に網羅的にテスト済みだからです。

```js
import {
  required,
  isBetween,
  validateMeasurement
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  it('undefinedの場合、valid: falseを返すこと', () => {
    const constraints = { min: 10, max: 30 }
    const actual = validateMeasurement(undefined, { constraints })

    expect(actual).toEqual({ valid: false, message: 'Required' })
  })

  it('範囲外の場合、valid: falseを返すこと', () => {
    const constraints = { min: 10, max: 30 }
    const actual = validateMeasurement(40, { constraints })

    expect(actual).toEqual({ 
      valid: false, 
      message: 'Must be between 10 and 30' 
    })
  })
})
```
\begin{center}
validateMeasurementバリデーターのテスト。
\end{center}

テストが先ほどより少し複雑になったので、結果を`actual`に代入して、それに対してアサートすることにしました。こうすることでより分かりやすくなったと思います。

最初に表で示したような、ポンドとキログラムの具体的な条件を使用する必要はありません。代入した条件でテストが通る限り、`validateMeasurement`はどのような`min/max`の条件の組合せを与えられても、正しく動作すると確証を持つことができます。

また、テストとアサートの間に改行を入れました。これは個人的な好みですが、テストにおける3つの段階（*準備*、*実施*、*アサート*）に緩やかに従ったものです。この話題については、後ほど触れましょう。

もちろん、このように書く必要はありません。しかし"何かを実行すること"（例えば、何か変数を作成したり、何かしらの関数を呼び出すこと）とアサート（「このシナリオの場合は、こうなるはずだ」と言うこと）の2つの観点で考えることは有益だと思います。

個人的な考えはさておき－今回も実装はテストコードより遥かに短いです。パターンに気付きましたか？テストは一般に実装よりも長くなるのです。最初は変に感じるかもしれませんが、何も問題ありません。複雑なロジックの場合はむしろそうあるべきです。

```js
export function validateMeasurement(value, { constraints }) {
  const result = required(value)
  if (!result.valid) {
    return result
  }

  return isBetween(value, constraints)
}
```
\begin{center}
requiredとisBetweenを用いて、validateMeasurementを構成。
\end{center}

いいですね！`required`と`isBetween`を再利用できました。2つのより小さなバリデーターを使うことで、バリデーターを"構成"することができました。再利用性は素晴らしいことです。構成可能性もまた、素晴らしいことです。
\pagebreak

## フォームオブジェクトと完全なフォームバリデーション

各フィールドのバリデーションが全て完成しましたので、フォームの構造について考えてみましょう。

以下2つのフィールドがあります: `name`及び`weight`

1.  `name`は文字列です。
2.  `weight`は数値で単位と紐づいています。

これらは*入力フィールド*であり、このような形状となります:

```js
// 定義
interface PatientFormState {
  name: string
  weight: {
    value: number
    units: 'kg' | 'lb'
  }
}

// 使用方法
const patientForm: PatientFormState = {
  name: 'John',
  weight: {
    value: 445,
    units: 'lb'
  }
}
```
\begin{center}
患者情報を定義するオブジェクト。
\end{center}

入力が与えられると（上記の`patientForm`）、それぞれのフィールドを検証することができます。検証後のフィールドは`{ valid: true }`又は`{ valid: false, message: '...' }`のいずれかとなります。そのため、フォームと妥当性のインターフェースは次のようになります:


```js
interface ValidationResult {
  valid: boolean
  messsage?: string
}

interface PatientFormValidity {
  name: ValidationResult
  weight: ValidationResult
}

const patientForm: PatientFormState = {
  name: 'John',
  weight: {
    value: 445,
    units: 'lb'
  }
}

const validState = validateForm(patientForm)
// 返却される値は以下のようになるはずです:
// {
//   name: { valid: true }
//   weight: { 
//     valid: false, 
//     message: 'Must be between 66 and 440' 
//   }
// }

```
\begin{center}
これから記述するvalidateForm関数の使用例。
\end{center}

以下二つの関数が必要となります:

1.  `isFormValid`、フォームが有効かどうかを判定します。
2.  `patientForm`、正しい体重の単位を把握して、全てのバリデーターを呼び出します。

`isFormValid`のテストから始めましょう。フォームは、全てのフィールドが`valid`となる場合に有効と見なされます。そのためテストは2つだけ必要です: 全てのフィールドが有効と見なされる場合、そして少なくとも一つのフィールドが不正な場合です:

```js
import {
  required,
  isBetween,
  validateMeasurement,
  isFormValid
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  // ...
})

describe('isFormValid', () => {
  it('name及びweightのフィールドが有効の場合、trueを返すこと', () => {
    const form = {
      name: { valid: true },
      weight: { valid: true }
    }

    expect(isFormValid(form)).toBe(true)
  })

  it('フィールドのいずれかが無効の場合、falseを返すこと', () => {
    const form = {
      name: { valid: false },
      weight: { valid: true }
    }

    expect(isFormValid(form)).toBe(false)
  })
})
```
\begin{center}
isFormValidのテスト。
\end{center}

実装はシンプルです:

```js
export function isFormValid(form) {
  return form.name.valid && form.weight.valid
}
```
\begin{center}
isFormValidの実装。
\end{center}

仮により包括的なフォームバリデーションのライブラリーを構築するとしたら、`Object.keys`や`Object.entries`を用いて、`form`に対して意匠を凝らしたり繰り返し処理を行う必要があるでしょう。これはより一般的なソリューションです。しかしながら今回は、バリデーションをできる限りシンプルに保つようにしています。

ビジネスロジックを完成させるために最後に必要なテストが、`patientForm`です。この関数は先に定義した`PatientFormState`インターフェースを用いたオブジェクトを受け取り、それぞれのフィールドのバリデーションの結果を返却します。

今回は、実装が何も間違っていないことを確かめるためにかなり多くのテストが必要となります。考えられるケースは以下となります:

1.  ハッピーパス: 全ての入力フィールドが有効
2.  患者の名前がnull
3.  患者の体重が条件の範囲外（帝国法）
4.  患者の体重が条件の範囲外（メートル法）
\pagebreak

```js
import {
  required,
  isBetween,
  validateMeasurement,
  isFormValid,
  patientForm
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  // ...
})

describe('isFormValid', () => {
  // ...
})

describe('patientForm', () => {
  const validPatient = {
    name: 'test patient',
    weight: { value: 100, units: 'kg' }
  }

  it('フォームが正しく埋められた場合、有効となること', () => {
    const form = patientForm(validPatient)
    expect(form.name).toEqual({ valid: true })
    expect(form.weight).toEqual({ valid: true })
  })

  it('nameがnullの場合、無効となること', () => {
    const form = patientForm({ ...validPatient, name: '' })
    expect(form.name).toEqual({ valid: false, message: 'Required' })
  })

  it('帝国法における体重のバリデーションが正しいこと', () => {
    const form = patientForm({ 
      ...validPatient, 
      weight: { 
        value: 65, 
        units: 'lb' 
      }
    })

    expect(form.weight).toEqual({ 
      valid: false, 
      message: 'Must be between 66 and 440' 
    })
  })

  it('メートル法における体重のバリデーションが正しいこと', () => {
    const form = patientForm({ 
      ...validPatient, 
      weight: { 
        value: 29, 
        units: 'kg' 
      }
    })

    expect(form.weight).toEqual({ 
      valid: false, 
      message: 'Must be between 30 and 200' 
    })
  })
})
```
\begin{center}
patientFormのテスト。
\end{center}

テストコードはかなり長いですね！しかしながら、実装は些細なものです。今回のケースでは、体重の条件を`limits`というオブジェクトでハードコーディングしました。しかしながら現実世界のシステムでは、APIから値を取得して`patientForm`関数に渡すことになるでしょう。

```js
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 },
}

export function patientForm(patient) {
  const name = required(patient.name)

  const weight = validateMeasurement(patient.weight.value, {
    nullable: false,
    constraints: limits[patient.weight.units]
  })

  return {
    name,
    weight
  }
}
```
\begin{center}
patientFormの実装。
\end{center}

これで患者情報フォームのビジネスロジックは完成です－まだVueコンポーネントを書いてないことに気付きましたか？これは、本書のテーマである*関心の分離*を徹底し、ビジネスロジックを完全に分離したためです。

## UIレイヤーの記述

ここからが楽しい部分です－Vueを使ってUIレイヤーを記述します。TDDはビジネスロジックにはよくフィットすると思いますが、コンポーネントのテストには概してTDDを用いないようにしています。

どのようにコンポーネントの状態を管理するのか考えるところから始めるのが好みのやり方です。今回はCompsition APIを用いてみましょう。フォームと相性がいいと思います。

```html
<script>
import { reactive, computed, ref } from 'vue'
import { patientForm, isFormValid } from './form.js'

export default {
  setup() {
    const form = reactive({
      name: '',
      weight: {
        value: '',
        units: 'kg'
      }
    })

    const validatedForm = computed(() => patientForm(form))
    const valid = computed(() => isFormValid(validatedForm.value))

    return {
      form,
      validatedForm,
      valid
    }
  }
}
</script>
```
\begin{center}
フォームのビジネスロジックとVueのUIレイヤーの統合。
\end{center}

状態を`reactive`オブジェクトに入れることにしました。`valid`と`validateForm`は、両方とも`computed`の値としています－フォーム内のいずれの値が変化したときも、バリデーションとフォームの状態がリアクティブに更新されてほしいからです。

ここで`<template>`部分を追加してみましょう－とてもシンプルで、普通のHTMLに過ぎません。
\pagebreak

```html
<template>
  <h3>Patient Data</h3>
  <form>
    <div class="field">
      <div v-if="!validatedForm.name.valid" class="error">
        {{ validatedForm.name.message }}
      </div>
      <label for="name">Name</label>
      <input id="name" name="name" v-model="form.name" />
    </div>
    <div class="field">
      <div v-if="!validatedForm.weight.valid" class="error">
        {{ validatedForm.weight.message }}
      </div>
      <label for="weight">Weight</label>
      <input 
        id="weight" 
        name="weight" 
        v-model.number="form.weight.value" 
      />
      <select name="weightUnits" v-model="form.weight.units">
        <option value="kg">kg</option>
        <option value="lb">lb</option>
      </select>
    </div>
    <div class="field">
      <button :disabled="!valid">Submit</button>
    </div>
  </form>
<pre>
Patient Data
{{ form }}
</pre>
<br />

<pre>
Form State
{{ validatedForm }}
</pre>
</template>
```
\begin{center}
フォームのv-modelをバインドしたシンプルなテンプレート
\end{center}

デバッグのために`<pre>`ブロックを加えました。すべて動作します！

![バリデーションのデバッグ情報](ss-done-clean.png)

## いくつかの基本的なUIテスト

Testing Libraryを用いて、いくつかの基本的なUIテストを加えることもできます。以下は、とてもシンプルですが機能的にはほとんどを網羅した2つのテストの例となります:

```js
import { render, screen, fireEvent } from '@testing-library/vue'
import FormValidation from './form-validation.vue'

describe('FormValidation', () => {
  it('フォームが正しく入力されること', async () => {
    render(FormValidation)

    await fireEvent.update(screen.getByLabelText('Name'), 'lachlan') 
    await fireEvent.update(screen.getByDisplayValue('kg'), 'lb')
    await fireEvent.update(screen.getByLabelText('Weight'), '150')

    expect(screen.queryByRole('error')).toBe(null)
  })

  it('不正な入力に対してエラーを表示すること', async () => {
    render(FormValidation)

    await fireEvent.update(screen.getByLabelText('Name'), '')
    await fireEvent.update(screen.getByLabelText('Weight'), '5')
    await fireEvent.update(screen.getByDisplayValue('kg'), 'lb')

    expect(screen.getAllByRole('error')).toHaveLength(2)
  })
})
```
\begin{center}
Testing Libraryを用いたUIレイヤーのテスト。
\end{center}

テストの規模が少し大きくなっているので、各ステップを改行で分けるようにしています。以下のようなスタイルでテストを書くのがお気に入りのやり方です:

```js
it('...', async () => {
  // 準備－ここで全ての準備を行います
  render(FormValidation)

  // 実行－以下のことを行います！ 
  // 関数を呼び出す
  // 値を代入する
  // インタラクションをシミュレートする
  await fireEvent.update(screen.getByLabelText('Name'), 'lachlan') 

  // アサート
  expect(...).toEqual(...)
})
```
\begin{center}
テストの解剖－準備、実行、アサート。
\end{center}

`<button>`が正しく非活性化されるかのテストが一切ありませんが、詳細は以下をご覧ください。

## 改善と結論

ここでのゴールは*完璧な*フォームを作ることではなく、フォームバリデーションとビジネスロジックをUIレイヤーからどのように分離するかを説明することでした。

現状では、体重のフィールドにはどんな文字列も入力でき、有効なものとみなされてしまうでしょう－望ましくはありませんが、修正は些細なものです。いくつかのテストを書いて、入力が数値であることを確かめ、そうでない場合に有益なエラーメッセージを返すようにすると、いい練習になるでしょう。また、`<button>`が正しく非活性化されることも全くテストできていません。

## エクササイズ

- テストを追加して、数値以外の値を`weight`フィールドに入力した場合、フィールドが不正となり、"Weight must be a number"というエラーを表示するようにしてください。
- `<form>`に`@submit.prevent`リスナーを追加してください。フォームが送信された場合、`patientForm`を使ってイベントをemitしてください。
- Testing Libraryを用いてフォームを送信し、正しいイベントとペイロードがemitされたかをアサートしてください。

（エクササイズを含む）完全なソースコードは[GitHubリポジトリのexamples/form-validation配下](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code)にあります。

