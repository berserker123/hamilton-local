// Sanitizes briefing text so every item reads as news: no forum comment/reply counts and no
// "有网友发帖称 / 网友热议：" lead-ins. Only trims text; never adds words.
// Used by scripts/sync-briefing.mjs (website) and mirrored in hamilton-watch/newsletter/combined.py.

const ZH_LEADIN = /^(?:网友热议[：:]\s*|(?:有网友|有市民|有居民|有用户|网友)(?:在\s*(?:r\/\w+|Reddit|社交媒体|论坛|社区论坛)\s*(?:上)?\s*)?(?:发帖|发文|留言|表示|称)(?:称|提及|提到|询问|表示|说|讨论)?\s*[，,:：]?\s*|社区论坛有帖子(?:称|提及|提到|询问|表示)?\s*[，,:：]?\s*)/;
const ZH_COUNTS = [
  /[（(]\s*\d+\s*条(?:评论|回复|留言)\s*[）)]/g,
  /[，,；;]?\s*(?:该帖|帖子|该贴)(?:共|目前|已)?(?:获得|有|收到|引发|吸引)?(?:了)?\s*\d+\s*条(?:评论|回复|留言)(?:讨论)?/g,
  /[，,；;]\s*(?:共|已)?(?:获得|有|收到|引发|吸引)?(?:了)?\s*\d+\s*条(?:评论|回复|留言)\s*(?=[。.]?$)/g,
];
const EN_COUNTS = [
  /\s*[(\[]\s*\d+\s+(?:comments?|replies)\s*[)\]]/gi,
  /(?:\s*[,;·•|–—-]\s*(?:with\s+)?|\s+with\s+)\d+\s+(?:comments?|replies)\s*(?=[.!?]?$)/gi,
];

export function sanitizeBriefingText(text) {
  if (typeof text !== 'string') return text;
  let t = text.trim();
  t = t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1'); // markdown bold from the brief
  const before = t;
  t = t.replace(ZH_LEADIN, '');
  if (t !== before) t = t.replace(/^在(?=\S)/, '');
  for (const re of ZH_COUNTS) t = t.replace(re, '');
  for (const re of EN_COUNTS) t = t.replace(re, '');
  t = t.replace(/\s{2,}/g, ' ').replace(/[，,；;、\s]+([。.!?！？]?)$/, '$1').trim();
  return t;
}

export function hasCommentCount(text) {
  return /\d+\s*条(?:评论|回复|留言)|\b\d+\s+(?:comments?|replies)\b/i.test(String(text || ''));
}
