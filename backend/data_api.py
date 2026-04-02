from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from growwapi import GrowwAPI
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()  

API_KEY = os.getenv("API_KEY")


# access_token = "Your grow api"

groww = GrowwAPI(API_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://sstocksanalyser.vercel.app"
        
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)

def calculate_sma(candles: list, symbol: str):
    df = pd.DataFrame(candles)
    df['sma_5']  = df['close'].rolling(window=5).mean()
    df['sma_10'] = df['close'].rolling(window=10).mean()
    df['sma_15'] = df['close'].rolling(window=15).mean()
    df = df.round(2)
    df = df.fillna("")
    # prefix each column with the symbol so all stocks can live on one chart
    # e.g. "close" becomes "WIPRO_close", "sma_5" becomes "WIPRO_sma_5"
    df = df.rename(columns={
        'close':  f'{symbol}_close',
        'sma_5':  f'{symbol}_sma_5',
        'sma_10': f'{symbol}_sma_10',
        'sma_15': f'{symbol}_sma_15',
    })
    return df

@app.get("/portfolio/sma")
def get_portfolio_sma():
    holdings = groww.get_holdings_for_user()

    end_time   = datetime.now()
    start_time = end_time - timedelta(days=30)  # 1 month

    all_dfs = []
    symbols = []
    candles_by_symbol = {}

    for stock in holdings["holdings"]:
        symbol = stock["trading_symbol"]
        symbols.append(symbol)

        try:
            candles = groww.get_historical_candle_data(
                trading_symbol=symbol,
                exchange=groww.EXCHANGE_NSE,
                segment=groww.SEGMENT_CASH,
                start_time=start_time.strftime("%Y-%m-%d %H:%M:%S"),
                end_time=end_time.strftime("%Y-%m-%d %H:%M:%S"),
                interval_in_minutes=1440  # daily candles
            )
            formatted_candles = [
            {
                "time": datetime.fromtimestamp(c[0]).strftime("%Y-%m-%d"),
                "close": c[4]
            }
            for c in candles["candles"]
            ]

            df = calculate_sma(formatted_candles, symbol)
            all_dfs.append(df[["time", f'{symbol}_close',
                                f'{symbol}_sma_5',
                                f'{symbol}_sma_10',
                                f'{symbol}_sma_15']])
            candles_by_symbol[symbol] = [
                {
                    "time":   datetime.fromtimestamp(c[0]).strftime("%Y-%m-%d"),
                    "open":   c[1],
                    "high":   c[2],
                    "low":    c[3],
                    "close":  c[4],
                    "volume": c[5],
                }
                for c in candles["candles"]
            ]

        except Exception as e:
            print(f"Error fetching {symbol}: {e}")

    # merge all stocks on the "time" column so each row is one date
    # with columns for every stock side by side
    merged = all_dfs[0]
    for df in all_dfs[1:]:
        merged = merged.merge(df, on="time", how="outer")

    merged = merged.sort_values("time")

    return {
        "symbols": symbols,   # ["WIPRO", "RELIANCE", ...] — React needs this
        "data": merged.to_dict(orient="records"),
        "candles": candles_by_symbol,
    }