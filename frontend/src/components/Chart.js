// src/components/Chart.js
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { getCandles } from '../api/client'

function Chart({ symbol }) {
    const [data, setData] = useState([])

    useEffect(() => {
        getCandles(symbol).then(res => setData(res.data))
    }, [symbol])   // re-fetches when symbol changes

    return (
        <LineChart width={800} height={400} data={data}>
            <Line type="monotone" dataKey="close" stroke="#00ff00" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
        </LineChart>
    )
}

export default Chart