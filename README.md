# 🧪 Medical Order Format Editor

**ASTM・HL7検査オーダーフォーマットの構文解析・編集ツール**

医療業界でよく使用されるASTM E1394とHL7 v2.xフォーマットの検査オーダーデータを視覚的に解析・編集できるWebアプリケーションです。

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)

## 🌟 特徴

- **多フォーマット対応**: ASTM E1394とHL7 v2.xの両方に対応
- **自動フォーマット判定**: 入力データから自動的にフォーマットを識別
- **視覚的な構文解析**: 表形式、JSON、構文木の3つの表示モード
- **テンプレート機能**: よく使用されるオーダーパターンのテンプレート
- **データエクスポート**: JSON・テキスト形式でのデータ出力
- **レスポンシブデザイン**: デスクトップ・タブレット・スマートフォン対応
- **クライアントサイド**: サーバー不要、完全にブラウザ内で動作

## 🚀 使用方法

### ローカル環境でのテスト

```bash
# uvを使用してローカルサーバーを起動
uv run python -m http.server 8000 --directory public

# ブラウザで http://localhost:8000 にアクセス
```

### 基本的な操作

1. **データ入力**: 左側のテキストエリアにASTMまたはHL7データを入力
2. **フォーマット選択**: 自動判定または手動でフォーマットを選択
3. **構文解析**: 「構文解析」ボタンをクリック（またはCtrl+Enter）
4. **結果確認**: 右側で表形式・JSON・構文木の表示を切り替え
5. **データ出力**: JSONまたはテキスト形式でエクスポート可能

### テンプレート機能

「テンプレート」ボタンから以下のテンプレートを選択できます：

#### ASTM テンプレート
- **血液検査オーダー**: Complete Blood Count (CBC) test order
- **生化学検査オーダー**: Basic metabolic panel test order

#### HL7 テンプレート
- **ラボオーダーメッセージ**: Standard laboratory order message
- **患者入院メッセージ**: Patient admission message

## 📋 サポート対象フォーマット

### ASTM E1394
```
H|\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|20231201120000
P|1||12345||Smith^John^A||19850315|M|||123 Main St^Any City^CA^90210|||||||||||||||||||||
O|1|ORD123|12345^001|^^^CBC^Complete Blood Count^L||R|20231201120000|||||A||||||||||F||||||||
L|1|N
```

### HL7 v2.x
```
MSH|^~\&|LIS|HOSPITAL|LAB|HOSPITAL|20231201120000||ORM^O01^ORM_O01|MSG001|P|2.5
PID|1||12345^^^HOSPITAL^MR||Smith^John^A||19850315|M|||123 Main St^^Any City^CA^90210^USA
ORC|NW|ORD123|ORD123|||||||^Smith^John^A
OBR|1|ORD123|ORD123|CBC^Complete Blood Count^L||20231201120000|||||||||^Smith^John^A||||||||||||F
```

## 🛠️ 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ・アクセシビリティ対応
- **CSS3**: CSS Custom Properties・Flexbox・Grid・レスポンシブデザイン
- **JavaScript (ES6+)**: クラス構文・モジュール・非同期処理

### 構文解析エンジン
- **ASTMParser**: ASTM E1394フォーマット対応
- **HL7Parser**: HL7 v2.xメッセージ対応
- **自動判定**: パターンマッチングによるフォーマット識別

### アーキテクチャ
- **クライアントサイド**: 完全にブラウザ内で動作
- **静的サイト**: CDNフレンドリー・高速配信
- **モジュラー設計**: パーサーとUIの分離

## 🎨 デザインシステム

### カラーパレット
- **プライマリ**: Pale Blue (#E3F2FD - #2196F3)
- **セカンダリ**: Material Design Blue
- **アクセント**: グラデーション効果

### タイポグラフィ
- **システムフォント**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **等幅フォント**: 'SF Mono', 'Monaco', 'Cascadia Code'

## 🌐 Netlifyデプロイ

### 自動デプロイ設定

`netlify.toml`：
```toml
[build]
  publish = "public"
  command = "echo 'Static site - no build required'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### デプロイ手順

1. GitHubリポジトリをNetlifyに接続
2. ビルド設定：
   - **Build command**: `echo 'Static site - no build required'`
   - **Publish directory**: `public`
3. 自動デプロイが有効化されます

## 🧪 テスト・検証

### 動作確認項目

- [ ] ASTM・HL7データの正常な解析
- [ ] フォーマット自動判定の精度
- [ ] レスポンシブデザインの動作
- [ ] アクセシビリティ（キーボード操作・スクリーンリーダー）
- [ ] エクスポート機能の動作
- [ ] エラーハンドリング

### ブラウザサポート

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📈 今後の拡張予定

- [ ] より多くのセグメントタイプへの対応
- [ ] バリデーション機能の強化
- [ ] 複数ファイルの一括処理
- [ ] オーダーデータの編集機能
- [ ] 統計・レポート機能

## 🤝 貢献

プロジェクトへの貢献を歓迎します：

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🏥 医療業界での活用

このツールは以下の用途で活用できます：

- **LIS開発**: 検査情報システムのデータ解析・デバッグ
- **医療機器連携**: 分析装置とのデータ交換確認
- **システム統合**: 異なるフォーマット間のデータ変換支援
- **教育・トレーニング**: ASTM・HL7規格の学習ツール
- **品質管理**: データ整合性の検証

---

**🚀 Powered by Modern Web Technologies | 💙 Made with Pale Blue Design**