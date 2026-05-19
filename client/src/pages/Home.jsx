import { useEffect, useState } from 'react'
import { Box, Container, Typography, TextField, Button, Grid, InputAdornment, Alert } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate, useLocation } from 'react-router-dom'
import { getProducts, getCategoriesWithCounts } from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const [showSubscribedBanner, setShowSubscribedBanner] = useState(false)

  useEffect(() => {
    if (location.state?.subscribed) {
      setShowSubscribedBanner(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    getProducts({ limit: 6 })
      .then(res => setFeatured(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getCategoriesWithCounts()
      .then(res => setCategories(res.data))
      .catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${search}`)
  }

  return (
    <Box sx={{ direction: 'rtl' }}>
      {showSubscribedBanner && (
        <Container sx={{ pt: 2 }}>
          <Alert severity="success" onClose={() => setShowSubscribedBanner(false)}>
            המנוי הופעל בהצלחה — הוגדרת כמוכרת. אפשר להעלות מוצרים מ״הוסף מוצר״; כל מוצר יישלח לאישור המנהל הראשי לפני פרסום.
          </Alert>
        </Container>
      )}
      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #f9f7f1 0%, #eef0ed 55%, #f7f5f0 100%)',
        color: '#1f2429',
        py: { xs: 8, md: 12 },
        textAlign: 'center',
        px: 2,
        borderBottom: '1px solid rgba(31,36,41,0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography variant="h2" fontWeight="bold" mb={3} sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          ReMarket
        </Typography>
        <Typography variant="h6" mb={3} sx={{ opacity: 0.9, fontSize: { xs: '1.05rem', md: '1.35rem' }, fontWeight: 600 }}>
          קנה, מכור, חסוך — חוויית מסחר אלגנטית וברורה
        </Typography>
        <Typography variant="body1" mb={5} sx={{ opacity: 0.85, fontSize: { xs: '0.95rem', md: '1.05rem' }, maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}>
          גלש במבחר מוצרי איכות עם נראות חדה, ממשק מסודר וסינון מהיר.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 5, px: 1 }}>
          {categories.slice(0, 5).map(c => (
            <Button
              key={c._id}
              variant="outlined"
              color="secondary"
              sx={{ 
                color: '#1f2429', 
                borderColor: '#d4af9a',
                fontSize: { xs: '0.8rem', md: '0.95rem' },
                px: { xs: 1.5, md: 2.8 },
                py: { xs: 0.8, md: 1.2 },
                borderRadius: 10,
                textTransform: 'none',
                bgcolor: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(34,50,80,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '2px solid #d4af9a',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 40px rgba(212,175,154,0.25)',
                  bgcolor: '#fdfbf8',
                  borderColor: '#c49580'
                }
              }}
              onClick={() => navigate(`/products?category=${c._id}`)}
            >
              {c.name} ({c.count})
            </Button>
          ))}
        </Box>

        <Box component="form" onSubmit={handleSearch} sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 1.5, 
          px: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          alignItems: 'center',
          maxWidth: 550,
          mx: 'auto'
        }}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש מוצר..."
            variant="outlined"
            sx={{ 
              bgcolor: 'white', 
              borderRadius: 3,
              width: { xs: '100%', md: 350 },
              maxWidth: '100%',
              boxShadow: '0 4px 16px rgba(34,50,80,0.12)',
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-root': {
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(34,50,80,0.15)'
                },
                '&.Mui-focused': {
                  boxShadow: '0 12px 32px rgba(212,175,154,0.2)'
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon sx={{ color: '#d4af9a' }} /></InputAdornment>
              )
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="secondary" 
            size="large" 
            sx={{ 
              borderRadius: 3,
              width: { xs: '100%', md: 'auto' },
              py: { xs: 1.2, md: 1.8 },
              px: { xs: 2, md: 4 },
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 20px rgba(212,175,154,0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(212,175,154,0.4)'
              }
            }}
          >
            חפש
          </Button>
        </Box>
      </Box>

      {/* Featured products */}
      <Box sx={{
        py: { xs: 6, md: 10 },
        px: 2,
        background: 'linear-gradient(to bottom, #ffffff 0%, #fdfbf8 100%)',
        borderTop: '1px solid rgba(31,36,41,0.06)'
      }}>
        <Container sx={{ maxWidth: 1200 }}>
          <Box sx={{ textAlign: 'center', mb: 6, position: 'relative' }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, transparent 0%, #d4af9a 25%, #e8d5c4 50%, #d4af9a 75%, transparent 100%)',
              borderRadius: 2,
              animation: 'shimmer 3s infinite ease-in-out',
              '@keyframes shimmer': {
                '0%': { opacity: 0.5, transform: 'scaleX(0.8)' },
                '50%': { opacity: 1, transform: 'scaleX(1)' },
                '100%': { opacity: 0.5, transform: 'scaleX(0.8)' }
              }
            }} />
            <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mt: 4, mb: 2, color: '#1f2429' }}>
              מוצרים מובחרים
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ justifyContent: 'center', mb: 6 }}>
            {featured.map(p => (
              <Grid item xs={12} sm={6} md={4} key={p._id} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 320 }}>
                  <ProductCard product={p} />
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              onClick={() => navigate('/products')}
              sx={{
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                fontWeight: 700,
                px: { xs: 3, md: 5 },
                py: { xs: 1.4, md: 1.8 },
                borderRadius: 3,
                boxShadow: '0 12px 32px rgba(212,175,154,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'none',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 48px rgba(212,175,154,0.4)'
                }
              }}
            >
              → לכל המוצרים
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}