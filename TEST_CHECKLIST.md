# enter-post 手動測試清單

實作完成後，於 Chrome 以 **載入未封裝項目** 匯入 `enter-post/` 資料夾後，逐項勾選。
每個項目都可以獨立驗證；發現問題請記下 **平台 / 步驟 / 觀察到的行為** 三項。

> 圖例: `A` = 送出按鈕確認成功送出；`N` = 換行符成功插入；`H` = 提示氣泡狀態符合預期。

---

## 0. 安裝與載入

- [ ] `chrome://extensions/` → 開啟開發人員模式 → 載入未封裝項目 → 選 `enter-post/` 資料夾。
- [ ] 無 manifest 錯誤（頁面上方無紅色警告）。
- [ ] 工具列出現琥珀色 Enter 圖示。
- [ ] 點圖示彈出 popup，可看到「Send mode」單選、「Supported sites」清單。
- [ ] 開啟 Chrome DevTools（F12） → Console 分頁：切到支援的平台後，無來自 `content.js` / `platforms.js` 的紅色錯誤。

---

## 1. 預設模式（Ctrl+Enter 送出、Enter 換行）— 主要驗證

在 popup 內確認 **Send mode** 選擇為 `Ctrl/⌘+Enter sends`；**Show hint bubble** 保持勾選。

### 1-1. 原本就是 Ctrl+Enter 送出的平台（不需要改寫送出，只需保護 Enter）

在下列平台的 composer 輸入一句話後測試:

| 平台 | 測試網址 | Enter | Ctrl/⌘+Enter | 提示 |
|---|---|---|---|---|
| X / Twitter | https://x.com/compose/post | `N` 換行 | `A` 送出 | `H` 顯示無高亮（都是原生） |
| Threads | https://www.threads.net/ (點「New thread」) | `N` | `A` | `H` 無高亮 |
| Bluesky | https://bsky.app/ (點 compose) | `N` | `A` | `H` 無高亮 |
| Reddit | 任一貼文的留言框 | `N` | `A` | `H` 無高亮 |
| LinkedIn | https://www.linkedin.com/feed/ (Start a post) | `N` | `A` | `H` 無高亮 |
| YouTube 留言 | 任一影片底下的留言框 | `N` | `A` | `H` 無高亮 |
| GitHub | 任一 issue / PR 的留言框 | `N` | `A` | `H` 無高亮 |
| Mastodon | 任一已登入 instance | `N` | `A` | `H` 無高亮 |

> 若「無高亮」出現高亮，代表 `nativeSend` 設錯；請回報平台名稱。

### 1-2. 原生 Enter 送出的平台（Enter 需要被攔截改成換行、Ctrl+Enter 需要改成送出）

| 平台 | 測試網址 | Enter | Ctrl/⌘+Enter | 提示 |
|---|---|---|---|---|
| Discord | https://discord.com/channels/@me (私訊) | `N` 換行 | `A` 送出 | `H` 兩個組合都高亮 |
| Slack | https://app.slack.com/ (任一頻道) | `N` | `A` | `H` 兩個組合都高亮 |
| WhatsApp | https://web.whatsapp.com/ | `N` | `A` | `H` 兩個組合都高亮 |
| Messenger | https://www.messenger.com/ | `N` | `A` | `H` 兩個組合都高亮 |
| Telegram | https://web.telegram.org/ | `N` | `A` | `H` 兩個組合都高亮 |
| Facebook 留言 | 任一貼文的留言框 | `N` | `A` | `H` 兩個組合都高亮 |
| Instagram 留言 | 任一貼文的留言框 | `N` | `A` | `H` 兩個組合都高亮 |
| TikTok 留言 | 任一影片的留言框 | `N` | `A` | `H` 兩個組合都高亮 |

> **重點**: `Enter` 不能造成訊息意外送出。若送出了，代表 `preventDefault + stopImmediatePropagation` 未搶在網站前面，或 selector 未覆蓋到當前 composer。

### 1-3. Facebook 混合行為驗證

- [ ] 在 Facebook 主動態的 **建立貼文** 對話框輸入多行後，`Enter` 應換行、`Ctrl+Enter` 應送出。
- [ ] 在 **留言框** 同樣測試，行為要一致（`Enter` = 換行，`Ctrl+Enter` = 送出）。
- [ ] 兩者的提示氣泡都應顯示「Send: `Ctrl+Enter`（高亮）· Newline: `Enter`」。

---

## 2. 切換模式（Enter 送出、Shift+Enter 換行）

打開 popup 切到 `Enter sends`，**重新載入** 分頁後測試:

