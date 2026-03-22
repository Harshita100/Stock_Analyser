// src/api/client.js
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

// export const getCandles = (symbol) =>
//     axios.get(`${BASE_URL}/candles/${symbol}?range=1m`)

export const getPortfolio = () =>
    axios.get(`${BASE_URL}/portfolio/sma`)

// export const placeOrder = (symbol, qty, side) =>
    // axios.post(`${BASE_URL}/order`, { symbol, qty, side })

// export const position = () =>
//     axios.get(`${BASE_URL}/position`)

// export const getPortfolioWithHistory = async () => {
//     try {
//         const portfolioRes = await getPortfolio();
//         const portfolio = portfolioRes.data;

//         const updated = await Promise.all(
//             portfolio.map(async (stock) => {
//                 const symbol = stock.trading_symbol;

//                 const candlesRes = await getCandles(symbol);
                
//                 return {
//                     ...stock,
//                     candles: candlesRes.data   // attach history
//                 };
//             })
//         );

//         return updated;

//     } catch (err) {
//         console.error(err);
//     }
// };