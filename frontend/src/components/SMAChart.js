import { useEffect, useState, useRef } from 'react'
import {
    LineChart, Line, XAxis, YAxis,
    Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Cell, Legend
} from 'recharts'
import axios from 'axios'

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd',
                '#f8a5c2', '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#e17055',
                '#74b9ff', '#00b894', '#e84393', '#6c5ce7']

const LINE_TYPES = ['close', 'sma_5', 'sma_10', 'sma_15']

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #07070f;
    --surface:  #0d0d1a;
    --border:   #181828;
    --border2:  #242438;
    --text:     #e0e0f0;
    --muted:    #33334a;
    --muted2:   #55556a;
  }

  body { background: var(--bg); }

  .app {
    font-family: 'JetBrains Mono', monospace;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    overflow-x: hidden;
  }

  /* ── Navbar ── */
  .navbar {
    position: sticky; top: 0; z-index: 500;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    height: 56px;
    background: rgba(7,7,15,0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 800; letter-spacing: 3px;
    text-transform: uppercase; color: #fff;
    display: flex; align-items: center; gap: 8px;
  }
  .nav-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ecdc4;
    box-shadow: 0 0 8px #4ecdc4;
    animation: pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform: scale(1); }
    50%      { opacity:0.5; transform: scale(0.7); }
  }
  .nav-links { display: flex; align-items: center; gap: 6px; }
  .nav-link {
    padding: 6px 14px; border-radius: 8px; border: none;
    background: transparent; color: var(--muted2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 600; letter-spacing: 1px;
    cursor: pointer; transition: all 0.15s; text-transform: uppercase;
  }
  .nav-link:hover { background: var(--border); color: var(--text); }
  .nav-link.active { background: var(--border2); color: #fff; }
  .nav-right { display: flex; align-items: center; gap: 10px; }
  .nav-clock {
    font-size: 11px; color: var(--muted); letter-spacing: 1px;
    font-variant-numeric: tabular-nums;
  }
  .nav-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, #4ecdc4, #45b7d1);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; cursor: pointer;
  }

  /* ── Hero heading ── */
  .hero {
    padding: 52px 28px 36px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center; position: relative;
  }
  .hero-eyebrow {
    font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .hero-eyebrow::before, .hero-eyebrow::after {
    content: ''; flex: 1; max-width: 60px;
    height: 1px; background: var(--border2);
  }
  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 6vw, 72px);
    font-weight: 800; line-height: 1;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #fff 30%, #555580 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  .hero-sub {
    font-size: 11px; color: var(--muted); letter-spacing: 2px;
    text-transform: uppercase; margin-bottom: 40px;
  }

  /* ── Mode switcher ── */
  .mode-switcher {
    display: flex; align-items: center;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 14px; padding: 4px;
    gap: 2px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  .mode-btn {
    position: relative; z-index: 1;
    padding: 10px 28px; border-radius: 10px; border: none;
    background: transparent;
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; cursor: pointer;
    transition: color 0.25s;
    color: var(--muted2);
  }
  .mode-btn.active { color: #fff; }
  .mode-slider {
    position: absolute;
    height: calc(100% - 8px); top: 4px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1a1a2e, #252540);
    border: 1px solid var(--border2);
    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    transition: left 0.35s cubic-bezier(0.34,1.2,0.64,1),
                width 0.35s cubic-bezier(0.34,1.2,0.64,1);
    pointer-events: none;
  }

  /* ── Carousel wrapper ── */
  .carousel-outer {
    overflow: hidden;
    width: 100%;
    margin-top: 0;
  }
  .carousel-track {
    display: flex;
    width: 200%;
    transition: transform 0.55s cubic-bezier(0.77, 0, 0.175, 1);
  }
  .carousel-track.slide-left  { transform: translateX(-50%); }
  .carousel-track.slide-right { transform: translateX(0%); }

  .carousel-page {
    width: 50%;
    flex-shrink: 0;
    padding: 28px 24px 40px;
  }

  /* ── Ticker grid ── */
  .ticker-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .ticker-wrap { position: relative; }
  .ticker-badge {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    width: 72px; height: 52px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--surface);
    cursor: pointer; transition: all 0.18s; user-select: none;
  }
  .ticker-badge:hover { background: #141424; transform: translateY(-1px); }
  .ticker-badge.active {
    box-shadow: 0 0 0 1.5px var(--badge-color), 0 4px 20px rgba(0,0,0,0.5);
    background: #111120; transform: translateY(-2px); border-color: transparent;
  }
  .ticker-symbol {
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; margin-bottom: 5px; transition: color 0.18s;
  }
  .ticker-dot { width: 5px; height: 5px; border-radius: 50%; transition: background 0.18s; }

  /* ── Badge popover ── */
  .badge-popover {
    position: absolute; top: calc(100% + 8px); left: 50%;
    transform: translateX(-50%);
    background: #12121e; border: 1px solid var(--border2);
    border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    padding: 8px 6px; z-index: 300; min-width: 92px;
    animation: popIn 0.15s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes popIn {
    from { opacity:0; transform: translateX(-50%) scale(0.9) translateY(-4px); }
    to   { opacity:1; transform: translateX(-50%) scale(1) translateY(0); }
  }
  .popover-row {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 8px; border-radius: 6px; cursor: pointer;
    transition: background 0.12s; font-size: 10px; font-weight: 600;
    letter-spacing: 0.5px; color: var(--muted2); white-space: nowrap;
  }
  .popover-row:hover { background: #1a1a2e; color: #aaaacc; }
  .popover-row.on { color: #ddddff; }
  .popover-check {
    width: 12px; height: 12px; border-radius: 3px;
    border: 1.5px solid #333355; background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 9px; color: #fff; transition: all 0.12s;
  }
  .popover-check.checked { border-color: var(--badge-color); background: var(--badge-color); }

  /* ── Chart cards ── */
  .charts-row { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
  .chart-card {
    flex: 1; min-width: 280px;
    background: var(--surface); border-radius: 18px;
    border: 1px solid var(--border);
    box-shadow: 0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3);
    padding: 20px 16px 14px;
    cursor: pointer; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  }
  .chart-card:hover {
    box-shadow: 0 16px 56px rgba(0,0,0,0.7);
    transform: translateY(-3px); border-color: var(--border2);
  }
  .card-label {
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 2px; text-transform: uppercase; color: var(--muted);
    margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;
  }
  .expand-hint { font-size: 10px; color: var(--border2); letter-spacing: 1px; transition: color 0.2s; }
  .chart-card:hover .expand-hint { color: #6666aa; }

  /* ── Explore placeholder ── */
  .explore-page {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 60vh; gap: 16px;
    color: var(--muted);
  }
  .explore-icon { font-size: 48px; opacity: 0.3; }
  .explore-label {
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 3px; text-transform: uppercase; color: var(--muted);
  }
  .explore-sub { font-size: 10px; color: var(--muted); letter-spacing: 1px; opacity: 0.6; }

  /* ── Overlay ── */
  .overlay-backdrop {
    position: fixed; inset: 0;
    background: rgba(4,4,12,0.9);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    z-index: 1000; display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.18s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .overlay-card {
    width: 82vw; max-width: 1200px;
    background: var(--surface); border-radius: 22px;
    border: 1px solid var(--border2);
    box-shadow: 0 32px 100px rgba(0,0,0,0.85);
    padding: 30px 28px 24px; position: relative;
    animation: cardPop 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes cardPop {
    from { opacity:0; transform: scale(0.93) translateY(12px) }
    to   { opacity:1; transform: scale(1) translateY(0) }
  }
  .back-btn {
    position: absolute; top: 22px; left: 24px;
    background: #141424; border: 1px solid var(--border2); color: var(--muted2);
    border-radius: 8px; padding: 7px 16px;
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
    cursor: pointer; letter-spacing: 1px; transition: all 0.15s;
  }
  .back-btn:hover { background: #1c1c30; color: #aaaacc; border-color: #44446a; transform: translateX(-1px); }
  .overlay-title {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 3px; text-transform: uppercase; color: var(--muted);
    text-align: center; margin-bottom: 22px;
  }

  /* ── Candle tabs ── */
  .candle-tabs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
  .candle-tab {
    padding: 4px 11px; border-radius: 6px; border: 1px solid transparent;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
    cursor: pointer; background: #12121e; color: var(--muted);
    letter-spacing: 0.5px; transition: all 0.15s;
  }
  .candle-tab:hover { background: #1a1a2e; color: #8888aa; }
`

// ── Candle helpers ────────────────────────────────────────────────────────────

function buildCandleChartData(candles) {
    return candles.map(c => ({
        time: c.time,
        body: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
        wick: [c.low, c.high],
        open: c.open, close: c.close, high: c.high, low: c.low,
        up: c.close >= c.open,
    }))
}

const CandleTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    return (
        <div style={{ background: '#0e0e1c', border: '1px solid #252540', padding: '8px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.9, fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ color: '#44445a' }}>{d.time}</div>
            <div style={{ color: '#26a69a' }}>O {d.open} &nbsp; H {d.high}</div>
            <div style={{ color: '#ef5350' }}>L {d.low} &nbsp;&nbsp; C {d.close}</div>
        </div>
    )
}

function CandlestickChart({ candles, chartData, symbol, height = 220 }) {
    const data = buildCandleChartData(candles).map(candle => {
        const row = chartData.find(d => d.time === candle.time) || {}
        return {
            ...candle,
            sma_5:  row[`${symbol}_sma_5`]  || null,
            sma_10: row[`${symbol}_sma_10`] || null,
            sma_15: row[`${symbol}_sma_15`] || null,
        }
    })
    return (
        <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#33334a' }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#33334a' }} />
                    <Tooltip content={<CandleTooltip />} />
                    <Bar dataKey="wick" fill="transparent">
                        {data.map((e, i) => <Cell key={i} fill={e.up ? '#26a69a' : '#ef5350'} />)}
                    </Bar>
                    <Bar dataKey="body" fill="transparent">
                        {data.map((e, i) => <Cell key={i} fill={e.up ? '#26a69a' : '#ef5350'} />)}
                    </Bar>
                    <Line type="monotone" dataKey="sma_5"  stroke="#ffeaa7" dot={false} strokeWidth={1} name="SMA 5" />
                    <Line type="monotone" dataKey="sma_10" stroke="#dda0dd" dot={false} strokeWidth={1} name="SMA 10" />
                    <Line type="monotone" dataKey="sma_15" stroke="#45b7d1" dot={false} strokeWidth={1} name="SMA 15" />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#44445a' }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

// ── Overlay ───────────────────────────────────────────────────────────────────

function ExpandedOverlay({ title, onClose, children }) {
    const backdropRef = useRef(null)
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])
    return (
        <div className="overlay-backdrop" ref={backdropRef}
            onClick={(e) => { if (e.target === backdropRef.current) onClose() }}>
            <div className="overlay-card">
                <button className="back-btn" onClick={onClose}>← back</button>
                <div className="overlay-title">{title}</div>
                {children}
            </div>
        </div>
    )
}

// ── Badge popover ─────────────────────────────────────────────────────────────

function TickerBadge({ symbol, color, visible, onToggle }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)
    const anyOn = LINE_TYPES.some(t => visible[`${symbol}_${t}`])

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className="ticker-wrap" ref={wrapRef}>
            <div className={`ticker-badge ${anyOn ? 'active' : ''}`}
                style={{ '--badge-color': color }}
                onClick={() => setOpen(o => !o)}
                title={symbol}>
                <span className="ticker-symbol" style={{ color: anyOn ? color : '#33334a' }}>{symbol}</span>
                <div className="ticker-dot" style={{ background: anyOn ? color : '#1a1a2e' }} />
            </div>
            {open && (
                <div className="badge-popover" style={{ '--badge-color': color }}>
                    {LINE_TYPES.map(type => {
                        const key = `${symbol}_${type}`
                        const on  = !!visible[key]
                        return (
                            <div key={key} className={`popover-row ${on ? 'on' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onToggle(key) }}>
                                <div className={`popover-check ${on ? 'checked' : ''}`}>{on && '✓'}</div>
                                {type.toUpperCase().replace('_', ' ')}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Live clock ────────────────────────────────────────────────────────────────

function LiveClock() {
    const [time, setTime] = useState(new Date())
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])
    return (
        <span className="nav-clock">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    )
}

// ── Mode switcher with sliding pill ──────────────────────────────────────────

function ModeSwitcher({ mode, setMode }) {
    const portfolioRef = useRef(null)
    const exploreRef   = useRef(null)
    const [sliderStyle, setSliderStyle] = useState({})

    useEffect(() => {
        const el = mode === 'portfolio' ? portfolioRef.current : exploreRef.current
        if (!el) return
        const parent = el.parentElement
        const parentRect = parent.getBoundingClientRect()
        const rect = el.getBoundingClientRect()
        setSliderStyle({
            left:  rect.left - parentRect.left + 'px',
            width: rect.width + 'px',
        })
    }, [mode])

    return (
        <div className="mode-switcher" style={{ position: 'relative' }}>
            <div className="mode-slider" style={sliderStyle} />
            <button ref={portfolioRef} className={`mode-btn ${mode === 'portfolio' ? 'active' : ''}`}
                onClick={() => setMode('portfolio')}>
                Portfolio
            </button>
            <button ref={exploreRef} className={`mode-btn ${mode === 'explore' ? 'active' : ''}`}
                onClick={() => setMode('explore')}>
                Explore
            </button>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────

function SMAChart() {
    const [chartData,    setChartData]    = useState([])
    const [symbols,      setSymbols]      = useState([])
    const [candles,      setCandles]      = useState({})
    const [loading,      setLoading]      = useState(true)
    const [visible,      setVisible]      = useState({})
    const [activeStock,  setActiveStock]  = useState(null)
    const [expandedCard, setExpandedCard] = useState(null)
    const [mode,         setMode]         = useState('portfolio') // 'portfolio' | 'explore'

    useEffect(() => {
        axios.get('http://localhost:8000/portfolio/sma').then(res => {
            const cleaned = res.data.data.map(row => {
                const clean = { ...row }
                Object.keys(clean).forEach(k => { if (clean[k] === '' || clean[k] === 'NaN') clean[k] = null })
                return clean
            })
            setChartData(cleaned)
            setSymbols(res.data.symbols)
            setCandles(res.data.candles)
            setActiveStock(res.data.symbols[0])
            const initial = {}
            res.data.symbols.forEach(s => {
                initial[`${s}_close`]  = true
                initial[`${s}_sma_5`]  = false
                initial[`${s}_sma_10`] = false
                initial[`${s}_sma_15`] = false
            })
            setVisible(initial)
            setLoading(false)
        })
    }, [])

    const toggleLine = (key) => setVisible(prev => ({ ...prev, [key]: !prev[key] }))

    const renderSmaLineChart = (height = 300) => (
        <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData}>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#33334a' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#33334a' }} />
                    <Tooltip contentStyle={{ background: '#0e0e1c', border: '1px solid #252540', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                    {symbols.map((symbol, i) =>
                        LINE_TYPES.map(type => {
                            const key  = `${symbol}_${type}`
                            const dash = type === 'close' ? '0' : '5 5'
                            return visible[key] ? (
                                <Line key={key} type="monotone" dataKey={key}
                                    stroke={COLORS[i % COLORS.length]} strokeDasharray={dash}
                                    dot={false} name={key} strokeWidth={1.5} connectNulls />
                            ) : null
                        })
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )

    const renderCandleSection = (height = 240) => (
        <>
            <div className="candle-tabs">
                {symbols.map((symbol, i) => {
                    const color = COLORS[i % COLORS.length]
                    const isActive = activeStock === symbol
                    return (
                        <button key={symbol}
                            onClick={(e) => { e.stopPropagation(); setActiveStock(symbol) }}
                            className="candle-tab"
                            style={isActive ? { background: color + '18', color, borderColor: color + '55', boxShadow: `0 0 8px ${color}22` } : {}}>
                            {symbol}
                        </button>
                    )
                })}
            </div>
            {activeStock && candles[activeStock] && (
                <CandlestickChart candles={candles[activeStock]} chartData={chartData} symbol={activeStock} height={height} />
            )}
        </>
    )

    return (
        <div className="app">
            <style>{css}</style>

            {/* ── Navbar ── */}
            <nav className="navbar">
                <div className="nav-logo">
                    <div className="nav-logo-dot" />
                    Finscape
                </div>
                <div className="nav-links">
                    <button className="nav-link active">Dashboard</button>
                    <button className="nav-link">Markets</button>
                    <button className="nav-link">Alerts</button>
                </div>
                <div className="nav-right">
                    <LiveClock />
                    <div className="nav-avatar">H</div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <div className="hero">
                <div className="hero-eyebrow">Market Intelligence</div>
                <div className="hero-title">Investment Analysis</div>
                <div className="hero-sub">Real-time analysis · SMA overlays · Candlestick views</div>
                <ModeSwitcher mode={mode} setMode={setMode} />
            </div>

            {/* ── Carousel ── */}
            <div className="carousel-outer">
                <div className={`carousel-track ${mode === 'explore' ? 'slide-left' : 'slide-right'}`}>

                    {/* Page 0 — Portfolio */}
                    <div className="carousel-page">
                        {loading ? (
                            <p style={{ color: '#33334a', letterSpacing: 3, fontSize: 12 }}>LOADING PORTFOLIO...</p>
                        ) : (
                            <>
                                <div className="ticker-grid">
                                    {symbols.map((symbol, i) => (
                                        <TickerBadge key={symbol} symbol={symbol}
                                            color={COLORS[i % COLORS.length]}
                                            visible={visible} onToggle={toggleLine} />
                                    ))}
                                </div>

                                {/* Both charts in one div */}
                                <div className="charts-row">
                                    <div className="chart-card" onClick={() => setExpandedCard('sma')}>
                                        <div className="card-label">
                                            SMA Line Chart
                                            <span className="expand-hint">⤢ expand</span>
                                        </div>
                                        {renderSmaLineChart(300)}
                                    </div>
                                    <div className="chart-card" onClick={() => setExpandedCard('candle')}>
                                        <div className="card-label">
                                            Candlestick Chart
                                            <span className="expand-hint">⤢ expand</span>
                                        </div>
                                        {renderCandleSection(240)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Page 1 — Explore */}
                    <div className="carousel-page">
                        <div className="explore-page">
                            <div className="explore-icon">🔭</div>
                            <div className="explore-label">Explore Markets</div>
                            <div className="explore-sub">Coming soon — search & discover stocks</div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Expanded overlays ── */}
            {expandedCard === 'sma' && (
                <ExpandedOverlay title="SMA Line Chart" onClose={() => setExpandedCard(null)}>
                    {renderSmaLineChart(520)}
                </ExpandedOverlay>
            )}
            {expandedCard === 'candle' && (
                <ExpandedOverlay title="Candlestick Chart" onClose={() => setExpandedCard(null)}>
                    {renderCandleSection(480)}
                </ExpandedOverlay>
            )}
        </div>
    )
}

export default SMAChart