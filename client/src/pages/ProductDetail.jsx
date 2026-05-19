import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Grid, Typography, Button, Box, Divider, TextField,
  Alert, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material'
import { getProductById, addSale, addMessage, resolveProductImageUrl } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyDialog, setBuyDialog] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState(false)
  const [buySuccess, setBuySuccess] = useState(false)
  const [error, setError] = useState('')
  const [goneStock, setGoneStock] = useState(false)
  const msgRef = useRef()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { register: regBuy, handleSubmit: handleBuy, formState: { errors: buyErrors } } = useForm()

  useEffect(() => {
    setLoading(true)
    setError('')
    setGoneStock(false)
    setProduct(null)
    getProductById(id)
      .then(res => setProduct(res.data))
      .catch((err) => {
        if (err.response?.status === 410) {
          setGoneStock(true)
          setError(err.response?.data?.message || 'המוצר אזל מהמלאי')
        } else {
          setError('המוצר לא נמצא')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const onSendMessage = async (data) => {
    try {
      await addMessage({
        product: id,
        content: data.content
      })
      setMsgSuccess(true)
      reset()
      setTimeout(() => setMsgSuccess(false), 3000)
    } catch (err) {
      if (err.response?.status === 410) {
        setError(err.response?.data?.message || 'המוצר אזל מהמלאי')
      } else {
        setError('שגיאה בשליחת הודעה')
      }
    }
  }

  const onBuy = async (data) => {
    try {
      setError('')
      let latest
      try {
        const check = await getProductById(id)
        latest = check.data
      } catch (e) {
        if (e.response?.status === 410) {
          setBuyDialog(false)
          setGoneStock(true)
          setProduct(null)
          setError(e.response?.data?.message || 'המוצר אזל מהמלאי')
          return
        }
        throw e
      }
      const q = latest?.quantity ?? 0
      if (q < 1) {
        setProduct(latest)
        setBuyDialog(false)
        setError('המוצר אזל מהמלאי לפני השלמת הרכישה — לא נשמרו פרטים ולא חויבת.')
        return
      }
      setProduct(latest)

      await addSale({
        product: id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        notes: data.notes
      })
      setBuySuccess(true)
      setBuyDialog(false)
      try {
        const r = await getProductById(id)
        setProduct(r.data)
      } catch (e) {
        if (e.response?.status === 410) {
          setGoneStock(true)
          setProduct(null)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה ברכישה')
    }
  }

  /** מניעת מילוי טופס לשווא: מאמתים מלאי מול השרת רגע לפני פתיחת הדיאלוג */
  const openBuyDialog = useCallback(async () => {
    if (!user || !product) return
    const sid = product.user?._id || product.user
    const owner = sid && String(sid) === String(user._id)
    const pend = product.approved === false
    if (pend || owner) return
    const stockNow = product.quantity ?? 0
    if (stockNow < 1) return

    setError('')
    try {
      const r = await getProductById(id)
      const q = r.data?.quantity ?? 0
      setProduct(r.data)
      if (q < 1) {
        setError('המוצר אזל מהמלאי — לא ניתן לרכוש. אין צורך למלא פרטי רכישה.')
        return
      }
      setBuyDialog(true)
    } catch (e) {
      if (e.response?.status === 410) {
        setGoneStock(true)
        setProduct(null)
        setError(e.response?.data?.message || 'המוצר אזל מהמלאי')
        return
      }
      setError('לא ניתן לאמת מלאי — נסי שוב בעוד רגע')
    }
  }, [user, id, product])

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>

  if (goneStock) {
    return (
      <Container sx={{ mt: 5, mb: 8, direction: 'rtl', textAlign: 'center' }}>
        {buySuccess && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'right' }}>
            הרכישה בוצעה בהצלחה! 🎉
          </Alert>
        )}
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'right' }}>
          {error || 'המוצר אזל מהמלאי. לא ניתן לצפות בפרטיו או לרכוש אותו.'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/products')}>
          חזרה לכל המוצרים
        </Button>
      </Container>
    )
  }

  if (!product) {
    return (
      <Container sx={{ mt: 5, direction: 'rtl' }}>
        {error ? <Alert severity="error">{error}</Alert> : <Typography textAlign="center">המוצר לא נמצא</Typography>}
      </Container>
    )
  }

  const imgUrl = resolveProductImageUrl(product.image)

  const sellerId = product.user?._id || product.user
  const isOwner = user && sellerId && String(sellerId) === String(user._id)
  const isMainAdmin = !!user?.isMainAdmin
  const pendingApproval = product.approved === false
  const stockQty = product.quantity ?? 0
  const outOfStock = stockQty < 1

  return (
    <Container sx={{ mt: 5, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      {buySuccess && <Alert severity="success" sx={{ mb: 2 }}>הרכישה בוצעה בהצלחה! 🎉</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {pendingApproval && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {isOwner
            ? 'המוצר ממתין לאישור המנהל הראשי לפני פרסום באתר.'
            : 'מוצר זה עדיין לא אושר לפרסום; לא ניתן לרכוש אותו.'}
        </Alert>
      )}
      {outOfStock && !isOwner && !isMainAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          המוצר אזל מהמלאי — <strong>לא ניתן לרכוש</strong>. אפשר רק להמשיך שיחה עם המוכר בהודעות (אם כבר נפתחה שיחה).
        </Alert>
      )}
      {outOfStock && (isOwner || isMainAdmin) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          אזל מהמלאי — המוצר לא מוצג ברשימת המוצרים לקונים עד שתוגדר כמות חיובית במלאי.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 4 }}>
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={imgUrl}
            alt={product.name}
            sx={{ 
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              borderRadius: 3, 
              boxShadow: '0 12px 32px rgba(34,50,80,0.12)',
              display: 'block',
              objectFit: 'cover'
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>{product.name}</Typography>
          {product.category?.name && (
            <Chip label={product.category.name} color="secondary" sx={{ my: 1 }} />
          )}
          <Typography variant="body1" color="text.secondary" mt={1} mb={2} sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            {product.description}
          </Typography>
          <Typography variant="h4" color="primary" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            ₪{product.price}
          </Typography>
          {outOfStock ? (
            <Chip label="אזל מהמלאי — אין רכישה" color="error" sx={{ mb: 2 }} />
          ) : (
            <Chip label={`במלאי: ${stockQty}`} color="success" variant="outlined" sx={{ mb: 2 }} />
          )}
          <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
            מוכר: {product.user?.firstName} {product.user?.lastName}
          </Typography>

          {user ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={pendingApproval || isOwner || outOfStock}
              onClick={openBuyDialog}
              sx={{ mb: 2 }}
            >
              {outOfStock ? 'אזל מהמלאי — אין רכישה' : 'רכוש עכשיו'}
            </Button>
          ) : (
            <Button variant="outlined" size="large" fullWidth onClick={() => navigate('/login')}>
              התחבר לרכישה
            </Button>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 5 }} />

      {/* Message to seller — not for listing owner; blocked by server when out of stock for buyers */}
      {!isOwner && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2} ref={msgRef}>
            📩 פנייה למוכר
          </Typography>
          {!user ? (
            <Alert severity="info">יש להתחבר כדי לשלוח הודעה</Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSendMessage)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {outOfStock && (
                <Alert severity="info">
                  המוצר אזל מהמלאי — עדיין אפשר להמשיך את השיחה עם המוכר (הודעות נוספות, תיאום וכו׳).
                </Alert>
              )}
              {msgSuccess && <Alert severity="success">ההודעה נשלחה בהצלחה!</Alert>}
              <TextField
                label="תוכן ההודעה"
                multiline
                rows={4}
                {...register('content', { required: 'נא להזין תוכן' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSubmit(onSendMessage)()
                  }
                }}
                error={!!errors.content}
                helperText={errors.content?.message || 'Enter לשליחה · Shift+Enter לשורה חדשה'}
              />
              <Button type="submit" variant="outlined">שלח הודעה</Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Buy Dialog */}
      <Dialog open={buyDialog} onClose={() => setBuyDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ direction: 'rtl' }}>פרטי רכישה</DialogTitle>
        <DialogContent sx={{ direction: 'rtl' }}>
          <Box component="form" id="buy-form" onSubmit={handleBuy(onBuy)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ mb: 0 }}>
              לפני אישור הרכישה המערכת בודקת שוב שיש מלאי — אם נגמר בינתיים, תקבלי הודעה ולא תבוצע חיוב.
            </Alert>
            <Typography variant="subtitle1">פרטי לקוח ומשלוח</Typography>
            <TextField
              label="שם מלא"
              {...regBuy('customerName', { required: 'שדה חובה' })}
              error={!!buyErrors.customerName}
              helperText={buyErrors.customerName?.message}
            />
            <TextField
              label="טלפון"
              {...regBuy('customerPhone', { required: 'שדה חובה' })}
              error={!!buyErrors.customerPhone}
              helperText={buyErrors.customerPhone?.message}
            />
            <TextField
              label="כתובת למשלוח"
              {...regBuy('shippingAddress', { required: 'שדה חובה' })}
              error={!!buyErrors.shippingAddress}
              helperText={buyErrors.shippingAddress?.message}
            />
            <TextField
              label="הערות (אופציונלי)"
              multiline
              rows={2}
              {...regBuy('notes')}
            />

            <Typography variant="subtitle1">פרטי כרטיס אשראי</Typography>
            <TextField
              label="מספר כרטיס"
              {...regBuy('cardNumber', { required: 'שדה חובה', pattern: { value: /^\d{16}$/, message: '16 ספרות' } })}
              error={!!buyErrors.cardNumber}
              helperText={buyErrors.cardNumber?.message}
              inputProps={{ maxLength: 16 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="תוקף (MM/YY)"
                {...regBuy('expiry', { required: 'שדה חובה' })}
                error={!!buyErrors.expiry}
                helperText={buyErrors.expiry?.message}
                fullWidth
              />
              <TextField
                label="CVV"
                {...regBuy('cvv', { required: 'שדה חובה', pattern: { value: /^\d{3,4}$/, message: '3-4 ספרות' } })}
                error={!!buyErrors.cvv}
                helperText={buyErrors.cvv?.message}
                fullWidth
                inputProps={{ maxLength: 4 }}
              />
            </Box>
            <TextField
              label="שם בעל הכרטיס"
              {...regBuy('cardHolder', { required: 'שדה חובה' })}
              error={!!buyErrors.cardHolder}
              helperText={buyErrors.cardHolder?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ direction: 'rtl', gap: 1, px: 3, pb: 2 }}>
          <Button onClick={() => setBuyDialog(false)}>ביטול</Button>
          <Button type="submit" form="buy-form" variant="contained">
            אשר רכישה – ₪{product.price}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}