import { useCallback, useEffect, useState } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Card, CardContent,
  Button, Grid, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem
} from '@mui/material'
import { getSales, updateSale } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  TRACKING_STATUS_ORDER,
  TRACKING_STATUS_LABELS,
  trackingStatusLabel,
} from '../constants/orderTracking'

export default function SellerOrders() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({
    trackingStatus: 'pending',
    trackingLocation: '',
    estimatedDeliveryAt: '',
    trackingNote: '',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const req = user?.isMainAdmin ? getSales() : getSales({ role: 'seller' })
    req
      .then(res => setSales(res.data || []))
      .catch(() => setError('שגיאה בטעינת הזמנות'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user?._id) return
    load()
  }, [user, load])

  const openEdit = (s) => {
    setEdit(s)
    setForm({
      trackingStatus: s.trackingStatus || 'pending',
      trackingLocation: s.trackingLocation || '',
      estimatedDeliveryAt: s.estimatedDeliveryAt
        ? new Date(s.estimatedDeliveryAt).toISOString().slice(0, 16)
        : '',
      trackingNote: s.trackingNote || '',
    })
  }

  const saveEdit = async () => {
    if (!edit) return
    setSaving(true)
    setMsg('')
    try {
      await updateSale(edit._id, {
        trackingStatus: form.trackingStatus,
        trackingLocation: form.trackingLocation.trim() || 'לא צוין',
        estimatedDeliveryAt: form.estimatedDeliveryAt || null,
        trackingNote: form.trackingNote.trim(),
      })
      setMsg('המעקב עודכן')
      setEdit(null)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>

  return (
    <Container sx={{ mt: 5, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        הזמנות על המוצרים שלי
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
        עדכני כאן איפה החבילה נמצאת ומתי צפוייה להגיע — הקונה רואה את המידע ב״היסטוריית קניות״.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      {sales.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          אין הזמנות להצגה
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sales.map(s => (
            <Grid item xs={12} md={6} key={s._id}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography fontWeight="bold">{s.product?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    קונה: {s.buyer?.firstName} {s.buyer?.lastName} • {new Date(s.saleDate).toLocaleDateString('he-IL')}
                  </Typography>
                  <Chip label={trackingStatusLabel(s.trackingStatus)} color="secondary" size="small" sx={{ mt: 1 }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    מיקום: {s.trackingLocation || '—'}
                  </Typography>
                  {s.estimatedDeliveryAt && (
                    <Typography variant="caption" display="block">
                      צפי הגעה: {new Date(s.estimatedDeliveryAt).toLocaleString('he-IL')}
                    </Typography>
                  )}
                  {s.shippingAddress && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      משלוח ל: {s.shippingAddress}
                    </Typography>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Button variant="contained" size="small" onClick={() => openEdit(s)}>
                    עדכון מעקב משלוח
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ direction: 'rtl' }}>עדכון מעקב — {edit?.product?.name}</DialogTitle>
        <DialogContent sx={{ direction: 'rtl', pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="סטטוס משלוח"
            value={form.trackingStatus}
            onChange={(e) => setForm((p) => ({ ...p, trackingStatus: e.target.value }))}
            fullWidth
          >
            {TRACKING_STATUS_ORDER.map((key) => (
              <MenuItem key={key} value={key}>{TRACKING_STATUS_LABELS[key]}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="איפה החבילה נמצאת עכשיו?"
            placeholder="למשל: במרכז מיון דואר חיפה"
            value={form.trackingLocation}
            onChange={(e) => setForm((p) => ({ ...p, trackingLocation: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="מתי צפוי להגיע לקונה? (אופציונלי)"
            type="datetime-local"
            value={form.estimatedDeliveryAt}
            onChange={(e) => setForm((p) => ({ ...p, estimatedDeliveryAt: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="הערה לקונה (אופציונלי)"
            value={form.trackingNote}
            onChange={(e) => setForm((p) => ({ ...p, trackingNote: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEdit(null)}>ביטול</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>
            {saving ? 'שומר…' : 'שמירה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
