import { useEffect, useState } from 'react'
import { Box, Button, Container, Grid, Typography, Paper, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getCategoriesWithCounts } from '../services/api'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getCategoriesWithCounts()
      .then(res => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Container sx={{ mt: 4, mb: 6, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{
          position: 'relative',
          display: 'inline-block',
          width: 'auto'
        }}>
          <Box sx={{
            width: 120,
            height: 4,
            mx: 'auto',
            mb: 2,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #d4af9a 0%, #e8d5c4 50%, #d4af9a 100%)',
            animation: 'shimmer 3s infinite ease-in-out',
            '@keyframes shimmer': {
              '0%': { transform: 'scaleX(0.7)', opacity: 0.5 },
              '50%': { transform: 'scaleX(1)', opacity: 1 },
              '100%': { transform: 'scaleX(0.7)', opacity: 0.5 }
            }
          }} />
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, color: '#1f2429', mb: 1 }}>
            קטגוריות
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, maxWidth: 650, mx: 'auto', lineHeight: 1.6 }}>
          גלה את כל הקטגוריות הפעילות באתר ותצפה במוצרים המדהימים שלנו בכל אחת מהן.
        </Typography>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={6}><CircularProgress /></Box>
      ) : categories.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" mt={6}>
          עדיין לא הוגדרו קטגוריות.
        </Typography>
      ) : (
        <Grid container spacing={3} sx={{ justifyContent: 'center', maxWidth: 1200, mx: 'auto' }}>
          {categories.map(category => (
            <Grid item xs={12} sm={6} md={4} key={category._id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: 360 }}>
                <Paper elevation={0} sx={{ 
                  p: { xs: 2.5, md: 3.5 }, 
                  borderRadius: 4, 
                  minHeight: 220, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(212,175,154,0.2)',
                  boxShadow: '0 12px 36px rgba(34,50,80,0.08)',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 120,
                    height: 120,
                    background: 'linear-gradient(135deg, rgba(212,175,154,0.4) 0%, rgba(232,213,196,0.25) 40%, transparent 70%)',
                    borderRadius: '0 16px 0 60px',
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 24px 48px rgba(212,175,154,0.2)',
                    borderColor: 'rgba(212,175,154,0.35)'
                  },
                  '&:hover .categoryTitle': {
                    color: '#d4af9a'
                  }
                }}>
                  <Box>
                    <Typography 
                      className="categoryTitle"
                      variant="h6" 
                      fontWeight="bold" 
                      sx={{ 
                        fontSize: { xs: '1.15rem', md: '1.4rem' },
                        color: '#1f2429',
                        transition: 'color 0.3s ease',
                        mb: 1
                      }}
                    >
                      {category.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{ width: 40, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #d4af9a 0%, #e8d5c4 100%)' }} />
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ fontSize: { xs: '0.9rem', md: '0.95rem' }, lineHeight: 1.5 }}
                    >
                      {category.count} מוצר{category.count === 1 ? '' : 'ים'} בקטגוריה זו
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/products?category=${category._id}`)}
                    sx={{ 
                      mt: 3, 
                      alignSelf: 'flex-start', 
                      textTransform: 'none',
                      py: 1.2,
                      px: 3,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      bgcolor: '#d4af9a',
                      color: '#ffffff',
                      boxShadow: '0 8px 20px rgba(212,175,154,0.35)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: '#c99a7f',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 32px rgba(212,175,154,0.45)'
                      }
                    }}
                  >
                    → צפה במוצרים
                  </Button>
                </Paper>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
