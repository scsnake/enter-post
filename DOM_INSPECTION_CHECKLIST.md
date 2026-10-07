# Platform DOM Inspection Checklist

This checklist tracks the exact DOM structures for the "Create Post" and "Reply" pathways across all platforms we target. 

## ✅ Verified & Supported Platforms (Current Stage)

### 1. Facebook (https://www.facebook.com)
- `[x]` Main Composer (Feed Post: `div.xzsf02u[contenteditable="true"][role="textbox"]` with `aria-placeholder="*在想些什麼？"`)
- `[x]` Reply Composer (Reply to Post/Comment: `div.xzsf02u[contenteditable="true"][role="textbox"]` with `aria-placeholder="以...的身分留言"`)
- `[x]` Modal Composer (Same as Main Composer, loaded in modal overlay)
- `[x]` Messenger Chat Overlay (on facebook.com: `div.xzsf02u[contenteditable="true"][role="textbox"]` with `aria-placeholder="Aa"`)
- **Evidence/Selectors**:
  - Composer: `div[contenteditable="true"][role="textbox"]` (Lexical editor)
  - Send Button (Post): `div[role="button"][aria-label="發佈"]` / `[aria-label="Post"]`
  - Send Button (Comment): `div[role="button"][aria-label="貼文留言"]` / `[aria-label="Comment"]`

### 2. Instagram (https://www.instagram.com)
- `[x]` Reply Composer (Comment on a Post: `textarea[placeholder="Add a comment…"]`)
- `[x]` Direct Message Input (`div.xzsf02u[contenteditable="true"][role="textbox"]` with `aria-placeholder="Message..."`)
- **Evidence/Selectors**:
  - Comment Composer: `textarea[placeholder*="comment" i]` / `textarea[placeholder*="留言" i]`
  - DM Composer: `div[contenteditable="true"][role="textbox"]` (Lexical editor, placeholder contains "Message" / "訊息")
  - Send Button (DM): `div[role="button"][tabindex="0"]:has(svg[aria-label="Send" i])` / `div[role="button"]:has(svg[aria-label="傳送訊息" i])`

### 3. Messenger (https://www.messenger.com)
- `[x]` Main Composer (Chat input: `div.xzsf02u[contenteditable="true"][role="textbox"]` with `aria-placeholder="Aa"`)
- **Evidence/Selectors**:
  - Composer: `div[contenteditable="true"][role="textbox"]` (Lexical editor)
  - Send Button: `[aria-label="傳送"]` / `[aria-label="Send"]`

### 4. X / Twitter (https://x.com)
- `[x]` Main Composer (Timeline post: `div[contenteditable="true"][role="textbox"]` with `data-testid="tweetTextarea_0"`)
- `[x]` Reply Composer (Reply to tweet: Same as Main Composer)
- `[x]` Modal Composer (Post modal popup: Same as Main Composer)
- `[x]` Direct Messages (Chat input: `textarea[data-testid="dm-composer-textarea"]`)
- **Evidence/Selectors**:
  - Post Composer: `[contenteditable="true"][role="textbox"]` / `[data-testid^="tweetTextarea_"]` (Draft.js, aria-label: `"Post text"` or `"貼文文字"`)
  - DM Composer: `textarea[data-testid="dm-composer-textarea"]` (placeholder: `"Message"`)
  - Send Button (Post): `[data-testid="tweetButtonInline"]` / `[data-testid="tweetButton"]`
  - Send Button (DM): `[data-testid="dmComposerSendButton"]`

### 5. Threads (https://www.threads.net)
- `[x]` Main Composer (Start a thread: `div[contenteditable="true"][role="textbox"]` with `aria-placeholder="What's new?"` / `"有什麼新鮮事？"`)
- `[x]` Reply Composer (Reply under a post: `div[contenteditable="true"][role="textbox"]` with `aria-placeholder="Reply to..."` / `"回覆..."`)
- `[x]` Messages (Direct message chat: `div[contenteditable="true"][role="textbox"]` with `aria-placeholder="Message..."` / `"發送訊息……"`)
- **Evidence/Selectors**:
  - Composer: `[contenteditable="true"][role="textbox"]` (Lexical editor)
  - Send Button (Post): `div[role="button"][aria-label*="Post" i], div[role="button"][aria-label*="Reply" i]`

### 6. Discord (https://discord.com/app)
- `[x]` Main Composer (Channel/DM Chat input: `div[role="textbox"][data-slate-editor="true"]` with classes `slateTextArea_ec4baf`)
- `[x]` Thread / Post Input (Same Slate editor `div[role="textbox"][data-slate-editor="true"]`)
- **Evidence/Selectors**:
  - Composer: `[role="textbox"][data-slate-editor="true"]` (Slate editor)
  - Send Button: None (handled natively via key events)

### 7. YouTube (https://www.youtube.com)
- `[x]` Main Composer (Community post: `div#contenteditable-root[contenteditable="true"][aria-label="在想什麼呢？"]`, Send Button: `button[aria-label="發布"]` / `ytSpecButtonShapeNextHost`)
- `[x]` Reply Composer (Video Comment/Reply: `div#contenteditable-root[contenteditable="true"]` (aria-label "發表留言..." or similar), Send Button: `button` with text "留言" or "回覆" inside `#submit-button` / `ytd-button-renderer#submit-button`)
- **Evidence/Selectors**:
  - Composer: `#contenteditable-root[contenteditable="true"]` (Common to both)
  - Send Button (Comments/Replies): `ytd-button-renderer#submit-button button, ytd-button-renderer#submit-button`
  - Send Button (Community Post): `yt-button-renderer#publish-button button, button[aria-label="發布"]`

---

## ⏳ Pending / Untested Platforms

### WhatsApp (https://web.whatsapp.com)
- `[ ]` Main Composer (Chat input)

### TikTok (https://www.tiktok.com)
- `[ ]` Main Composer (Comment on a Video)
- `[ ]` Reply Composer (Reply to a specific Comment)

### Telegram (https://web.telegram.org)
- `[ ]` Main Composer (Chat input)

### Reddit (https://www.reddit.com)
- `[ ]` Main Composer (Create a Post)
- `[ ]` Reply Composer (Comment on a Post)
- `[ ]` Nested Reply Composer (Reply to a Comment)

### LinkedIn (https://www.linkedin.com)
- `[ ]` Main Composer (Start a post)
- `[ ]` Reply Composer (Comment on a post)

### GitHub (https://github.com)
- `[ ]` Main Composer (New Issue / PR)
- `[ ]` Reply Composer (Comment on Issue / PR)

### Slack (https://app.slack.com)
- `[ ]` Main Composer (Channel/DM Chat input)
- `[ ]` Thread Reply Composer (Reply in Thread)

### LINE (https://web.line.me / https://chat.line.biz)
- `[ ]` Main Composer (Chat input)

### Bluesky (https://bsky.app)
- `[ ]` Main Composer (New Post)
- `[ ]` Reply Composer (Reply to a Post)

### Mastodon (e.g. https://mastodon.social)
- `[ ]` Main Composer (Publish)
- `[ ]` Reply Composer (Reply)

### Niconico (https://www.nicovideo.jp)
- `[ ]` Main Composer (Video Comment)

### note (https://note.com)
- `[ ]` Main Composer (Write Article)
- `[ ]` Reply Composer (Comment on Article)

### Qiita (https://qiita.com)
- `[ ]` Reply Composer (Comment on Article)

### Zenn (https://zenn.dev)
- `[ ]` Reply Composer (Comment on Article)

### Chatwork (https://www.chatwork.com)
- `[ ]` Main Composer (Chat input)
