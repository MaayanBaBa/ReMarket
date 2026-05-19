import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'
import { useEffect, useState } from 'react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: emailParam },
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setValue('email', emailParam)
  }, [emailParam, setValue])

  useEffect(() => {
    if (!token || !emailParam) {
      setError('חסר קישור תקף. בקשי איפוס סיסמה מחדש מדף ההתחברות.')
    }
  }, [token, emailParam])

  const onSubmit = async (data) => {
    setError('')
    setSuccess('')
    if (!token) {
      setError('חסר קוד איפוס. נסי לבקש קישור חדש.')
      return
    }
    try {
      await resetPassword({
        email: data.email,
        token,
        password: data.password,
      })
      setSuccess('הסיסמה עודכנה. מעבירה להתחברות...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'שגיאה בעדכון הסיסמה')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          איפוס סיסמה
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="אימייל"
            type="email"
            {...register('email', { required: 'שדה חובה' })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            InputProps={{ readOnly: !!emailParam }}
          />
          <TextField
            label="סיסמה חדשה"
            type="password"
            {...register('password', { required: 'שדה חובה' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!token}
          >
            עדכני סיסמה
          </Button>
          <Typography textAlign="center">
            <Link to="/login" style={{ color: '#1976d2' }}>חזרה להתחברות</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
