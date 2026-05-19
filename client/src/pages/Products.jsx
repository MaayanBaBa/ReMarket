import { useEffect, useState } from 'react'
import { Container, Grid, Typography, TextField, MenuItem, Box, InputAdornment, CircularProgress } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useSearchParams } from 'react-router-dom'
import { getProducts, getCategories } from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ search: search.trim(), category })
      .then(res => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, category])

  const updateQuery = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const activeCategory = categories.find(c => c._id === category)

  return (
    <Container sx={{ mt: 4, mb: 6, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Box sx={{ mb: 4, p: { xs: 2, md: 3 }, borderRadius: 4, bgcolor: '#fcfcfb', border: '1px solid rgba(31,36,41,0.08)', boxShadow: '0 14px 36px rgba(34,50,80,0.07)' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: '100%',
            maxWidth: 180,
            height: 4,
            mx: 'auto',
            mb: 2,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #d4af9a 0%, #e8d5c4 50%, #d4af9a 100%)',
            animation: 'shimmer 3s infinite ease-in-out',
            '@keyframes shimmer': {
              '0%': { transform: 'scaleX(0.8)', opacity: 0.6 },
              '50%': { transform: 'scaleX(1)', opacity: 1 },
              '100%': { transform: 'scaleX(0.8)', opacity: 0.6 }
            }
          }} />
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mt: 4, mb: 2, color: '#1f2429' }}>
            {activeCategory ? `מוצרים ב${activeCategory.name}` : 'כל המוצרים'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.95rem', md: '1rem' }, maxWidth: 760, mx: 'auto' }}>
          חפש מוצר לפי שם, קטגוריה או תיאור. רשת מוצרינו מעודכנת, ועדיין אפשר לסנן לפי קטגוריה עם ממשק נקי ומדויק.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TextField
            label="חיפוש"
            value={search}
            onChange={e => updateQuery('search', e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 320 },
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(34,50,80,0.05)',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#d4af9a' }} /></InputAdornment>
            }}
          />
          <TextField
            label="קטגוריה"
            select
            value={category}
            onChange={e => updateQuery('category', e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 220 },
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 25px rgba(34,50,80,0.05)',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          >
            <MenuItem value="">הכל</MenuItem>
            {categories.map(c => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={6}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" mt={6}>לא נמצאו מוצרים</Typography>
      ) : (
        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {products.map(p => (
            <Grid item xs={12} sm={6} md={4} key={p._id} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
              <Box sx={{ width: '100%', maxWidth: 340, minWidth: 280, display: 'flex', flexDirection: 'column' }}>
                <ProductCard product={p} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}