import { useEffect, useState } from 'react'
import {
    LineChart, Line, XAxis, YAxis,
    Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Bar, Cell
} from 'recharts'
import axios from 'axios'

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd']

// Custom candlestick bar — draws the wick and body for each candle
const CandlestickBar = (props) => {
    const { x, y, width, height, open, close, high, low, fill } = props
    if (!open || !close || !high || !low) return null

    const isUp     = close >= open
    const color    = isUp ? '#26a69a' : '#ef5350'
    const bodyTop  = isUp ? y : y + height
    const bodyBot  = isUp ? y + height : y
    const bodyH    = Math.abs(height)

    return (
        <g>
            {/* wick */}
            <line x1={x + width / 2} y1={props.highY}  x2={x + width / 2} y2={bodyTop} stroke={color} strokeWidth={1} />
            <line x1={x + width / 2} y1={bodyBot}       x2={x + width / 2} y2={props.lowY}  stroke={color} strokeWidth={1} />
            {/* body */}
            <rect x={x} y={bodyTop} width={width} height={Math.max(bodyH, 1)} fill={color} />
        </g>
    )
}

// Converts raw candle array into a shape recharts can use for a composed chart
function buildCandleChartData(candles) {
    return candles.map(c => ({
        time:  c.time,
        // recharts Bar needs a [min, max] range for the body
        body:  [Math.min(c.open, c.close), Math.max(c.open, c.close)],
        wick:  [c.low, c.high],
        open:  c.open,
        close: c.close,
        high:  c.high,
        low:   c.low,
        up:    c.close >= c.open,
    }))
}

// Tooltip for the candlestick chart
const CandleTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    return (
        <div style={{ background: '#1e1e1e', padding: 8, borderRadius: 4, fontSize: 12 }}>
            <p style={{ margin: 0 }}>{d.time}</p>
            <p style={{ margin: 0, color: '#aaa' }}>O: {d.open}  H: {d.high}</p>
            <p style={{ margin: 0, color: '#aaa' }}>L: {d.low}   C: {d.close}</p>
        </div>
    )
}

// function CandlestickChart({ candles, color }) {
//     const data = buildCandleChartData(candles)

//     return (
//         <ResponsiveContainer width="100%" height={220}>
//             <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
//                 <XAxis dataKey="time" tick={{ fontSize: 10 }} />
//                 <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
//                 <Tooltip content={<CandleTooltip />} />

//                 {/* wick — full high-low range */}
//                 <Bar dataKey="wick" fill="transparent" >
//                     {data.map((entry, i) => (
//                         <Cell key={i} fill={entry.up ? '#26a69a' : '#ef5350'} />
//                     ))}
//                 </Bar>

//                 {/* body — open-close range */}
//                 <Bar dataKey="body" fill="transparent">
//                     {data.map((entry, i) => (
//                         <Cell key={i} fill={entry.up ? '#26a69a' : '#ef5350'} />
//                     ))}
//                 </Bar>
//             </ComposedChart>
//         </ResponsiveContainer>
//     )
// }
function CandlestickChart({ candles, chartData, symbol }) {
    const data = buildCandleChartData(candles).map(candle => {
        // find the matching row in chartData for this date and merge SMA values
        const row = chartData.find(d => d.time === candle.time) || {}
        return {
            ...candle,
            sma_5:  row[`${symbol}_sma_5`]  || null,
            sma_10: row[`${symbol}_sma_10`] || null,
            sma_15: row[`${symbol}_sma_15`] || null,
        }
    })

    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip content={<CandleTooltip />} />

                {/* wick */}
                <Bar dataKey="wick" fill="transparent">
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.up ? '#26a69a' : '#ef5350'} />
                    ))}
                </Bar>

                {/* body */}
                <Bar dataKey="body" fill="transparent">
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.up ? '#26a69a' : '#ef5350'} />
                    ))}
                </Bar>

                {/* SMA lines */}
                <Line type="monotone" dataKey="sma_5"  stroke="#ffeaa7" dot={false} strokeWidth={1} name="SMA 5" />
                <Line type="monotone" dataKey="sma_10" stroke="#dda0dd" dot={false} strokeWidth={1} name="SMA 10" />
                <Line type="monotone" dataKey="sma_15" stroke="#45b7d1" dot={false} strokeWidth={1} name="SMA 15" />

                <Legend />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

function SMAChart() {
    const [chartData,  setChartData]  = useState([])
    const [symbols,    setSymbols]    = useState([])
    const [candles,    setCandles]    = useState({})   // { WIPRO: [...], RELIANCE: [...] }
    const [loading,    setLoading]    = useState(true)
    const [visible,    setVisible]    = useState({})
    const [activeStock, setActiveStock] = useState(null)  // which stock's candles to show

    useEffect(() => {
        axios.get('http://localhost:8000/portfolio/sma').then(res => {
            setChartData(res.data.data)
            setSymbols(res.data.symbols)
            setCandles(res.data.candles)
            setActiveStock(res.data.symbols[0])  // default to first stock

            const initial = {}
            res.data.symbols.forEach(s => {
                initial[`${s}_close`]  = true
                initial[`${s}_sma_5`]  = false
                initial[`${s}_sma_10`] = false
                initial[`${s}_sma_15`] = true
            })
            setVisible(initial)
            setLoading(false)
        })
    }, [])

    const toggleLine = (key) => setVisible(prev => ({ ...prev, [key]: !prev[key] }))

    if (loading) return <p>Loading portfolio...</p>

    return (
        <div>
            <h2>Portfolio SMA Chart</h2>

            {/* SMA toggle buttons */}
            <div style={{ marginBottom: 16 }}>
                {symbols.map((symbol, i) =>
                    ['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                        const key = `${symbol}_${type}`
                        return (
                            <button key={key} onClick={() => toggleLine(key)} style={{
                                margin: 4,
                                background: visible[key] ? COLORS[i] : '#333',
                                color: 'white', border: 'none',
                                padding: '4px 10px', borderRadius: 4, cursor: 'pointer'
                            }}>
                                {key}
                            </button>
                        )
                    })
                )}
            </div>

            {/* SMA Line chart */}
            <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData}>
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {symbols.map((symbol, i) =>
                        ['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                            const key  = `${symbol}_${type}`
                            const dash = type === 'close' ? '0' : '5 5'
                            return visible[key] ? (
                                <Line key={key} type="monotone" dataKey={key}
                                    stroke={COLORS[i]} strokeDasharray={dash}
                                    dot={false} name={key} />
                            ) : null
                        })
                    )}
                </LineChart>
            </ResponsiveContainer>

            {/* Candlestick section */}
            <h2 style={{ marginTop: 32 }}>Candlestick Chart</h2>

            {/* Stock selector tabs */}
            <div style={{ marginBottom: 12 }}>
                {symbols.map((symbol, i) => (
                    <button key={symbol} onClick={() => setActiveStock(symbol)} style={{
                        margin: 4,
                        background: activeStock === symbol ? COLORS[i] : '#333',
                        color: 'white', border: 'none',
                        padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
                        fontWeight: activeStock === symbol ? 'bold' : 'normal'
                    }}>
                        {symbol}
                    </button>
                ))}
            </div>

            {/* Candlestick chart for selected stock */}
            {activeStock && candles[activeStock] && (
                <CandlestickChart
                    candles={candles[activeStock]}
                    color={COLORS[symbols.indexOf(activeStock)]}
                    chartData={chartData}        // <-- add this
                    symbol={activeStock}  
                />
            )}
        </div>
    )
}

export default SMAChart