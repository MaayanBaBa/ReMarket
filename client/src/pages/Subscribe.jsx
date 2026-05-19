import { useEffect, useState } from 'react'
import {
  Box, Button, Container, TextField, Typography, Alert, Paper,
  CircularProgress, Divider
} from '@mui/material'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { getSubscriptionStatus, subscribeSeller } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Subscribe() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromRegistration = Boolean(location.state?.welcomeSeller)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardHolder: ''
  })

  const refresh = () => {
    setLoading(true)
    setError('')
    getSubscriptionStatus()
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.response?.data?.message || 'שגיאה בטעינת סטטוס מנוי'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const onPay = async () => {
    setPaying(true)
    setError('')
    try {
      await subscribeSeller(form)
      await refreshUser()
      await refresh()
      navigate('/', { replace: true, state: { subscribed: true } })
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || 'שגיאה בתשלום')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>

  const untilMs = user?.sellerSubscriptionUntil
    ? new Date(user.sellerSubscriptionUntil).getTime()
    : 0
  const sellerActiveFromUser =
    user?.status === 'seller' && untilMs > Date.now()

  const untilText = (user?.sellerSubscriptionUntil || status?.sellerSubscriptionUntil)
    ? new Date(user?.sellerSubscriptionUntil || status?.sellerSubscriptionUntil).toLocaleDateString('he-IL')
    : null

  const showSubscribed = sellerActiveFromUser || status?.active

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          מנוי מוכר – פרטי אשראי
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
          כדי להציע מוצרים ב-ReMarket נדרש מנוי של <strong>20₪ לחודש</strong>. כאן ממלאים את פרטי כרטיס האשראי (בפרויקט זה סימולציה בלבד – לא מתבצע חיוב אמיתי).
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>מה קורה אחרי התשלום?</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 0 }}>
            <li><Typography variant="body2">נפתחת לך אפשרות להעלות מוצרים ולנהל הודעות מקונים.</Typography></li>
            <li><Typography variant="body2">כל מוצר שתעלי עובר לאישור המנהל הראשי לפני שהוא מופיע לקונים בחנות.</Typography></li>
          </Box>
        </Alert>

        <Divider sx={{ my: 2 }} />

        {fromRegistration && user?.status === 'buyer' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            נרשמת בהצלחה. כדי להשלים פתיחת חשבון מוכרת, מלאי למטה את פרטי האשראי (סימולציה).
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {user?.status === 'admin' ? (
          <Alert severity="info">למנהל ראשי אין צורך במנוי מוכר.</Alert>
        ) : showSubscribed ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              המנוי פעיל{untilText ? ` עד ${untilText}` : ''}. אפשר להמשיך ל־
              {' '}
              <Link to="/add-product" style={{ color: 'inherit', fontWeight: 'bold' }}>הוספת מוצר</Link>.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              זכרי: כל מוצר חדש יישלח לאישור המנהל הראשי לפני פרסום.
            </Typography>
          </>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              כרגע אין מנוי מוכר פעיל. מלאי את הפרטים למטה כדי להפעיל מנוי לחודש (20₪).
            </Alert>

            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={(e) => e.preventDefault()}>
              <TextField
                label="מספר כרטיס (16 ספרות)"
                value={form.cardNumber}
                onChange={(e) => setForm((p) => ({ ...p, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                helperText="לדוגמה לבדיקה: 4242424242424242"
                inputProps={{ inputMode: 'numeric', maxLength: 16, autoComplete: 'off' }}
                fullWidth
              />
              <TextField
                label="תוקף (MM/YY)"
                value={form.expiry}
                onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))}
                inputProps={{ maxLength: 7, autoComplete: 'off' }}
                fullWidth
              />
              <TextField
                label="CVV"
                type="password"
                value={form.cvv}
                onChange={(e) => setForm((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                inputProps={{ inputMode: 'numeric', maxLength: 4, autoComplete: 'off' }}
                fullWidth
              />
              <TextField
                label="שם בעל הכרטיס"
                value={form.cardHolder}
                onChange={(e) => setForm((p) => ({ ...p, cardHolder: e.target.value }))}
                inputProps={{ autoComplete: 'name' }}
                fullWidth
              />

              <Button variant="contained" size="large" onClick={onPay} disabled={paying}>
                {paying ? 'מעבד תשלום…' : 'שלמי והפעילי מנוי מוכר (20₪ לחודש)'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  )
}
