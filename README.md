# Finscape — Portfolio Dashboard

A full-stack stock portfolio dashboard with SMA overlays and candlestick charts.

---

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React, Recharts, Axios        |
| Backend  | FastAPI, Python               |
| Data     | `data_api.py` (data fetcher)  |

---

## Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app
│   ├── data_api.py      # Stock data fetching logic
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       └── components/
│           └── SMAChart.jsx   # Main dashboard component
```

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/portfolio/sma`  | Returns OHLC candles, close prices, and SMA (5/10/15) for all portfolio stocks |

### Response shape

```json
{
  "symbols": ["SUZLON", "ONGC", "..."],
  "data": [
    {
      "time": "2026-03-02",
      "SUZLON_close": 40.95,
      "SUZLON_sma_5": 41.2,
      "SUZLON_sma_10": 40.8,
      "SUZLON_sma_15": 40.1
    }
  ],
  "candles": {
    "SUZLON": [
      { "time": "2026-03-02", "open": 40.1, "high": 41.5, "low": 39.8, "close": 40.95 }
    ]
  }
}
```

---

## Dashboard Features

- **Portfolio view** — SMA line chart + candlestick chart side by side
- **Ticker badge grid** — click any stock badge to toggle Close / SMA 5 / SMA 10 / SMA 15 lines
- **Expand** — click either chart card to open a fullscreen overlay (close with `← back`, click outside, or `Esc`)
- **Portfolio / Explore** — carousel switcher with slide animation

---

## Notes

- SMA values for the first few rows may be empty strings from the API — the frontend cleans these to `null` automatically
- To add more stocks, update your portfolio list in `data_api.py`; the frontend picks up new symbols dynamically