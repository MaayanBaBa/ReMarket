import { Card, CardMedia, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { resolveProductImageUrl } from '../services/api'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const imgUrl = resolveProductImageUrl(product.image, '300x200')

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        transition: 'transform 0.2s, box-shadow 0.25s',
        borderRadius: 3,
        backgroundColor: '#ffffff',
        border: '1px solid rgba(31,36,41,0.08)',
        boxShadow: '0 16px 32px rgba(34,50,80,0.08)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 26px 48px rgba(34,50,80,0.14)'
        },
        '&:hover .productImage': {
          transform: 'scale(1.05)'
        },
        '&:hover .productOverlay': {
          opacity: 0.18
        }
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="220"
          image={imgUrl}
          alt={product.name}
          className="productImage"
          sx={{ 
            objectFit: 'cover',
            width: '100%',
            height: 220,
            display: 'block',
            backgroundColor: '#f5f5f5',
            transition: 'transform 0.35s ease'
          }}
        />
        <Box
          className="productOverlay"
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(31,36,41,0.08)',
            opacity: 0,
            transition: 'opacity 0.35s ease'
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          noWrap 
          sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }}
        >
          {product.name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', 
            mb: 1,
            fontSize: { xs: '0.8rem', md: '0.875rem' }
          }}
        >
          {product.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography 
            variant="h6" 
            color="primary" 
            fontWeight="bold"
            sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
          >
            ₪{product.price}
          </Typography>
          {product.quantity != null && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              display="block" 
              sx={{ mb: 0.5, fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              במלאי: {product.quantity}
            </Typography>
          )}
          {product.category?.name && (
            <Chip 
              label={product.category.name} 
              size="small" 
              color="secondary"
              sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
            />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ pt: 0 }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={() => navigate(`/products/${product._id}`)}
          sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
        >
          לפרטים ולקניה
        </Button>
      </CardActions>
    </Card>
  )
}