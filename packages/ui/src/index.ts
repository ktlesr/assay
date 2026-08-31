/**
 * @assay/ui — tema, tokenlar ve paylaşılan bileşenler.
 *
 * Tokenlar `@assay/ui/tokens.css`. Bu paket hiçbir Assay paketine bağlanmaz;
 * `Measurement` tipi `@assay/core`'daki `Proportion` ile yapısal olarak
 * uyumludur ve uyum `tools/ui-contract.test.ts` ile denetlenir.
 */

export {
  applyTheme,
  readTheme,
  resolvedTheme,
  themeScript,
  THEME_KEY,
  type Theme,
} from './theme'

export {
  Badge,
  Callout,
  EmptyState,
  ErrorState,
  IntervalRule,
  MetricValue,
  formatMeasurement,
  type CalloutTone,
  type Measurement,
  type VerdictKind,
} from './measurement'

export {
  Button,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  Popover,
  Toast,
  ToastProvider,
  ToastViewport,
  Tooltip,
  TooltipProvider,
  type MenuItem,
} from './overlays'

export { Table, TraceViewer, type Column, type TraceStep } from './data'
