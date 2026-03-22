// src/components/OrderPanel.js
import { useState } from 'react'
import { placeOrder } from '../api/client'

function OrderPanel() {
    const [symbol, setSymbol] = useState('WIPRO')
    const [qty, setQty] = useState(1)
    const [status, setStatus] = useState('')

    const handleBuy = async () => {
        try {
            await placeOrder(symbol, qty, 'BUY')
            setStatus('Order placed!')
        } catch (e) {
            setStatus('Order failed!')
        }
    }

    return (
        <div>
            <input value={symbol} onChange={e => setSymbol(e.target.value)} />
            <input value={qty} onChange={e => setQty(e.target.value)} type="number" />
            <button onClick={handleBuy}>Buy</button>
            <p>{status}</p>
        </div>
    )
}

export default OrderPanel