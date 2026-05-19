import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../services/api'
import { useMemo, useState } from 'react'

function buildAbsoluteResetUrl(resetPath) {
  if (!resetPath) return ''
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
  return `${window.location.origin}${base}${resetPath}`
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [resetPath, setResetPath] = useState('')

  const absoluteUrl = useMemo(() => buildAbsoluteResetUrl(resetPath), [resetPath])

  const onSubmit = async (data) => {
    setError('')
    setInfo('')
    setResetPath('')
    try {
      const res = await forgotPassword({ email: data.email })
      setInfo(res.data?.message || '')
      if (res.data?.resetPath) setResetPath(res.data.resetPath)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'שגיאה בשליחת הבקשה')
    }
  }

  const goToReset = () => {
    if (!resetPath) return
    const q = resetPath.indexOf('?')
    const pathname = q >= 0 ? resetPath.slice(0, q) : resetPath
    const search = q >= 0 ? resetPath.slice(q) : ''
    navigate({ pathname, search })
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          שכחת סיסמה
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
          הזיני את האימייל שאיתו נרשמת. אם הוא קיים במערכת, ייווצר קישור חד-פעמי לאיפוס הסיסמה (תקף לשעה).
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && (
          <Alert severity={resetPath ? 'success' : 'info'} sx={{ mb: 2 }}>{info}</Alert>
        )}
        {resetPath && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              לחצי על הכפתור כדי להמשיך לאיפוס הסיסמה באותו אתר שבו את נמצאת (לא ייפתח פורט או כתובת שגויה):
            </Typography>
            <Button variant="contained" color="secondary" fullWidth sx={{ mt: 1 }} onClick={goToReset}>
              המשיכי לאיפוס סיסמה
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 2, wordBreak: 'break-all', opacity: 0.85 }}>
              להעתקה או פתיחה בלשונית אחרת: {absoluteUrl}
            </Typography>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="אימייל"
            type="email"
            {...register('email', { required: 'שדה חובה' })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" fullWidth>
            שלחי קישור לאיפוס
          </Button>
          <Typography textAlign="center">
            <Link to="/login" style={{ color: '#1976d2' }}>חזרה להתחברות</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
