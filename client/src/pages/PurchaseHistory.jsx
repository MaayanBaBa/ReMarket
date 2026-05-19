import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert,
  Card, CardContent, Chip, Grid, Divider, Stepper, Step, StepLabel
} from '@mui/material'
import { getSales } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import {
  TRACKING_STATUS_ORDER,
  TRACKING_STATUS_LABELS,
  trackingStatusLabel,
  trackingStepIndex,
} from '../constants/orderTracking'

export default function PurchaseHistory() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?._id) return
    getSales()
      .then(res => setSales(res.data || []))
      .catch(() => setError('שגיאה בטעינת הקניות'))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>

  return (
    <Container sx={{ mt: 5, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        <ShoppingBagIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
        היסטוריית קניות ומעקב משלוח
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
        כאן רואים כל רכישה, איפה החבילה נמצאת לפי עדכון המוכר, ומתי צפוי שהיא תגיע (אם הוזן).
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {sales.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          עדיין לא בצעת קניות
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sales.map(s => {
            const step = trackingStepIndex(s.trackingStatus)
            const activeStep =
              s.trackingStatus === 'delivered' ? TRACKING_STATUS_ORDER.length : step
            return (
              <Grid item xs={12} key={s._id}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography fontWeight="bold">{s.product?.name || 'מוצר לא ידוע'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          הזמנה מתאריך {new Date(s.saleDate).toLocaleString('he-IL')}
                        </Typography>
                      </Box>
                      <Chip label={`₪${s.product?.price}`} color="primary" />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocalShippingIcon color="action" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">
                        מצב משלוח: {trackingStatusLabel(s.trackingStatus)}
                      </Typography>
                    </Box>

                    <Stepper activeStep={activeStep} alternativeLabel sx={{ py: 2, overflowX: 'auto' }}>
                      {TRACKING_STATUS_ORDER.map((key) => (
                        <Step key={key} completed={TRACKING_STATUS_ORDER.indexOf(key) < activeStep}>
                          <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.72rem' } }}>
                            {TRACKING_STATUS_LABELS[key]}
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>

                    <Alert severity="info" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>איפה החבילה עכשיו?</Typography>
                      <Typography variant="body2">
                        {s.trackingLocation || 'עדיין לא עודכן מיקום'}
                      </Typography>
                    </Alert>

                    {s.estimatedDeliveryAt && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>צפוי להגיע בערך:</strong>{' '}
                        {new Date(s.estimatedDeliveryAt).toLocaleString('he-IL', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </Typography>
                    )}

                    {s.trackingNote ? (
                      <Typography variant="body2" color="text.secondary">
                        <strong>הערת מוכר:</strong> {s.trackingNote}
                      </Typography>
                    ) : null}

                    {s.trackingUpdatedAt && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        עדכון מעקב אחרון: {new Date(s.trackingUpdatedAt).toLocaleString('he-IL')}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2">
                      מוכר: {s.seller?.firstName} {s.seller?.lastName}
                    </Typography>
                    {(s.customerName || s.shippingAddress) && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {s.customerName ? `שם למשלוח: ${s.customerName}` : ''}
                        {s.customerName && s.shippingAddress ? ' • ' : ''}
                        {s.shippingAddress ? `כתובת: ${s.shippingAddress}` : ''}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Container>
  )
}
