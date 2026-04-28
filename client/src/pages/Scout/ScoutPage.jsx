import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ArrowUp,
  ArrowUpRight,
  Calculator,
  Check,
  Compass,
  Copy,
  FileText,
  HelpCircle,
  Megaphone,
  Paperclip,
  Plus,
  X,
} from 'lucide-react'
import DashboardLayout from '../Layout/DashboardLayout'
import { scoutService } from '../../services/scoutService'
import { selectCurrentUser } from '../../redux/userSlice'

const COMPOSER_MAX = 680
const CONVO_MAX = 680
const SIDEBAR_OFFSET = 260

const WELCOME_TEMPLATES = [
  'Welcome {name}, ready to tackle some problems?',
  'Hey {name}, what are we working on today?',
  'Good to see you, {name} — let’s make moves.',
  'Welcome back, {name}. Where do we start?',
  'Hi {name}, let’s make today count.',
  '{name}, ready to get something done?',
  'Hello {name}, what can I help you with?',
  'Welcome {name}, let’s tackle the day.',
  'Hey {name}, what should we figure out?',
  '{name}, glad you’re here — what’s first?',
  'Welcome back {name}, ready when you are.',
  'Hi {name}, what’s on the docket today?',
  'Hey {name}, let’s sort something out.',
  'Welcome {name}, time to get to work.',
  '{name}, what would you like to dig into?',
]

