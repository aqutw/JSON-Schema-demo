# JSON Schema usage demo

以 **JSON Schema Draft 2020-12 + Ajv 8** 定義與驗證資料契約。可直接執行，包含有效／無效 JSON、CLI、自動測試與 GitHub Actions。無需伺服器或 API key。

## 快速開始

需要 Node.js 22 以上與 npm。

```sh
npm ci
npm run demo
npm test
```

`demo` 會驗證四個案例：兩個成功、兩個預期失敗；全部符合預期時結束碼為 0。

## 驗證自己的 JSON

```sh
npm run validate -- user examples/user.valid.json
npm run validate -- user examples/user.invalid.json
npm run validate -- payment examples/payment.valid.json
```

CLI 結束碼：`0` 有效、`1` 資料未通過驗證、`2` 參數／讀檔／JSON 解析錯誤。無效案例回傳非零是預期行為。

輸出格式：

```json
{"valid": true, "errors": []}
```

錯誤保留 Ajv 的 `instancePath`、`schemaPath`、`keyword`、`params` 與 `message`，方便定位欄位；設定 `allErrors: true` 一次收集多個錯誤。

## Schema 重點

| 概念 | 位置 | 行為 |
| --- | --- | --- |
| `type`、`required`、數值範圍 | `schemas/user.schema.json` | id 為正整數，age 介於 18–120 |
| `format: email` | user.email | 使用 ajv-formats 啟用格式驗證 |
| `$defs`、`$ref` | user.address | 共用巢狀地址，郵遞區號為 3–6 位數字字串 |
| `additionalProperties: false` | user、address、payment | 拒絕未知欄位 |
| `uniqueItems`、`maxItems` | user.tags | 標籤不可重複，最多五個 |
| `if` / `then` | user.role | admin 必須提供非空 permissions |
| 可選與 null | user.nickname | 可省略或為 null；非 null 時不得為空字串 |
| `oneOf`、`const` | `schemas/payment.schema.json` | card 或 transfer 恰好符合一個分支 |

注意：schema 的 `default` 是註記；此 demo **不會插入預設值、不做型別轉換、不刪除未知欄位**。例如字串 `"1"` 不能代替整數 `1`。email format 僅檢查語法，不會確認信箱存在。這裡刻意示範語言無關的資料契約，不包含業務服務或付款處理。

## 在程式中使用

```js
import { validate } from './src/validator.js';

const result = validate('payment', { kind: 'card', last4: '4242' });
console.log(result.valid); // true
console.log(validate('payment', { kind: 'card' }).errors);
```

Schema 在模組載入時只編譯一次。每次呼叫都複製錯誤結果，後續驗證不會覆蓋先前取得的錯誤。

## 檔案導覽

- `schemas/`：可供其他語言與工具重用的 JSON Schema。
- `examples/`：成功與失敗資料。
- `src/validator.js`：Ajv 設定與可重用 API。
- `src/cli.js`、`src/demo.js`：單檔驗證與導覽範例。
- `test/`：schema 邊界、條件、錯誤隔離與 CLI 結束碼測試。
- `.github/workflows/ci.yml`：安裝鎖定依賴、測試、執行範例。

## 延伸閱讀

- [JSON Schema 官方文件](https://json-schema.org/learn/getting-started-step-by-step)
- [Ajv Draft 2020-12](https://ajv.js.org/json-schema.html#draft-2020-12)
- [Ajv formats](https://ajv.js.org/guide/formats.html)

若想比較 Python 模型驗證、型別轉換與 schema 匯出，請見 [Pydantic-demo](https://github.com/aqutw/Pydantic-demo)。
