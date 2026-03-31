// src/api/client.js
import axios from 'axios'

//const BASE_URL = 'http://localhost:8000'
const BASE_URL = 'https://stock-analyser-1-fx7j.onrender.com'

export const getPortfolio = () =>
    axios.get(`${BASE_URL}/portfolio/sma`)