const dailySeed = (firstName) => {
  const now = new Date()
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const source = `${dateKey}|${firstName}`
  let h = 0
  for (let i = 0; i < source.length; i++) {
    h = ((h << 5) - h + source.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const pickDailyWelcome = (firstName) => {
  const idx = dailySeed(firstName) % WELCOME_TEMPLATES.length
  return WELCOME_TEMPLATES[idx]
}

const SUGGESTIONS = [
  { icon: FileText, text: 'Review my apparel deal' },
  { icon: Compass, text: 'Match me with an advisor' },
  { icon: Calculator, text: 'Plan NIL taxes' },
  { icon: Megaphone, text: 'Build my personal brand' },
]

const HelpButton = () => {
  const [hover, setHover] = useState(false)
  return (
    <div
      className='scout-help-anchor'
      style={{ position: 'absolute', top: 24, left: 28, zIndex: 5 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        aria-label='What is Scout?'
        style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid var(--color-border-strong)',
          color: 'var(--signil-navy)',
          display: 'grid', placeItems: 'center', cursor: 'help',
          backdropFilter: 'blur(10px)',
          transition: 'all var(--dur-fast) var(--ease-signature)',
          boxShadow: hover ? 'var(--shadow-sm)' : 'none',
          borderColor: hover ? 'var(--color-accent-border)' : 'var(--color-border-strong)',
        }}
      >
        <HelpCircle size={17} strokeWidth={1.7} color={hover ? 'var(--signil-bronze)' : 'currentColor'} />
      </button>
      {hover && (
        <div
          role='tooltip'
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
            width: 360, padding: '14px 16px',
            background: 'var(--signil-navy)', color: 'var(--signil-cream)',
            borderRadius: 14,
            fontSize: 13, lineHeight: 1.55, fontWeight: 400,
            fontFamily: 'var(--font-sans)',
            boxShadow: '0 20px 40px -10px rgba(22,49,70,0.30)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--signil-bronze)', marginBottom: 8 }}>
            About Scout
          </div>
          Scout is your NIL guide. It helps student-athletes, advisors, and families figure out
          what to do next, whether that means reviewing a deal, understanding a contract, finding
          trusted help, or getting connected to the right people.
        </div>
      )}
    </div>
  )
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const Composer = ({ value, setValue, onSend, autofocus, disabled, file, setFile }) => {
  const ref = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (autofocus && ref.current) ref.current.focus()
  }, [autofocus])

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(220, ref.current.scrollHeight) + 'px'
  }, [value])

  const canSend = (value.trim() || file) && !disabled

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
    e.target.value = ''
  }

  return (
    <div
      style={{
        width: '100%',
        background: '#fff',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 28,
        boxShadow: '0 30px 80px -30px rgba(22,49,70,0.18), 0 1px 0 rgba(255,255,255,0.8) inset',
        overflow: 'hidden',
        transition: 'border-color var(--dur-med) var(--ease-signature), box-shadow var(--dur-med) var(--ease-signature)',
      }}
    >
      {file && (
        <div style={{ padding: '12px 22px 0' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px 6px 12px',
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent-border)',
              borderRadius: 999,
              fontSize: 12, fontWeight: 600, color: 'var(--signil-navy)',
              maxWidth: '100%',
            }}
          >
            <Paperclip size={12} strokeWidth={1.8} color='var(--signil-bronze)' style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {file.name}
            </span>
            <span style={{ color: 'var(--color-fg-muted)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{formatFileSize(file.size)}</span>
            <button
              type='button'
              onClick={() => setFile(null)}
              aria-label='Remove file'
              style={{
                width: 18, height: 18, borderRadius: 999,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'grid', placeItems: 'center', color: 'var(--color-fg-muted)',
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
      <div style={{ padding: '14px 22px 8px' }}>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Ask Scout about NIL deals, advisors, taxes, contracts…'
          style={{
            width: '100%', border: 0, outline: 0, resize: 'none',
            fontFamily: 'var(--font-sans)', fontWeight: 400,
            fontSize: 15, lineHeight: 1.45,
            color: 'var(--signil-navy)',
            background: 'transparent',
            minHeight: 22, maxHeight: 160,
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px' }}>
        <button
          type='button'
          onClick={() => fileRef.current?.click()}
          aria-label='Attach file'
          disabled={disabled}
          style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'transparent', color: 'var(--color-fg-muted)',
            display: 'grid', placeItems: 'center', border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all var(--dur-fast) var(--ease-signature)',
          }}
          onMouseEnter={(e) => {
            if (disabled) return
            e.currentTarget.style.background = 'rgba(22,49,70,0.05)'
            e.currentTarget.style.color = 'var(--signil-navy)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-fg-muted)'
          }}
        >
          <Paperclip size={18} strokeWidth={1.7} />
        </button>
        <input
          ref={fileRef}
          type='file'
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept='image/*,.pdf,.txt,.csv,.json,.md,.doc,.docx'
        />
        <button
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          style={{
            width: 32, height: 32, borderRadius: 999,
            background: canSend ? 'var(--signil-navy)' : 'rgba(22,49,70,0.12)',
            color: '#fff',
            display: 'grid', placeItems: 'center', border: 'none',
            cursor: canSend ? 'pointer' : 'default',
            transition: 'all var(--dur-fast) var(--ease-signature)',
          }}
          aria-label='Send'
        >
          <ArrowUp size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

const Chip = ({ icon: IconCmp, text, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 9,
      padding: '10px 16px',
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid var(--color-border-strong)',
      borderRadius: 999,
      fontSize: 12.5, fontWeight: 600, color: 'var(--signil-navy)',
      transition: 'all var(--dur-fast) var(--ease-signature)',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-accent-border)'
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-border-strong)'
      e.currentTarget.style.transform = 'none'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <IconCmp size={14} strokeWidth={1.5} color='var(--signil-bronze)' />
    <span>{text}</span>
  </button>
)

const EmptyState = ({ onSend, value, setValue, disabled, file, setFile, firstName }) => {
  const template = pickDailyWelcome(firstName || 'there')
  const [before, after] = template.split('{name}')
  return (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px 56px', position: 'relative' }}>
    <div style={{ width: '100%', maxWidth: COMPOSER_MAX, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <h1
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-sans)', fontWeight: 900,
          fontSize: 'clamp(22px, 3.2vw, 40px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: 'var(--signil-navy)',
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {before}
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, color: 'var(--signil-bronze)', letterSpacing: '-0.005em' }}>
          {firstName || 'there'}
        </span>
        {after}
      </h1>

      <Composer value={value} setValue={setValue} onSend={() => onSend(value)} autofocus disabled={disabled} file={file} setFile={setFile} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
        {SUGGESTIONS.map((s) => (
          <Chip key={s.text} icon={s.icon} text={s.text} onClick={() => onSend(s.text)} />
        ))}
      </div>
    </div>
  </div>
  )
}

const TypingDots = () => (
  <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 6, height: 6, borderRadius: 999, background: 'var(--signil-bronze)',
          animation: `scoutBob 1.2s var(--ease-signature) infinite`,
          animationDelay: `${i * 0.15}s`,
          opacity: 0.4,
        }}
      />
    ))}
    <style>{`@keyframes scoutBob { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-3px);opacity:1} }`}</style>
  </div>
)

