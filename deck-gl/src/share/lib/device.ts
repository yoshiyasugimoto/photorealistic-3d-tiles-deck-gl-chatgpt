/**
 * 端末 OS が iOS かどうかを判定する
 */
export function isIOS(userAgent?: string): boolean {
  return isIPHONE(userAgent) || isIPAD(userAgent)
}

/**
 * 端末が iPhone かどうかを判定する
 */
export function isIPHONE(userAgent?: string): boolean {
  const ua = (userAgent || navigator.userAgent).toLowerCase()
  return ua.indexOf('iphone') > -1
}

/**
 * 端末が iPad かどうかを判定する
 */
export function isIPAD(userAgent?: string): boolean {
  const ua = (userAgent || navigator.userAgent).toLowerCase()
  return (
    ua.indexOf('ipad') > -1 ||
    (ua.indexOf('macintosh') > -1 && 'ontouchend' in document)
  )
}