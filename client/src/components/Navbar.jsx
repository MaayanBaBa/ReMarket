import { useCallback, useEffect, useState } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Chip, Drawer, IconButton, List, ListItem, ListItemText } from '@mui/material'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMessageCount } from '../services/api'
import StorefrontIcon from '@mui/icons-material/Storefront'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [messageCount, setMessageCount] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width:900px)')

  const fetchMessageCount = useCallback(() => {
    if (!user?._id) return
    getMessageCount()
      .then((res) => setMessageCount(typeof res.data?.count === 'number' ? res.data.count : 0))
      .catch(() => setMessageCount(null))
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) {
      setMessageCount(null)
      return
    }
    fetchMessageCount()
  }, [user?._id, location.pathname, fetchMessageCount])

  useEffect(() => {
    window.addEventListener('remarket:refresh-message-count', fetchMessageCount)
    return () => window.removeEventListener('remarket:refresh-message-count', fetchMessageCount)
  }, [fetchMessageCount])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const statusLabel = { buyer: 'קונה', seller: 'מוכר', admin: 'מנהל' }

  const mainNav = [
    { label: 'בית', path: '/' },
    { label: 'מוצרים', path: '/products' },
    { label: 'קטגוריות', path: '/categories' },
  ]

  const authNav = user ? (
    [
      { label: 'הקניות שלי', path: '/history' },
      user.status === 'seller' || user.status === 'admin' ? { label: 'הוסף מוצר', path: '/add-product' } : null,
      user.status === 'seller' || user.status === 'admin' ? { label: 'מעקב הזמנות', path: '/seller-orders' } : null,
      user.status === 'buyer' ? { label: 'מנוי מוכר', path: '/subscribe' } : null,
      user.isMainAdmin ? { label: 'ניהול ראשי', path: '/admin' } : null,
      { label: 'הודעות', path: '/inbox' },
    ].filter(Boolean)
  ) : []

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen)
  const handleNavClick = (path) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/products') return location.pathname === '/products' || location.pathname.startsWith('/products/')
    return location.pathname === path
  }

  const navButtonStyles = (path, extra = {}) => ({
    textTransform: 'none',
    minWidth: 100,
    color: isActivePath(path) ? '#7a5a3a' : '#1f2429',
    bgcolor: isActivePath(path) ? 'rgba(122,90,58,0.14)' : 'transparent',
    borderRadius: 2,
    fontWeight: isActivePath(path) ? 700 : 500,
    border: isActivePath(path) ? '1px solid rgba(122,90,58,0.18)' : '1px solid transparent',
    '&:hover': {
      bgcolor: isActivePath(path) ? 'rgba(122,90,58,0.2)' : 'rgba(31,36,41,0.05)'
    },
    ...extra
  })

  return (
    <>
      <AppBar position="sticky" sx={{ direction: 'rtl', backgroundColor: 'rgba(255,255,255,0.96)', color: '#1f2429', boxShadow: '0 10px 24px rgba(31,36,41,0.08)' }}>
        <Toolbar sx={{ 
          gap: 1, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          minHeight: 72,
          px: { xs: 2, md: 3 }
        }}>
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
            <StorefrontIcon />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ReMarket
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {mainNav.map(nav => (
                  <Button
                    key={nav.path}
                    component={Link}
                    to={nav.path}
                    sx={navButtonStyles(nav.path)}
                  >
                    {nav.label}
                  </Button>
                ))}
              </Box>

              {user && (user.status === 'seller' || user.status === 'admin') && (
                <Button
                  component={Link}
                  to="/add-product"
                  sx={navButtonStyles('/add-product')}
                >
                  הוסף מוצר
                </Button>
              )}

              {user && (
                <Button
                  component={Link}
                  to="/inbox"
                  sx={navButtonStyles('/inbox')}
                >
                  הודעות {messageCount != null && messageCount > 0 ? `(${messageCount})` : ''}
                </Button>
              )}

              {user && (user.status === 'seller' || user.status === 'admin') && (
                <Button
                  component={Link}
                  to="/seller-orders"
                  sx={navButtonStyles('/seller-orders')}
                >
                  מעקב הזמנות
                </Button>
              )}

              {user && user.isMainAdmin && (
                <Button
                  component={Link}
                  to="/admin"
                  sx={navButtonStyles('/admin')}
                >
                  ניהול
                </Button>
              )}

              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    component={Link}
                    to="/history"
                    sx={navButtonStyles('/history')}
                  >
                    הקניות שלי
                  </Button>
                  {user.status === 'buyer' && (
                    <Button
                      component={Link}
                      to="/subscribe"
                      sx={navButtonStyles('/subscribe', { fontSize: '0.8rem' })}
                    >
                      מנוי
                    </Button>
                  )}
                  <Chip
                    avatar={<Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(140,111,79,0.16)', color: '#1f2429' }}>{user.firstName?.[0]}</Avatar>}
                    label={`${user.firstName.substring(0, 8)} • ${statusLabel[user.status] || user.status}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ color: '#1f2429', borderColor: 'rgba(140,111,79,0.28)', bgcolor: '#fcf8f0' }}
                  />
                  <Button color="inherit" onClick={handleLogout} sx={{ fontSize: '0.9rem', textTransform: 'none' }}>התנתק</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    component={Link}
                    to="/login"
                    sx={navButtonStyles('/login')}
                  >
                    התחבר
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    sx={navButtonStyles('/register')}
                  >
                    הרשמה
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleDrawerToggle}
            >
              {drawerOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen && isMobile}
        onClose={handleDrawerToggle}
        sx={{ direction: 'rtl' }}
      >
        <Box sx={{ width: 280, pt: 2, direction: 'rtl' }}>
          <List>
            {mainNav.map(nav => (
              <ListItem
                button
                key={nav.path}
                selected={isActivePath(nav.path)}
                onClick={() => handleNavClick(nav.path)}
              >
                <ListItemText primary={nav.label} />
              </ListItem>
            ))}

            {authNav.map(nav => (
              <ListItem
                button
                key={nav.path}
                selected={isActivePath(nav.path)}
                onClick={() => handleNavClick(nav.path)}
              >
                <ListItemText primary={nav.label} />
              </ListItem>
            ))}

            {user ? (
              <>
                <ListItem divider>
                  <ListItemText
                    primary={user.firstName}
                    secondary={statusLabel[user.status] || user.status}
                  />
                </ListItem>
                <ListItem
                  button
                  onClick={() => {
                    handleLogout()
                  }}
                >
                  <ListItemText primary="התנתק" sx={{ color: 'red' }} />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem
                  button
                  onClick={() => handleNavClick('/login')}
                >
                  <ListItemText primary="התחבר" />
                </ListItem>
                <ListItem
                  button
                  onClick={() => handleNavClick('/register')}
                >
                  <ListItemText primary="הרשמה" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  )
}