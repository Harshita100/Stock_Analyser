def sma():
    data['SMA'] = data['Close'].rolling(window=window).mean()
    return data['SMA']