const MsgActions = ({ text }) => {
  const [justCopied, setJustCopied] = useState(false)
  const [everCopied, setEverCopied] = useState(false)
  const [hover, setHover] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleCopy = () => {
    if (!text) return
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
    setJustCopied(true)
    setEverCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setJustCopied(false), 3000)
  }

  const tooltipText = everCopied ? 'Response Copied' : 'Copy Response'
  const IconCmp = justCopied ? Check : Copy

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleCopy}
          onMouseEnter={(e) => {
            setHover(true)
            e.currentTarget.style.background = 'rgba(22,49,70,0.05)'
            e.currentTarget.style.color = 'var(--signil-navy)'
            e.currentTarget.style.borderColor = 'var(--color-border-strong)'
          }}
          onMouseLeave={(e) => {
            setHover(false)
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = justCopied ? 'var(--signil-navy)' : 'var(--color-fg-subtle)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'transparent', border: '1px solid transparent',
            color: justCopied ? 'var(--signil-navy)' : 'var(--color-fg-subtle)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            transition: 'all var(--dur-fast) var(--ease-signature)',
          }}
        >
          <IconCmp size={15} strokeWidth={1.7} />
        </button>
        {hover && (
          <div
            role='tooltip'
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--signil-navy)', color: '#fff',
              padding: '5px 9px', borderRadius: 6,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 18px -6px rgba(22,49,70,0.30)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  )
}

const MatchCard = ({ initials, name, role, stats }) => (
  <div
    style={{
      border: '1px solid var(--color-border-strong)',
      borderRadius: 18,
      padding: 14,
      background: 'var(--signil-cream)',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'all var(--dur-med) var(--ease-signature)',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.borderColor = 'var(--color-accent-border)'
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none'
      e.currentTarget.style.borderColor = 'var(--color-border-strong)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--signil-navy)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11, letterSpacing: '0.04em' }}>{initials}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.005em', color: 'var(--signil-navy)' }}>{name}</div>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--signil-bronze)', marginTop: 2 }}>{role}</div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-fg-muted)', fontWeight: 500 }}>
      {stats.map((stat, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>{stat}</span>
          {i < stats.length - 1 && <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--color-fg-subtle)' }} />}
        </span>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border-soft)' }}>
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--signil-navy)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 5, height: 5, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />
        Verified
      </span>
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--signil-bronze)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        Open profile <ArrowUpRight size={11} strokeWidth={2} />
      </span>
    </div>
  </div>
)

const ScoutBubble = ({ children }) => (
  <div
    style={{
      flex: 1, minWidth: 0,
      color: 'var(--signil-navy)',
      fontSize: 17, lineHeight: 1.6, fontWeight: 400,
      fontFamily: 'var(--font-sans)',
    }}
  >
    {children}
  </div>
)

const UserBubble = ({ children }) => (
  <div
    style={{
      padding: '14px 22px',
      borderRadius: 26,
      background: 'rgba(22, 49, 70, 0.06)',
      color: 'var(--signil-navy)',
      maxWidth: '80%',
      fontSize: 17, lineHeight: 1.5, fontWeight: 400,
      fontFamily: 'var(--font-sans)',
    }}
  >
    {children}
  </div>
)

