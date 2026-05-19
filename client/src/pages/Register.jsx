import {
  Box, Button, Container, TextField, Typography, Alert, Paper,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Register() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      accountRole: 'buyer',
    },
  })
  const accountRole = watch('accountRole')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (data) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        status: 'buyer',
      })
      const res = await loginUser({ email: data.email, password: data.password })
      login(res.data.token, res.data.user)

      if (data.accountRole === 'seller') {
        navigate('/subscribe', { state: { welcomeSeller: true } })
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'שגיאה בהרשמה')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={6} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, overflow: 'hidden' }}>
        <Typography variant="h4" fontWeight="bold" mb={1} textAlign="center" sx={{ fontSize: { xs: '1.6rem', md: '2.25rem' } }}>
          הרשמה
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center" sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>
          בחרו חשבון קונה או מוכר. למוכרים נפתח דף תשלום מאובטח לאחר ההרשמה.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
          מכולת הפרימיום שלנו מנגישה את כל המוצרים עם ממשק נקי, תהליך קצר ופשטות שימוש.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl component="fieldset" sx={{ border: '1px solid', borderColor: 'rgba(31,36,41,0.12)', borderRadius: 3, p: 2, bgcolor: '#fcfcfb' }}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
              סוג חשבון
            </FormLabel>
            <RadioGroup
              row
              value={accountRole}
              onChange={(e) => setValue('accountRole', e.target.value, { shouldValidate: true })}
            >
              <FormControlLabel value="buyer" control={<Radio />} label="קונה" />
              <FormControlLabel value="seller" control={<Radio />} label="מוכר (אחרי מילוי אשראי)" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="שם פרטי"
            {...register('firstName', { required: 'שדה חובה' })}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="שם משפחה"
            {...register('lastName', { required: 'שדה חובה' })}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
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
            label="סיסמה"
            type="password"
            {...register('password', { required: 'שדה חובה' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.75, boxShadow: '0 14px 24px rgba(140,111,79,0.18)' }}>
            {accountRole === 'seller' ? 'הירשם והמשך לתשלום' : 'הירשם'}
          </Button>
          <Typography textAlign="center" sx={{ color: '#6f7581' }}>
            כבר יש לך חשבון?{' '}
            <Link to="/login" style={{ color: '#8c6f4f', textDecoration: 'none' }}>התחבר כאן</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
