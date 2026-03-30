import { useState, useEffect, useRef } from 'react'
import {
    LineChart, Line, XAxis, YAxis,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import axios from 'axios'

const COLORS = ['#5b6bff', '#ff6b9d', '#00d2b4', '#ffd166', '#ff9f43', '#a78bfa', '#38bdf8', '#f97316']

const POPULAR = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'WIPRO', 'SBIN', 'BAJFINANCE', 'ADANIGREEN', 'ONGC']

export default function WatchlistPage() {
    const [query,      setQuery]      = useState('')
    const [results,    setResults]    = useState([])
    const [watchlist,  setWatchlist]  = useState(() => {
        try { return JSON.parse(localStorage.getItem('watchlist') || '[]') } catch { return [] }
    })
    const [chartData,  setChartData]  = useState([])
    const [visible,    setVisible]    = useState({})
    const [loading,    setLoading]    = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const searchRef = useRef(null)

    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist))
    }, [watchlist])

    useEffect(() => {
        if (watchlist.length === 0) { setChartData([]); return }
        setLoading(true)
        axios.get('http://localhost:8000/portfolio/sma', {
            params: { symbols: watchlist.join(',') }
        }).then(res => {
            setChartData(res.data.data)
            const init = {}
            watchlist.forEach(s => {
                init[`${s}_close`]  = true
                init[`${s}_sma_5`]  = false
                init[`${s}_sma_10`] = false
                init[`${s}_sma_15`] = false
            })
            setVisible(init)
        }).catch(() => {}).finally(() => setLoading(false))
    }, [watchlist])

    useEffect(() => {
        if (!query.trim()) { setResults([]); return }
        const q = query.toUpperCase()
        setResults(POPULAR.filter(s => s.includes(q) && !watchlist.includes(s)).slice(0, 6))
    }, [query, watchlist])

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const addStock = (symbol) => {
        if (watchlist.includes(symbol)) return
        setWatchlist(prev => [...prev, symbol])
        setQuery('')
        setResults([])
        setSearchOpen(false)
    }

    const removeStock = (symbol) => {
        setWatchlist(prev => prev.filter(s => s !== symbol))
        setVisible(prev => {
            const next = { ...prev }
            delete next[`${symbol}_close`]
            delete next[`${symbol}_sma_5`]
            delete next[`${symbol}_sma_10`]
            delete next[`${symbol}_sma_15`]
            return next
        })
    }

    const toggleLine = (key) => setVisible(prev => ({ ...prev, [key]: !prev[key] }))

    return (
        // <div className="min-h-screen bg-[#07070d] text-[#e0e0f0] font-mono pt-20 px-8 pb-12">
        <div className="bg-white/10 backdrop-blur-xl backdrop-saturate-150 border border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8">

            {/* Top bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <h1 className="font-black text-2xl tracking-tight text-[#e8e8f8]"
                    style={{ fontFamily: 'Syne, sans-serif' }}>
                    Watch<span className="text-[#5b6bff]">list</span>
                </h1>

                {/* Search */}
                <div className="relative" ref={searchRef}>
                    <div className="flex items-center gap-2 bg-[#10101e] border border-[#1e1e3a] rounded-lg px-3.5 w-72
                                    focus-within:border-[#5b6bff] transition-colors duration-200">
                        <span className="text-[#e0e0f0] opacity-40 text-sm select-none">⌕</span>
                        <input
                            className="bg-transparent border-none outline-none text-[#e0e0f0] text-xs tracking-widest
                                       py-2.5 w-full placeholder-[#3a3a5a]"
                            placeholder="Search symbol e.g. TCS"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setSearchOpen(true) }}
                            onFocus={() => setSearchOpen(true)}
                        />
                    </div>

                    {searchOpen && query && (
                        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#10101e] border border-[#1e1e3a]
                                        rounded-lg overflow-hidden z-50 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                            {results.length > 0 ? results.map((s, idx) => (
                                <div key={s}
                                     className={`flex items-center justify-between px-3.5 py-2.5 text-xs tracking-wider
                                                 hover:bg-[#1a1a30] transition-colors duration-150 cursor-pointer
                                                 ${idx < results.length - 1 ? 'border-b border-[#0e0e1e]' : ''}`}>
                                    <span>{s}</span>
                                    <button
                                        onClick={() => addStock(s)}
                                        className="text-[10px] text-[#5b6bff] bg-[#1a1a38] border border-[#2a2a50]
                                                   rounded px-2 py-0.5 hover:bg-[#2a2a50] transition-colors duration-150
                                                   font-mono tracking-wider cursor-pointer">
                                        + ADD
                                    </button>
                                </div>
                            )) : (
                                <div className="px-3.5 py-3 text-[11px] text-[#3a3a5a]">
                                    {watchlist.includes(query.toUpperCase())
                                        ? 'Already in watchlist'
                                        : 'No results — try exact NSE symbol'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Empty state */}
            {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#2a2a4a]">
                    <span className="text-5xl">◎</span>
                    <span className="text-[13px] tracking-widest">Search and add stocks to start analysing</span>
                </div>
            ) : (
                <>
                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 mb-7">
                        {watchlist.map((s, i) => (
                            <div
                                key={s}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] tracking-wider"
                                style={{
                                    color:       COLORS[i % COLORS.length],
                                    borderColor: COLORS[i % COLORS.length] + '44',
                                    background:  COLORS[i % COLORS.length] + '12',
                                }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                     style={{ background: COLORS[i % COLORS.length] }} />
                                {s}
                                <button
                                    onClick={() => removeStock(s)}
                                    className="bg-transparent border-none cursor-pointer opacity-40
                                               hover:opacity-90 transition-opacity text-sm leading-none px-0.5"
                                    style={{ color: 'inherit', fontFamily: 'inherit' }}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Toggle controls */}
                    <div className="mb-5">
                        <div className="text-[10px] tracking-[0.12em] text-[#3a3a5a] uppercase mb-3">
                            Toggle lines
                        </div>
                        {watchlist.map((symbol, i) => (
                            <div key={symbol} className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[11px] tracking-wider w-28 flex-shrink-0"
                                      style={{ color: COLORS[i % COLORS.length] }}>
                                    {symbol}
                                </span>
                                {['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                                    const key  = `${symbol}_${type}`
                                    const isOn = !!visible[key]
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleLine(key)}
                                            className="text-[10px] tracking-wider px-2.5 py-0.5 rounded font-mono
                                                       border-none cursor-pointer transition-all duration-200"
                                            style={isOn ? {
                                                background: COLORS[i % COLORS.length] + '33',
                                                color:      COLORS[i % COLORS.length],
                                            } : {
                                                background: '#14141e',
                                                color:      '#3a3a5a',
                                            }}
                                        >
                                            {type.replace('_', ' ').toUpperCase()}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="bg-[#0c0c18] border border-[#1a1a2e] rounded-xl px-4 pt-6 pb-4 mt-7">
                        <div className="text-[11px] tracking-[0.1em] text-[#e0e0f0] uppercase mb-5 pl-2 opacity-40">
                            Combined SMA chart
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-72 text-[#2a2a4a] text-xs tracking-widest">
                                LOADING DATA…
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={420}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#404060' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#404060' }} />
                                    <Tooltip
                                        contentStyle={{
                                            background:   '#10101e',
                                            border:       '1px solid #1e1e3a',
                                            borderRadius: 6,
                                            fontSize:     11,
                                            fontFamily:   'DM Mono, monospace',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
                                    {watchlist.map((symbol, i) =>
                                        ['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                                            const key  = `${symbol}_${type}`
                                            const dash = type === 'close' ? '0' : '4 4'
                                            return visible[key] ? (
                                                <Line
                                                    key={key}
                                                    type="monotone"
                                                    dataKey={key}
                                                    stroke={COLORS[i % COLORS.length]}
                                                    strokeDasharray={dash}
                                                    dot={false}
                                                    name={key}
                                                    strokeWidth={type === 'close' ? 1.5 : 1}
                                                    connectNulls={false}
                                                />
                                            ) : null
                                        })
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-72 text-[#2a2a4a] text-xs tracking-widest">
                                NO DATA — check API connection
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