const ScoutPage = () => {
  const currentUser = useSelector(selectCurrentUser)
  const firstName = currentUser?.firstName || ''

  const [view, setView] = useState('empty')
  const [emptyValue, setEmptyValue] = useState('')
  const [convoValue, setConvoValue] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const convoRef = useRef(null)

  useEffect(() => {
    if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight
  }, [messages, typing])

  const sendMessage = async (text) => {
    const trimmed = (text || '').trim()
    const file = pendingFile
    if ((!trimmed && !file) || typing) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      attachment: file ? { name: file.name, size: file.size, type: file.type } : null,
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setEmptyValue('')
    setConvoValue('')
    setPendingFile(null)
    setView('convo')
    setTyping(true)

    try {
      const history = nextMessages.map((m) => ({
        role: m.role === 'scout' ? 'assistant' : 'user',
        content: m.text || (m.attachment ? `[file: ${m.attachment.name}]` : ''),
      }))
      const data = await scoutService.chat({ message: trimmed, history, file })
      const replyText = data?.reply || data?.message || data?.content ||
        "Got it. Let me think on that and I'll come back with the right next step."
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'scout', text: replyText, matches: data?.matches || null }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'scout',
          text: 'Scout is unavailable right now. Please try again in a moment.',
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  const newChat = () => {
    setMessages([])
    setTyping(false)
    setEmptyValue('')
    setConvoValue('')
    setPendingFile(null)
    setView('empty')
  }

  return (
    <DashboardLayout>
      <div
        className='scout-page-root'
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '100vh',
          height: '100%',
          background: 'var(--signil-cream)',
          isolation: 'isolate',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
          color: 'var(--signil-navy)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .scout-page-root { padding-left: ${SIDEBAR_OFFSET}px; }
            .scout-help-anchor { left: ${SIDEBAR_OFFSET + 28}px !important; }
          }
        `}</style>
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(#163146 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.03, pointerEvents: 'none', zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background:
              'radial-gradient(60% 40% at 80% 10%, rgba(152,106,65,0.08), transparent 60%), radial-gradient(50% 50% at 10% 90%, rgba(22,49,70,0.05), transparent 60%)',
            pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
          }}
        />

        <HelpButton />

        <button
          onClick={newChat}
          style={{
            position: 'absolute', top: 24, right: 28, zIndex: 5,
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '11px 18px',
            border: 'none',
            background: 'var(--signil-navy)', color: '#fff',
            borderRadius: 999,
            fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
            boxShadow: '0 12px 30px -10px rgba(22,49,70,0.35)',
            cursor: 'pointer',
            transition: 'all var(--dur-fast) var(--ease-signature)',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--signil-bronze)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--signil-navy)'
            e.currentTarget.style.transform = 'none'
          }}
        >
          <Plus size={14} strokeWidth={2.2} /> <span>New Chat</span>
        </button>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {view === 'empty' ? (
            <EmptyState onSend={sendMessage} value={emptyValue} setValue={setEmptyValue} disabled={typing} file={pendingFile} setFile={setPendingFile} firstName={firstName} />
          ) : (
            <>
              <div
                ref={convoRef}
                style={{ flex: 1, overflowY: 'auto', padding: '88px 28px 140px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{ width: '100%', maxWidth: CONVO_MAX, display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {m.role === 'scout' ? (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <ScoutBubble>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                            {m.matches && m.matches.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                                {m.matches.slice(0, 4).map((mm, i) => (
                                  <MatchCard
                                    key={i}
                                    initials={(mm.name || '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                                    name={mm.name || 'Verified match'}
                                    role={mm.role || mm.specialty || 'Advisor'}
                                    stats={mm.stats || [mm.location, mm.years ? `${mm.years} yrs` : null, mm.reviews ? `${mm.reviews} reviews` : null].filter(Boolean)}
                                  />
                                ))}
                              </div>
                            )}
                          </ScoutBubble>
                          <MsgActions text={m.text} />
                        </div>
                      ) : (
                        <UserBubble>
                          {m.attachment && (
                            <div
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '6px 10px',
                                background: 'rgba(22,49,70,0.06)',
                                border: '1px solid rgba(22,49,70,0.10)',
                                borderRadius: 999,
                                fontSize: 12, fontWeight: 600,
                                marginBottom: m.text ? 8 : 0,
                                color: 'var(--signil-navy)',
                              }}
                            >
                              <Paperclip size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: 'var(--signil-bronze)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{m.attachment.name}</span>
                              <span style={{ color: 'var(--color-fg-muted)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{formatFileSize(m.attachment.size)}</span>
                            </div>
                          )}
                          {m.text && <div>{m.text}</div>}
                        </UserBubble>
                      )}
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <TypingDots />
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  position: 'sticky', bottom: 0,
                  width: '100%', padding: '18px 28px 22px',
                  display: 'flex', justifyContent: 'center',
                  background: 'linear-gradient(to top, var(--signil-cream) 60%, rgba(250,247,242,0))',
                  backdropFilter: 'blur(6px)',
                  zIndex: 2,
                }}
              >
                <div style={{ width: '100%', maxWidth: COMPOSER_MAX }}>
                  <Composer value={convoValue} setValue={setConvoValue} onSend={() => sendMessage(convoValue)} disabled={typing} file={pendingFile} setFile={setPendingFile} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ScoutPage
