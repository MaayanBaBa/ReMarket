import axios from 'axios'

// Matches server/server.js (no "/api" prefix)
export const SERVER_ORIGIN = 'http://localhost:5000'
const API = axios.create({ baseURL: SERVER_ORIGIN })

/** תמונה מהשרת (/uploads/...), קישור חיצוני, או placeholder */
export function resolveProductImageUrl(image, fallbackSize = '500x400') {
  if (!image) {
    return `https://via.placeholder.com/${fallbackSize}?text=${encodeURIComponent('אין תמונה')}`
  }
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  const base = SERVER_ORIGIN.replace(/\/$/, '')
  if (image.startsWith('/')) return `${base}${image}`
  return `https://via.placeholder.com/${fallbackSize}?text=${encodeURIComponent('אין תמונה')}`
}

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token')
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

// Auth (real server endpoints)
export const registerUser = (data) => API.post('/users/register', data)
export const loginUser = (data) => API.post('/users/login', data)
export const getMe = () => API.get('/users/me')
export const forgotPassword = (data) => API.post('/users/forgot-password', data)
export const resetPassword = (data) => API.post('/users/reset-password', data)

// Users (CRUD as implemented in server/routes/userRoutes.js)
export const addUser = (data) => API.post('/users', data)
export const getUsers = () => API.get('/users')
export const getUserById = (id) => API.get(`/users/${id}`)
export const updateUser = (id, data) => API.put(`/users/${id}`, data)
export const deleteUser = (id) => API.delete(`/users/${id}`)

// Products (CRUD as implemented in server/routes/productRoutes.js)
export const getProducts = (params = {}) => API.get('/products', { params })
export const getPendingProducts = () => API.get('/products/pending-approval')
export const getProductById = (id) => API.get(`/products/${id}`)
/** אובייקט JSON או FormData (העלאת תמונה בשדה `image`) */
export const addProduct = (data) => API.post('/products', data)
export const updateProduct = (id, data) => API.put(`/products/${id}`, data)
export const deleteProduct = (id) => API.delete(`/products/${id}`)

// Categories (CRUD as implemented in server/routes/categoryRoutes.js)
export const getCategories = () => API.get('/categories')
export const getCategoriesWithCounts = () => API.get('/categories/with-counts')
export const findOrCreateCategory = (data) => API.post('/categories/find-or-create', data)

// Sales (CRUD as implemented in server/routes/saleRoutes.js)
export const addSale = (data) => API.post('/sales', data)
export const getSales = (params = {}) => API.get('/sales', { params })
export const updateSale = (id, data) => API.put(`/sales/${id}`, data)

// Messages (CRUD as implemented in server/routes/messageRoutes.js)
export const addMessage = (data) =>
  API.post('/messages', data).then((res) => {
    window.dispatchEvent(new CustomEvent('remarket:refresh-message-count'))
    return res
  })
export const getMessages = (params = {}) => API.get('/messages', { params })
export const getMessageCount = (params = {}) => API.get('/messages/count', { params })
export const markMessagesRead = () =>
  API.post('/messages/read').then((res) => {
    window.dispatchEvent(new CustomEvent('remarket:refresh-message-count'))
    return res
  })

// Subscription (seller membership)
export const getSubscriptionStatus = () => API.get('/subscriptions/status')
export const subscribeSeller = (data) => API.post('/subscriptions/subscribe', data)