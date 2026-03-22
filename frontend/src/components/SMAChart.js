import { useEffect, useState } from 'react'
import {
    LineChart, Line, XAxis, YAxis,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import axios from 'axios'

// each stock gets a distinct color
const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd']

function SMAChart() {
    const [chartData, setChartData] = useState([])
    const [symbols, setSymbols]     = useState([])
    const [loading, setLoading]     = useState(true)

    // which lines are visible — user can toggle them
    const [visible, setVisible] = useState({})

    useEffect(() => {
        axios.get('http://localhost:8000/portfolio/sma')
            .then(res => {
                setChartData(res.data.data)
                setSymbols(res.data.symbols)

                // default: show close price and SMA 15 for all stocks
                const initial = {}
                res.data.symbols.forEach(s => {
                    initial[`${s}_close`]  = true
                    initial[`${s}_sma_5`]  = false  // hidden by default
                    initial[`${s}_sma_10`] = false  // hidden by default
                    initial[`${s}_sma_15`] = true
                })
                setVisible(initial)
                setLoading(false)
            })
    }, [])

    const toggleLine = (key) => {
        setVisible(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) return <p>Loading portfolio...</p>

    return (
        <div>
            <h2>Portfolio SMA Chart</h2>

            {/* Toggle buttons for each line */}
            <div style={{ marginBottom: 16 }}>
                {symbols.map((symbol, i) => (
                    ['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                        const key = `${symbol}_${type}`
                        return (
                            <button
                                key={key}
                                onClick={() => toggleLine(key)}
                                style={{
                                    margin: 4,
                                    background: visible[key] ? COLORS[i] : '#333',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                }}
                            >
                                {key}
                            </button>
                        )
                    })
                ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData}>
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {symbols.map((symbol, i) =>
                        ['close', 'sma_5', 'sma_10', 'sma_15'].map(type => {
                            const key = `${symbol}_${type}`
                            // dotted line for SMAs, solid for close price
                            const dash = type === 'close' ? '0' : '5 5'
                            return visible[key] ? (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={COLORS[i]}
                                    strokeDasharray={dash}
                                    dot={false}        // no dots = cleaner chart
                                    name={key}
                                />
                            ) : null
                        })
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default SMAChart