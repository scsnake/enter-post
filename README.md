# enter-post

跨社群/聊天平台統一 `Enter` / `Ctrl+Enter` / `Shift+Enter` 熱鍵行為的 Chrome 擴充功能（Manifest V3）。

## 為什麼要做這個

各家平台對「按下 Enter」的處理方式完全不一致:

| 送出貼文/訊息用 `Ctrl+Enter` | 送出貼文/訊息用 `Enter` |
|---|---|
| X / Twitter, Threads, Bluesky, Mastodon, Reddit, LinkedIn, YouTube 留言, GitHub, Facebook 主貼文 | Discord, Slack, WhatsApp, Messenger, Telegram, Facebook 留言, Instagram 留言, TikTok |

同一個網站甚至會混用（Facebook 主貼文用 `Ctrl+Enter`、留言用 `Enter`），常常造成:

- 想換行結果整篇半成品貼出去
- 想送出結果只是換行

`enter-post` 讓所有支援平台都遵守使用者選擇的同一套規則。

## 預設行為

- **送出**: `Ctrl+Enter`（macOS 為 `⌘+Enter`）
- **換行**: `Enter`

可在擴充功能 popup 內切換為「`Enter` 送出、`Shift+Enter` 換行」的聊天式行為，或針對個別網站關閉覆寫。

## 支援平台

X / Twitter · Threads · Bluesky · Mastodon（含常見 instance） · Reddit · LinkedIn · Facebook · Instagram · YouTube 留言 · TikTok · Discord · Slack · WhatsApp Web · Messenger · Telegram Web · GitHub

擴充功能作用時，網頁右下角會出現小型提示氣泡:

```
enter-post · X / Twitter
Send: [Ctrl] + [Enter]
Newline: [Enter]
```

被 `enter-post` 改動過的熱鍵會以琥珀色高亮顯示，一眼看得出哪些是原生、哪些是被改寫。

## 安裝（load unpacked）

1. 開啟 Chrome，前往 `chrome://extensions/`
2. 右上角開啟 **開發人員模式**
3. 點 **載入未封裝項目**，選擇本資料夾 `enter-post/`
4. 圖示應出現在工具列；點擊圖示打開設定 popup

## 檔案結構

```
enter-post/
├── manifest.json       MV3 設定（權限、content_scripts、popup）
├── platforms.js        平台清單（host、composer selector、送出按鈕 selector）
├── content.js          鍵盤攔截、換行插入、送出觸發、提示氣泡
├── hint.css            提示氣泡樣式
├── popup.html/.js/.css 設定介面
├── icons/              16 / 48 / 128 PNG
└── TEST_CHECKLIST.md   實作後的手動測試清單
```

## 已知限制

- 各平台的 composer / 送出按鈕 selector 可能因網站改版失效，需要時更新 `platforms.js`
- CJK IME 組字中按 Enter 不會觸發（透過 `isComposing` 判斷）
- 部分 React/Slate/Lexical 編輯器不接受合成的 KeyboardEvent，優先使用「點擊送出按鈕」的方式而非合成鍵盤事件
