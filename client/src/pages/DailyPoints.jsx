import { Container, Typography, Alert, Paper } from '@mui/material'

export default function DailyPoints() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, direction: 'rtl', textAlign: 'center', px: { xs: 1, md: 2 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, md: 5 }, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.3rem', md: '1.5rem' } }}>מועדון הנקודות</Typography>
        <Alert severity="info">
          הפיצ׳ר הזה הועתק אבל לא קיים כרגע בשרת שלך (אין שדה/נתיבים לנקודות ב-`UserModel`).
        </Alert>
      </Paper>
    </Container>
  )
}