/**
 * Bilinen sır desenleri — tek kaynak.
 *
 * Hem pre-commit hook'u (tools/scan-staged.mjs) hem de test (tools/secrets.test.ts)
 * buradan okur. İki ayrı listede tutmak, birinin diğerinden sessizce ayrışması
 * demekti.
 */
export const SECRET_PATTERNS = [
  ['Anthropic API key', /sk-ant-api\w{2}-[\w-]{20,}/],
  ['Anthropic OAuth token', /sk-ant-oat\w{2}-[\w-]{20,}/],
  ['OpenAI key', /\bsk-proj-[\w-]{20,}/],
  ['OpenAI legacy key', /\bsk-[A-Za-z0-9]{32,}/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}/],
  ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{10,}/],
  ['private key block', /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/],
]

/** Bu dosyaların kendisi desen tanımı içerir; taramadan muaf. */
export const SCAN_EXEMPT = ['tools/secret-patterns.mjs', 'tools/secrets.test.ts']
