from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from growwapi import GrowwAPI
import pandas as pd
from datetime import datetime, timedelta

access_token = "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzQyMjU4MDAsImlhdCI6MTc3NDE3NTYyNCwibmJmIjoxNzc0MTc1NjI0LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJkN2ZkOTc4YS1lYTdmLTQ0NDUtYTQxNi1hZDAwY2JlMjU3ZDVcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiN2RiMzllYzYtNzY2Yi00YmFmLTkzMGEtMTE3M2VkMDE5ZTgyXCIsXCJkZXZpY2VJZFwiOlwiMTA4NmMxMWItOTRlNC01ODI2LTk2MzUtYjJjM2JmMzI3MGU2XCIsXCJzZXNzaW9uSWRcIjpcIjIwNTQyY2JjLTFkOWEtNDE4Yy04NTUyLTI1NDcyYTM2MjI5YlwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYk5mMzhMU0hkMHRUVlZvUHcwTHl0UmRSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWNcIixcInNvdXJjZUlwQWRkcmVzc1wiOlwiMjQwNToyMDE6ZDAwMToyODU5OmZjYzA6OGM6NjQ0ODo1NDJjLDE2Mi4xNTguNTEuMTc0LDM1LjI0MS4yMy4xMjNcIixcInR3b0ZhRXhwaXJ5VHNcIjoxNzc0MjI1ODAwMDAwLFwidmVuZG9yTmFtZVwiOlwiZ3Jvd3dBcGlcIn0iLCJpc3MiOiJhcGV4LWF1dGgtcHJvZC1hcHAifQ.SeQqPP1xszZHQ9DiVrKSrrZ9gStSJNLYp1weFmw4gFceq45dqLg9sa4sU21ov3vb-lsAm_gvk05Q4i6vWEgZ_g"

groww = GrowwAPI(access_token)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        "data": merged.to_dict(orient="records")
    }