- [ ] X / Twitter: `Enter` 送出、`Shift+Enter` 換行。（兩個組合都應高亮，因為都被改動）
- [ ] Reddit: 同上。
- [ ] Discord: `Enter` 送出（等於原生）→ 不高亮；`Shift+Enter` 換行（等於原生）→ 不高亮。氣泡應顯示「已是原生 — no remapping needed」。
- [ ] WhatsApp: 同 Discord。

---

## 3. 個別網站關閉

回到預設模式（Ctrl+Enter 送出）。

- [ ] 在 popup 取消勾選 `Discord`。
- [ ] 回到 Discord 分頁，**不需要重新載入**，按 `Enter` 應恢復原生行為（直接送出訊息）。
- [ ] 提示氣泡仍在顯示，Send 顯示 `Enter`（無高亮）、Newline 顯示 `Shift+Enter`（無高亮）、下方灰字提示 `disabled on this site — showing native behavior`。
- [ ] 重新勾選 `Discord`，行為應立刻恢復（`Enter` 換行、`Ctrl+Enter` 送出）。

---

## 4. 提示氣泡（Hint）

**顯示時機（focus-only）:**

- [ ] 進入任一支援平台，**未點入 composer 前不應顯示** 提示氣泡。
- [ ] 點入 composer（游標進入輸入框）→ 氣泡出現。
- [ ] 4 秒後自動淡出，但仍保持在 composer 中打字時不會重複跳出干擾。
- [ ] 按下 Enter / Ctrl+Enter / Shift+Enter 任一組合 → 氣泡短暫（約 2.5 秒）再次出現，方便確認剛才做了什麼。
- [ ] 焦點移出 composer（點外面、切 Tab、切分頁）→ 氣泡立即隱藏。
- [ ] 重新點回 composer → 氣泡再度出現。

**位置（anchored near send button/composer）:**

- [ ] 氣泡出現位置緊鄰送出按鈕上方（若送出按鈕可見）；不可能重疊在其他元件上。
- [ ] 若送出按鈕不可見（如 Discord 沒有送出按鈕 / 貼文未達最低長度前按鈕未出現），則氣泡貼在 composer 上方。
- [ ] 若 composer 上方空間不足，氣泡自動改顯示在下方。
- [ ] 捲動頁面時氣泡跟著 composer / 送出按鈕移動，不會停留在原位置。
- [ ] 視窗縮放時氣泡跟隨。
- [ ] Anchor 元件被捲出視野時，氣泡自動淡出（避免飄在空白處）；回捲又出現。

**互動與樣式:**

- [ ] 滑鼠移到氣泡上時停止倒數；移開後 1.5 秒淡出。
- [ ] 點右上 `×` 立即隱藏；下次進入 composer 焦點會再出現。
- [ ] popup 內取消 `Show hint bubble on supported sites` → 不再有氣泡出現，即使 focus composer 也不會。
- [ ] 重新勾選 → 焦點進入 composer 時恢復顯示。
- [ ] 被 enter-post 改寫的熱鍵 chip 有琥珀色高亮並帶陰影；未改寫的維持深灰底。
- [ ] 深色/淺色系統主題切換後，氣泡色調可讀（macOS 系統偏好設定切換觀察）。

---

## 5. CJK IME 安全性（重要）

於 X / Twitter compose 框:

- [ ] 切到繁體中文/日文輸入法。
- [ ] 打字讓候選字浮現，按 `Enter` **確認候選字**。
- [ ] 不可插入額外換行、也不可送出貼文。
- [ ] 確認完候選字後再單獨按 `Enter`，才會插入換行。

於 Discord 訊息框:

- [ ] 同上流程，按 `Enter` 確認 IME 候選字時不可送出訊息。

---

## 6. 非支援網站

- [ ] 開 https://example.com/ 或任何非清單內的網站。
- [ ] DevTools Console 無 `content.js` 錯誤（因為根本不會注入）。
- [ ] Chrome 分頁右下角沒有提示氣泡。
- [ ] popup 顯示 `Not a supported site`。

---

## 7. 快速回歸區（每次改動 platforms.js 後跑）

只需跑最容易壞的 5 個:

- [ ] X / Twitter compose: Enter 換行、Ctrl+Enter 送出。
- [ ] Reddit 留言: Enter 換行、Ctrl+Enter 送出。
- [ ] Discord: Enter 換行、Ctrl+Enter 送出。
- [ ] WhatsApp: Enter 換行、Ctrl+Enter 送出。
- [ ] Facebook 留言: Enter 換行、Ctrl+Enter 送出。

---

## 回報格式（若發現問題）

```
平台: <name>
模式: <ctrl-enter-send | enter-send>
啟用該站: <yes|no>
輸入焦點在: <composer selector / 描述>
按鍵: <Enter | Ctrl+Enter | Shift+Enter>
預期: <換行 | 送出 | 無變化>
實際: <觀察到的行為>
Console 訊息: <若有>
```
