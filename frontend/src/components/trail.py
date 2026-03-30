import requests
import json
import pandas as pd

url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY'

headers={'user-agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'}
response = requests.get(url, headers=headers, timeout=10)
response_text=response.text
json_object = json.loads(response_text)
print(json_object)