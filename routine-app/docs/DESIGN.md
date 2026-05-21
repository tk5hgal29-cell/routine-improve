# 習慣デザインノート — 設計メモ

## コード構成（現状）

```
routine-app/
├── index.html      # マークアップ・WOOP/If-then/チェック UI
├── js/
│   ├── app.js      # 画面ロジック・イベント
│   ├── store.js    # 永続化抽象（LocalStore）
│   ├── heatmap.js  # ヒートマップ描画
│   └── utils.js    # 日付・エスケープ
└── docs/DESIGN.md
```

`renderHeatmap()` は `renderHome()` から **常に** 呼ばれる（習慣0件でも表示）。

---

## Firebase 移行設計（概要）

### コレクション案

| パス | 内容 |
|------|------|
| `users/{uid}/profile` | 表示名、タイムゾーン、オンボーディング完了 |
| `users/{uid}/woop` | W/O/Ob/P テキスト |
| `users/{uid}/rules/{ruleId}` | if, then, minimumThen, envActions[] |
| `users/{uid}/days/{yyyy-mm-dd}` | percent, checks, microWins, envLogs |
| `users/{uid}/meta` | lastActiveAt, returnSpeedAvg, streakSoft |

### Store インターフェース

```js
// js/store.js を拡張
export class FirebaseStore extends LocalStore {
  async getRules() { /* onSnapshot */ }
  async setHistory(dateKey, data) { /* setDoc merge */ }
}
```

起動時: `const store = firebaseUser ? new FirebaseStore() : new LocalStore();`

### 移行手順

1. `LocalStore` のメソッドを async 化の準備（呼び出し側を `await` 対応）
2. 初回ログイン時 `localStorage` → Firestore 一括 import
3. オフライン: `enableIndexedDbPersistence` + 楽観的 UI
4. 認証: Anonymous → 後から Email/Google リンク

---

## Phase 1 実装済み（データ構造）

### Rule
```js
{ id, if, then, minimumThen }
```

### LocalStorage キー
| キー | 内容 |
|------|------|
| `habit-day-settings-{date}` | `{ minimumMode: boolean }` |
| `habit-micro-wins-{date}` | `{ open_app, sit_chair, drink_water }` |
| `habit-meta` | `{ lastActiveAt, returnGaps[], lastReturnShownAt }` |

### モジュール
- `js/constants.js` — 閾値・マイクロウィン定義
- `js/minimumMode.js` — 最低モード表示
- `js/microWins.js` — チップUI・ポップ・保存
- `js/returnUi.js` — gapDays・平均復帰・オーバーレイ
- `js/sounds.js` — Web Audio チャイム

---

## 追加機能 — データモデル案（Phase 2以降）

### 1. 最低モード（拡張）

```js
rule: {
  then: '英語を1時間',
  minimumThen: '英語を1分',
  mode: 'normal' | 'minimum'  // 当日切替
}
```

UI: チェック画面に「今日はしんどい → 1分モード」トグル。達成判定は `minimumThen` を THEN として表示。

### 2. 復帰 UI

`meta.lastActiveAt` と今日の差分日数 `gap` を計算:

- `gap >= 3`: フルスクリーン「戻ってきてくれてありがとう」+ 復帰速度スコア
- **復帰速度** = `1 / gap`（日）を過去平均と比較し「前回より早く戻れました」

継続日数は小さく、復帰バッジを大きく。

### 3. 小さすぎる成功（マイクロウィン）

```js
microWins: [
  { id: 'open_app', label: 'アプリを開いた', points: 1 },
  { id: 'sit_chair', label: '椅子に座った', points: 1 },
  ...
]
```

チェックとは別の「ぽちっ」ボタン行。完了時 `celebrateMicroWin()` — CSS パーティクル + Web Audio 短いチャイム。

### 4. 環境設計ログ

```js
envActions: [
  { id: 'phone_away', label: 'スマホを遠ざけた' },
  { id: 'water_desk', label: '水を机に置いた' },
]
```

If-then の「準備行動」としてチェックリスト上部に配置。ヒートマップには `percent` に `envDone/total` を加重（任意 20%）。

### 5. 難易度診断

WOOP の Wish 入力時にヒューリスティクス:

- 「毎日」「時間」「分」パース → 推定負荷
- `hours >= 1` かつ `frequency === daily` → 警告バナー
- 提案: 「15分から」「週3回から」テンプレをワンタップ挿入

---

## UX 改善案

| 領域 | 提案 |
|------|------|
| オンボーディング | 3画面だけ。「頑張らない」「戻れる」「小さくOK」 |
| ホーム | 今日やることは最大3件までピン留め。残りは「あとで」 |
| チェック | 未完了でも「保存」可能。理由欄は折りたたみ |
| 失敗 | 「リセット」ではなく「また明日の If-then を1つ追加」 |
| 比較 | 「先週の自分: +12%」のみ。ランキング・SNSシェアなし |
| 通知 | 押し付けない。復帰時のみ「おかえり」1回 |

## UI 改善案

- **Glassmorphism**: 既存カードに `backdrop-filter` を統一
- **タイポ**: 数値（達成率）は `Zen Kaku` 太字、見出しは `Noto Serif`
- **色**: 未達成はグレーではなく淡い水色（責めない）
- **モーション**: `prefers-reduced-motion` 尊重。チェック時は 200ms スケール + 淡いグロー
- **ボトムナビ**: モバイルで親指圏に Home / 今日 / 設計 / ふりかえり

## 毎日開きたくなる設計

1. **朝の一行**: ランダムではなく「昨日のあなた」ベース（例: 火曜はいつも少なめ、今日は1分でOK）
2. **開いた瞬間のマイクロウィン**: 起動時に「開いた」が自動で軽く光る（既に成功）
3. **週次レター**: 日曜に過去7日の「できたこと」だけをまとめたカード
4. **季節の背景**: 微細なグラデーション変化（同じ UI のまま新鮮さ）
5. **復帰ストーリー**: 途切れた後に戻ると「○日ぶりの再開」バッジがコレクション化

## モバイル演出

- タップ: `haptic` は不可だが `navigator.vibrate?.(10)` で軽い振動（Android）
- 音: `AudioContext` で 880Hz 0.08s（成功）、440Hz（マイクロウィン）
- スワイプ: チェック項目を右スワイプで完了
- Safe area: `padding-bottom: env(safe-area-inset-bottom)`

## 継続率を高める心理学ベースのアイデア

- **Implementation intention**: If-then を最優先（既に実装済み）
- **Temptation bundling**: THEN に「好きな音楽を流す」をテンプレ
- **Fresh start**: 月曜・月初に「小さく始める週」バナー
- **Self-compassion**: 理由欄のプレースホルダを肯定型に
- **Variable reward**: マイクロウィン完了時のみ稀に特別メッセージ
