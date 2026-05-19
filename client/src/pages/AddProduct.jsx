import { useEffect, useState, useCallback } from 'react'
import {
  Box, Button, Container, TextField, Typography, Alert, Paper, MenuItem
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { addProduct, getCategories, findOrCreateCategory } from '../services/api'
import { useNavigate } from 'react-router-dom'

const CATEGORY_OTHER = '__other__'

export default function AddProduct() {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: { category: '', customCategory: '', image: '', quantity: 1 },
  })
  const categoryVal = watch('category')
  const [categories, setCategories] = useState([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const navigate = useNavigate()

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setImageFile(null)
  }, [])

  useEffect(() => {
    getCategories().then(res => setCategories(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(file || null)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const onSubmit = async (data) => {
    setError('')
    try {
      let categoryId = data.category

      if (data.category === CATEGORY_OTHER) {
        const name = String(data.customCategory || '').trim()
        if (name.length < 2) {
          setError('נא למלא שם קטגוריה משלך (לפחות 2 תווים)')
          return
        }
        const res = await findOrCreateCategory({ name })
        categoryId = res.data._id
      }

      if (!categoryId || categoryId === CATEGORY_OTHER) {
        setError('נא לבחור קטגוריה')
        return
      }

      if (imageFile) {
        const fd = new FormData()
        fd.append('name', data.name)
        fd.append('description', data.description)
        fd.append('price', String(Number(data.price)))
        fd.append('quantity', String(Math.max(1, Math.floor(Number(data.quantity)) || 1)))
        fd.append('category', String(categoryId))
        fd.append('image', imageFile)
        await addProduct(fd)
      } else {
        await addProduct({
          name: data.name,
          description: data.description,
          price: Number(data.price),
          quantity: Math.max(1, Math.floor(Number(data.quantity)) || 1),
          category: categoryId,
          image: String(data.image || '').trim(),
        })
      }

      setSuccess(true)
      reset({ category: '', customCategory: '', image: '', quantity: 1 })
      clearPreview()
      setTimeout(() => navigate('/products'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'שגיאה בהוספת המוצר')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 5, mb: 8, direction: 'rtl', px: { xs: 1, md: 2 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={3} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>הוספת מוצר חדש</Typography>
        <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
          כל מוצר שתעלי עובר <strong>אישור המנהל הראשי</strong> לפני שהוא מוצג לקונים בחנות.
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>המוצר נשלח לאישור! 🎉</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="שם המוצר"
            {...register('name', { required: 'שדה חובה' })}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="תיאור"
            multiline
            rows={3}
            {...register('description', { required: 'שדה חובה' })}
            error={!!errors.description}
            helperText={errors.description?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="מחיר (₪)"
            type="number"
            {...register('price', { required: 'שדה חובה', min: { value: 1, message: 'מחיר מינימלי 1' } })}
            error={!!errors.price}
            helperText={errors.price?.message}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="כמות במלאי"
            type="number"
            {...register('quantity', {
              required: 'שדה חובה',
              min: { value: 1, message: 'לפחות יחידה אחת' },
              valueAsNumber: true,
            })}
            error={!!errors.quantity}
            helperText={errors.quantity?.message || 'כמה יחידות זמינות למכירה — בכל רכישה הכמות תקטן ב־1'}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />
          <TextField
            label="קטגוריה"
            select
            {...register('category', { required: 'בחרי קטגוריה' })}
            error={!!errors.category}
            helperText={
              errors.category?.message
              || (categoryVal === CATEGORY_OTHER ? 'הזיני למטה שם לקטגוריה שלך' : undefined)
            }
            SelectProps={{ displayEmpty: true }}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          >
            <MenuItem value="" disabled>בחרי קטגוריה</MenuItem>
            {categories.map(c => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
            <MenuItem value={CATEGORY_OTHER}>אחר — קטגוריה משלך (מילוי חופשי)</MenuItem>
          </TextField>

          {categoryVal === CATEGORY_OTHER && (
            <TextField
              label="שם הקטגוריה שלך"
              placeholder="לדוגמה: ציוד לבית ספר, כלי נגינה ישנים…"
              {...register('customCategory')}
              helperText="הקטגוריה תיווצר אם עדיין לא קיימת, ותשויך למוצר"
              fullWidth
              sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
            />
          )}

          <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#fcfcfb', border: '1px solid rgba(31,36,41,0.08)' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              תמונת מוצר
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              העלאת קובץ מהמחשב (עד 5MB) — JPEG, PNG, GIF או WebP. אם לא מעלות קובץ, אפשר למלא קישור למטה.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Button variant="outlined" component="label" sx={{ mr: 1 }}>
                בחרי תמונה
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onFileChange}
                />
              </Button>
              {imageFile && (
                <Button size="small" onClick={clearPreview} sx={{ ml: 1 }}>
                  הסרת קובץ
                </Button>
              )}
            </Box>
            {previewUrl && (
              <Box
                component="img"
                src={previewUrl}
                alt="תצוגה מקדימה"
                sx={{ 
                  mt: 2, 
                  maxWidth: '100%', 
                  maxHeight: { xs: 150, md: 220 }, 
                  borderRadius: 2, 
                  objectFit: 'contain', 
                  display: 'block' 
                }}
              />
            )}
          </Box>

          <TextField
            label="או קישור לתמונה (אם לא העלאת קובץ)"
            {...register('image')}
            placeholder="https://..."
            disabled={!!imageFile}
            helperText={imageFile ? 'בוטל כשמעלים קובץ — הקובץ יישמר' : 'אופציונלי'}
            fullWidth
            sx={{ bgcolor: '#faf8f2', borderRadius: 2 }}
          />

          <Button type="submit" variant="contained" size="large" sx={{ py: 1.75, boxShadow: '0 14px 24px rgba(140,111,79,0.18)' }}>
            שלח לאישור
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
