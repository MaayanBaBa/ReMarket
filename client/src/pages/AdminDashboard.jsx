import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardMedia,
  Button, Alert, Grid, Chip, CircularProgress, Divider
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { getPendingProducts, updateProduct, deleteProduct, resolveProductImageUrl } from '../services/api'

export default function AdminDashboard() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = () => {
    setLoading(true)
    getPendingProducts()
      .then(res => setPending(res.data || []))
      .catch(() => setPending([]))
      .finally(() => setLoading(false))
  }

  const handleApprove = async (id) => {
    try {
      await updateProduct(id, { approved: true })
      setMessage('המוצר אושר ✅')
      setPending(prev => prev.filter(p => p._id !== id))
    } catch {
      setMessage('שגיאה באישור')
    }
  }

  const handleReject = async (id) => {
    try {
      await deleteProduct(id)
      setMessage('המוצר נדחה ❌')
      setPending(prev => prev.filter(p => p._id !== id))
    } catch {
      setMessage('שגיאה בדחיה')
    }
  }

  return (
    <Container sx={{ mt: 5, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>🛡️ לוח מנהל ראשי</Typography>
      <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
        רק מנהל ראשי יכול לאשר או לדחות מוצרים שהמוכרים שלחו. מוצרים מאושרים מופיעים לקונים באתר.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? (
        <Box textAlign="center" mt={6}><CircularProgress /></Box>
      ) : pending.length === 0 ? (
        <Alert severity="success">אין מוצרים ממתינים לאישור 🎉</Alert>
      ) : (
        <Grid container spacing={2}>
          {pending.map(p => (
            <Grid item xs={12} sm={6} md={4} key={p._id}>
              <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {p.image ? (
                  <CardMedia
                    component="img"
                    height={{ xs: 120, md: 160 }}
                    image={resolveProductImageUrl(p.image, '400x160')}
                    alt={p.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : null}
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, md: 2 } }}>
                  <Typography fontWeight="bold" variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }}>{p.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1} sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{p.description}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`₪${p.price}`} color="primary" size="small" />
                    {p.quantity != null && (
                      <Chip label={`במלאי: ${p.quantity}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                    מוכר: {p.user?.firstName} {p.user?.lastName}
                  </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ display: 'flex', p: 1, gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApprove(p._id)}
                    size="small"
                  >
                    אשר
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleReject(p._id)}
                    size="small"
                  >
                    דחה
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}