// src/api/client.js
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'


export const getPortfolio = () =>
    axios.get(`${BASE_URL}/portfolio/sma`)
