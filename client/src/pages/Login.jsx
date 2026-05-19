import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (data) => {
    try {
      const res = await loginUser(data)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'שגיאה בהתחברות')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={6} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, overflow: 'hidden' }}>
        <Typography variant="h4" fontWeight="bold" mb={1} textAlign="center" sx={{ fontSize: { xs: '1.6rem', md: '2.25rem' } }}>
          התחברות
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4} textAlign="center" sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>
          התחברו כדי לנהל הזמנות, לצפות בהודעות ולגלוש בממשק מסודר ואלגנטי.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="אימייל"
            type="email"
            {...register('email', { required: 'שדה חובה' })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="סיסמא"
            type="password"
            {...register('password', { required: 'שדה חובה' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.75, boxShadow: '0 14px 24px rgba(140,111,79,0.18)' }}>
            התחבר
          </Button>
          <Typography textAlign="center" sx={{ color: '#6f7581' }}>
            <Link to="/forgot-password" style={{ color: '#8c6f4f', textDecoration: 'none' }}>שכחת סיסמה?</Link>
          </Typography>
          <Typography textAlign="center" sx={{ color: '#6f7581' }}>
            אין לך חשבון?{' '}
            <Link to="/register" style={{ color: '#8c6f4f', textDecoration: 'none' }}>הירשם כאן</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}