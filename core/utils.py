import requests
from decimal import Decimal


# ========== CRYPTO PRICE FETCHER ==========
def get_crypto_price(symbol: str) -> float:
    """Fetch crypto price in INR from CoinGecko"""
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": symbol.lower(), "vs_currencies": "inr"}
    response = requests.get(url, params=params)
    data = response.json()
    print("DATA: ", data)
    return data.get(symbol.lower(), {}).get("inr", 0)


# ========== CALCULATION LOGIC ==========
def calculate_investment_details(investment):
    """Calculate current value and returns of a crypto investment."""
    current_price = 0

    if investment.asset_type == 'crypto':
        current_price = get_crypto_price(investment.symbol)

    # Current Value = current price × quantity
    current_value = Decimal(current_price) * investment.quantity

    # % Returns
    returns = ((current_value - investment.invested_amount) / investment.invested_amount * 100) \
        if investment.invested_amount > 0 else 0

    return {
        "symbol": investment.symbol,
        "type": investment.asset_type,
        "invested": investment.invested_amount,
        "current_value": round(current_value, 2),
        "returns": round(returns, 2)
    }
    