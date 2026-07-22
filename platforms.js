/*
 * Platform registry for enter-post.
 *
 * Each entry describes ONE site whose composer needs Enter-key remapping.
 * `content.js` reads this array and stays platform-agnostic.
 *
 * Fields:
 *   id                  stable slug for storage keys
 *   label               human-readable name shown in popup + hint
 *   hosts               location.hostname suffixes that identify the site
 *   nativeSend          the key combo the site's OWN code treats as "send"
 *                       (used to synthesize a fallback send event when we
 *                       cannot click a send button)
 *   composerSelector    CSS selector matching the composer element(s).
 *                       Multi-selectors (comma-joined) are fine for sites
 *                       with more than one composer type on a page.
 *   sendButtonSelector  optional. When present, content.js clicks it as
 *                       the preferred way to send — more reliable than
 *                       key synthesis with React/Slate/Lexical composers.
 *                       Resolved relative to the closest composer ancestor
 *                       that also contains it (see resolveSendButton()).
 *   insertNewline       'textarea' | 'contenteditable' — how to insert a
 *                       newline when we intercept plain Enter.
 *
 * NOTE: keep manifest.json's host_permissions and content_scripts.matches
 * in sync with the hosts listed here. MV3 requires them to be static.
 */
(function () {
  const PLATFORMS = [
    {
      id: 'x',
      label: 'X / Twitter',
      hosts: ['x.com', 'twitter.com', 'mobile.twitter.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: '[data-testid^="tweetTextarea"], [data-testid="dmComposerTextInput"]',
      sendButtonSelector: '[data-testid="tweetButton"], [data-testid="tweetButtonInline"], [data-testid="dmComposerSendButton"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'threads',
      label: 'Threads',
      hosts: ['threads.net', 'threads.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: '[contenteditable="true"][role="textbox"]',
      sendButtonSelector: 'div[role="button"][aria-label*="Post" i], div[role="button"][aria-label*="Reply" i]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'bluesky',
      label: 'Bluesky',
      hosts: ['bsky.app'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: '[data-testid="composerTextInput"], .ProseMirror',
      sendButtonSelector: '[data-testid="composerPublishBtn"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'mastodon',
      label: 'Mastodon',
      hosts: ['mastodon.social', 'mastodon.online', 'mstdn.social', 'mas.to', 'mastodon.world'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: 'textarea.autosuggest-textarea__textarea, textarea#reply-textarea',
      sendButtonSelector: 'button.button.button--block, button[type="submit"].button',
      insertNewline: 'textarea',
    },
    {
      id: 'reddit',
      label: 'Reddit',
      hosts: ['reddit.com', 'www.reddit.com', 'new.reddit.com', 'old.reddit.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: 'shreddit-composer [contenteditable="true"], .public-DraftEditor-content, textarea.commentarea textarea, textarea[name="text"]',
      sendButtonSelector: 'button[slot="submit-button"], button:has(> span:contains("Comment"))',
      insertNewline: 'contenteditable',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      hosts: ['linkedin.com', 'www.linkedin.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: '.ql-editor[contenteditable="true"], [role="textbox"][contenteditable="true"]',
      sendButtonSelector: '.share-actions__primary-action, button.msg-form__send-button',
      insertNewline: 'contenteditable',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
      nativeSend: 'Enter',
      composerSelector: '[role="textbox"][contenteditable="true"], [aria-label*="comment" i][contenteditable="true"]',
      sendButtonSelector: '[aria-label="Post"], [aria-label="Comment"], [aria-label="Reply"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      hosts: ['instagram.com', 'www.instagram.com'],
      nativeSend: 'Enter',
      composerSelector: 'textarea[aria-label*="comment" i], textarea[aria-label*="message" i], [role="textbox"][contenteditable="true"]',
      sendButtonSelector: 'div[role="button"][tabindex="0"]:has(svg[aria-label="Send" i])',
      insertNewline: 'textarea',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: '#contenteditable-root[contenteditable="true"], ytd-commentbox #contenteditable-root',
      sendButtonSelector: '#submit-button button, ytd-button-renderer#submit-button',
      insertNewline: 'contenteditable',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      hosts: ['tiktok.com', 'www.tiktok.com'],
      nativeSend: 'Enter',
      composerSelector: '[data-e2e="comment-input"] [contenteditable="true"], div[contenteditable="plaintext-only"]',
      sendButtonSelector: '[data-e2e="comment-post"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'discord',
      label: 'Discord',
      hosts: ['discord.com'],
      nativeSend: 'Enter',
      composerSelector: '[role="textbox"][data-slate-editor="true"]',
      sendButtonSelector: null,
      insertNewline: 'contenteditable',
    },
    {
      id: 'slack',
      label: 'Slack',
      hosts: ['app.slack.com', 'slack.com'],
      nativeSend: 'Enter',
      composerSelector: '.ql-editor[contenteditable="true"], [data-qa="message_input"] [contenteditable="true"]',
      sendButtonSelector: '[data-qa="texty_send_button"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      hosts: ['web.whatsapp.com'],
      nativeSend: 'Enter',
      composerSelector: '[contenteditable="true"][data-tab="10"], [contenteditable="true"][role="textbox"]',
      sendButtonSelector: 'button[aria-label="Send"], span[data-icon="send"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'messenger',
      label: 'Messenger',
      hosts: ['messenger.com', 'www.messenger.com'],
      nativeSend: 'Enter',
      composerSelector: '[role="textbox"][contenteditable="true"]',
      sendButtonSelector: '[aria-label="Press Enter to send"], [aria-label="Send"]',
      insertNewline: 'contenteditable',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      hosts: ['web.telegram.org'],
      nativeSend: 'Enter',
      composerSelector: '.input-message-input[contenteditable="true"], #editable-message-text',
      sendButtonSelector: '.send-as-button, button.Button.send',
      insertNewline: 'contenteditable',
    },
    {
      id: 'github',
      label: 'GitHub',
      hosts: ['github.com'],
      nativeSend: 'Ctrl+Enter',
      composerSelector: 'textarea.js-comment-field, textarea[name="comment[body]"], textarea[name="pull_request[body]"], textarea[name="issue[body]"]',
      sendButtonSelector: 'button[data-disable-invalid][type="submit"]',
      insertNewline: 'textarea',
    },
  ];

  function findPlatform(hostname) {
    const h = (hostname || '').toLowerCase();
    for (const p of PLATFORMS) {
      for (const host of p.hosts) {
        if (h === host || h.endsWith('.' + host)) return p;
      }
    }
    return null;
  }

  self.ENTER_POST = self.ENTER_POST || {};
  self.ENTER_POST.platforms = PLATFORMS;
  self.ENTER_POST.findPlatform = findPlatform;
})();
