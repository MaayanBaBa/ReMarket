/** סדר שלבים למעקב (מ-0 עד length-1) */
export const TRACKING_STATUS_ORDER = [
  'pending',
  'preparing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
]

export const TRACKING_STATUS_LABELS = {
  pending: 'ממתין לטיפול המוכר',
  preparing: 'בהכנה / אריזה',
  shipped: 'נשלח מהמוכר',
  in_transit: 'בדרך אליך',
  out_for_delivery: 'בחלוקה ליד הכתובת',
  delivered: 'נמסר בהצלחה',
}

export function trackingStatusLabel(status) {
  return TRACKING_STATUS_LABELS[status] || status || 'לא ידוע'
}

export function trackingStepIndex(status) {
  const i = TRACKING_STATUS_ORDER.indexOf(status)
  return i < 0 ? 0 : i
}
