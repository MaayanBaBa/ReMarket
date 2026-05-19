import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  IconButton,
  Avatar,
  InputAdornment,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import MicIcon from '@mui/icons-material/Mic'
import { io } from 'socket.io-client'
import {
  getMessages,
  markMessagesRead,
  getProductById,
  addMessage,
  SERVER_ORIGIN,
  resolveProductImageUrl,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

function getOtherPartyId(m, meId) {
  const s = m.sender?._id || m.sender
  const r = m.receiver?._id || m.receiver
  return String(s) === String(meId) ? String(r) : String(s)
}

function msgBelongsToThread(msg, productId, meId, peerId) {
  const pid = String(msg.product?._id || msg.product || '')
  if (pid !== String(productId)) return false
  const s = String(msg.sender?._id || msg.sender)
  const r = String(msg.receiver?._id || msg.receiver)
  return (s === String(meId) && r === String(peerId)) || (s === String(peerId) && r === String(meId))
}

function ChatPanel({
  thread,
  productId,
  productInfo,
  otherUser,
  otherId,
  isMyProduct,
  meId,
  socket,
  onBack,
  onSent,
  isMobile,
}) {
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const sorted = thread.slice().sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    setItems(sorted)
  }, [thread])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [items, peerTyping])

  useEffect(() => {
    if (!socket?.connected || !productId || !otherId || !meId) return

    socket.emit('join_thread', { productId, peerId: otherId }, (res) => {
      if (res && res.ok === false) {
        setErr(res.message || 'לא ניתן להצטרף לצ׳אט')
      }
    })

    const onNew = (msg) => {
      if (!msgBelongsToThread(msg, productId, meId, otherId)) return
      setItems((prev) => {
        const id = String(msg._id)
        if (prev.some((m) => String(m._id) === id)) return prev
        return [...prev, msg].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      })
    }

    const onTyping = ({ userId, active }) => {
      if (String(userId) === String(otherId)) setPeerTyping(!!active)
    }

    socket.on('message:new', onNew)
    socket.on('peer_typing', onTyping)

    return () => {
      socket.emit('leave_thread', { productId, peerId: otherId })
      socket.off('message:new', onNew)
      socket.off('peer_typing', onTyping)
    }
  }, [socket, productId, otherId, meId])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch (_) {}
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const emitTyping = (active) => {
    if (!socket?.connected) return
    socket.emit('typing', { productId, peerId: otherId, active })
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    emitTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return

    setSending(true)
    setErr('')
    emitTyping(false)
    try {
      const payload = { product: productId, content: t }
      if (isMyProduct) payload.receiver = otherId
      const { data: newMsg } = await addMessage(payload)
      setText('')
      setItems((prev) => {
        const id = String(newMsg._id)
        if (prev.some((m) => String(m._id) === id)) return prev
        return [...prev, newMsg].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      })
      onSent?.()
    } catch (e) {
      setErr(e.response?.data?.message || 'שגיאה בשליחה')
    } finally {
      setSending(false)
    }
  }

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setErr('הדפדפן לא תומך בהקלטה לטקסט')
      return
    }

    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_) {}
      setIsRecording(false)
      return
    }

    setErr('')
    const recognition = new SR()
    recognition.lang = 'he-IL'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.onerror = () => setErr('שגיאה בהקלטה — נסי שוב')
    recognition.onend = () => setIsRecording(false)

    setIsRecording(true)
    try {
      recognition.start()
    } catch {
      setErr('לא ניתן להתחיל הקלטה')
      setIsRecording(false)
    }
  }

  const productName = productInfo?.name || 'מוצר'
  const img = resolveProductImageUrl(productInfo?.image, '120x120')

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { md: 3 },
        border: { md: '1px solid' },
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        minHeight: { xs: '70vh', md: 'auto' },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: (t) => t.palette.grey[50],
        }}
      >
        {isMobile && (
          <IconButton onClick={onBack} edge="start" aria-label="חזרה">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar src={img} variant="rounded" sx={{ width: 44, height: 44 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight="bold" noWrap>
            {productName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {otherUser?.firstName} {otherUser?.lastName}
            {socket?.connected ? ' · מחובר בזמן אמת' : ' · מצב לא מקוון'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          bgcolor: (t) => t.palette.grey[100],
        }}
      >
        {items.map((m) => {
          const fromMe = String(m.sender?._id || m.sender) === String(meId)
          return (
            <Box
              key={m._id}
              sx={{
                display: 'flex',
                justifyContent: fromMe ? 'flex-start' : 'flex-end',
                direction: 'rtl',
              }}
            >
              <Box
                sx={{
                  maxWidth: '82%',
                  px: 1.75,
                  py: 1.25,
                  borderRadius: fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  bgcolor: fromMe ? 'primary.main' : 'common.white',
                  color: fromMe ? 'primary.contrastText' : 'text.primary',
                  boxShadow: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                  {m.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.75,
                    textAlign: fromMe ? 'left' : 'right',
                  }}
                >
                  {new Date(m.date).toLocaleString('he-IL', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {!fromMe && m.readAt ? ' · נקראה' : ''}
                </Typography>
              </Box>
            </Box>
          )
        })}
        {peerTyping && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            {otherUser?.firstName || 'הצד השני'} כותב…
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {err && (
          <Alert severity="error" sx={{ mb: 1 }} onClose={() => setErr('')}>
            {err}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="כתבי הודעה… Enter לשליחה, Shift+Enter לשורה חדשה"
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (text.trim() && !sending) void handleSend(e)
              }
            }}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    color={isRecording ? 'error' : 'default'}
                    onClick={toggleVoice}
                    aria-label={isRecording ? 'עצור הקלטה' : 'הקלטה לטקסט'}
                    edge="end"
                  >
                    <MicIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={sending || !text.trim()}
            sx={{ minWidth: 48, py: 1.25 }}
            aria-label="שליחה"
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

function ThreadRow({ thread, productName, otherUser, meId, selected, onSelect, unreadCount }) {
  const last = thread[thread.length - 1]
  return (
    <Paper
      onClick={onSelect}
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        cursor: 'pointer',
        borderRadius: 2,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.15s, background 0.15s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          {otherUser?.firstName?.[0]}
          {otherUser?.lastName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
            <Typography fontWeight={unreadCount ? 700 : 600} noWrap sx={{ fontSize: '0.95rem' }}>
              {productName}
            </Typography>
            {unreadCount > 0 && (
              <Typography component="span" variant="caption" color="primary" fontWeight="bold">
                {unreadCount}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {otherUser?.firstName} {otherUser?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
            {last?.content || '…'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default function MessagesInbox() {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [socketHint, setSocketHint] = useState('')
  const [messages, setMessages] = useState([])
  const [productNames, setProductNames] = useState({})
  const [productData, setProductData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [isMdUp, setIsMdUp] = useState(typeof window !== 'undefined' && window.innerWidth >= 900)

  const fetchMessages = useCallback(async () => {
    if (!user?._id) return
    const res = await getMessages()
    setMessages(res.data || [])
  }, [user?._id])

  const load = useCallback(async () => {
    if (!user?._id) return
    setLoading(true)
    setError('')
    try {
      await fetchMessages()
      await markMessagesRead().catch(() => {})
      await fetchMessages()
    } catch {
      setError('שגיאה בטעינת הודעות')
    } finally {
      setLoading(false)
    }
  }, [user?._id, fetchMessages])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onResize = () => setIsMdUp(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!user?._id) return
    const token = localStorage.getItem('token')
    if (!token) return

    const s = io(SERVER_ORIGIN, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const onRefresh = () => {
      fetchMessages()
    }

    s.on('connect', () => setSocketHint(''))
    s.on('connect_error', () => {
      setSocketHint('הצ׳אט בזמן אמת לא זמין כרגע — ההודעות עדיין נשמרות בשרת.')
    })
    s.on('inbox:refresh', onRefresh)

    setSocket(s)

    return () => {
      s.off('inbox:refresh', onRefresh)
      s.disconnect()
      setSocket(null)
    }
  }, [user?._id, fetchMessages])

  useEffect(() => {
    const idsToFetch = []
    for (const m of messages) {
      const product = m.product
      const id = typeof product === 'string' ? product : product?._id
      const hasName = product && typeof product !== 'string' && product.name
      if (id && !hasName && productNames[id] === undefined && !idsToFetch.includes(String(id))) {
        idsToFetch.push(String(id))
      }
    }
    if (!idsToFetch.length) return

    ;(async () => {
      const fetched = {}
      const data = {}
      await Promise.all(
        idsToFetch.map(async (productId) => {
          try {
            const res = await getProductById(productId)
            fetched[productId] = res.data?.name || null
            data[productId] = res.data
          } catch {
            fetched[productId] = null
          }
        })
      )
      setProductNames((prev) => ({ ...prev, ...fetched }))
      setProductData((prev) => ({ ...prev, ...data }))
    })()
  }, [messages, productNames])

  const grouped = useMemo(() => {
    const me = user?._id
    if (!me) return []
    const map = new Map()
    for (const m of messages) {
      const pid = m.product?._id || m.product || 'unknown'
      const oid = getOtherPartyId(m, me)
      const key = `${pid}:${oid}`
      const arr = map.get(key) || []
      arr.push(m)
      map.set(key, arr)
    }
    return Array.from(map.values()).sort((a, b) => {
      const at = new Date(a[a.length - 1]?.date || 0).getTime()
      const bt = new Date(b[b.length - 1]?.date || 0).getTime()
      return bt - at
    })
  }, [messages, user?._id])

  const meId = user?._id

  const buildSelection = (thread) => {
    const rawProduct =
      thread.find((m) => m.product && typeof m.product !== 'string')?.product || thread[0]?.product
    const productId = String(rawProduct?._id || rawProduct || '')
    const productName =
      (rawProduct && typeof rawProduct !== 'string' ? rawProduct.name : null) ||
      productNames[productId] ||
      'מוצר לא ידוע'
    const productInfo = productData[productId] || rawProduct
    const sellerId = String(rawProduct?.user?._id || rawProduct?.user || '')
    const isMyProduct = meId && sellerId === String(meId)
    const otherId = meId ? getOtherPartyId(thread[0], meId) : ''
    const sorted = thread.slice().sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    let otherUser = null
    for (const m of sorted) {
      const sid = String(m.sender?._id || m.sender)
      const rid = String(m.receiver?._id || m.receiver)
      if (sid === otherId) {
        otherUser = m.sender
        break
      }
      if (rid === otherId) {
        otherUser = m.receiver
        break
      }
    }
    return { thread, productId, productName, productInfo, otherUser, otherId, isMyProduct, key: `${productId}:${otherId}` }
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6, direction: 'rtl', px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        הודעות
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 640 }}>
        בחרי שיחה משמאל. בכל צ׳אט אפשר לכתוב או להשתמש בהקלטה לטקסט (מיקרופון). עדכונים נשלחים ב-WebSocket (Socket.IO) אחרי שמירה בשרת.
      </Typography>

      {socketHint && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {socketHint}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'stretch',
          gap: 2,
          minHeight: { md: 'min(720px, calc(100dvh - 200px))' },
        }}
      >
        <Box
          sx={{
            width: { md: 320 },
            flexShrink: 0,
            display: { xs: selected ? 'none' : 'block', md: 'block' },
          }}
        >
          {grouped.length === 0 ? (
            <Alert severity="info">אין שיחות עדיין</Alert>
          ) : (
            grouped.map((thread) => {
              const sel = buildSelection(thread)
              const unreadCount = thread.filter(
                (m) => String(m.receiver?._id || m.receiver) === String(meId) && !m.readAt
              ).length
              return (
                <ThreadRow
                  key={sel.key}
                  thread={thread}
                  productName={sel.productName}
                  otherUser={sel.otherUser}
                  meId={meId}
                  selected={selected?.key === sel.key}
                  unreadCount={unreadCount}
                  onSelect={() => setSelected(sel)}
                />
              )
            })
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: { xs: selected ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
          }}
        >
          {selected ? (
            <ChatPanel
              thread={selected.thread}
              productId={selected.productId}
              productInfo={selected.productInfo}
              otherUser={selected.otherUser}
              otherId={selected.otherId}
              isMyProduct={selected.isMyProduct}
              meId={meId}
              socket={socket}
              isMobile={!isMdUp}
              onBack={() => setSelected(null)}
              onSent={fetchMessages}
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                borderRadius: 3,
                color: 'text.secondary',
              }}
            >
              <Typography>בחרי שיחה מהרשימה כדי לפתוח צ׳אט</Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  )
}
