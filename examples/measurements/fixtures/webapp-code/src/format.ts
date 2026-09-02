export function formatCurrency(cents: number, currency = 'USD'): string {
  const sign = cents < 0 ? '-' : ''
  const whole = Math.floor(cents / 100)
  const part = cents % 100
  return `${sign}${currency === 'USD' ? '$' : ''}${whole}.${String(part).padStart(2, '0')}`
}
