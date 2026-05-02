# API Contracts

## getOrderBook(ticker)
Response:
{
  bids: [{price, size}],
  asks: [{price, size}]
}

## placeOrder(order)
{
  ticker: string,
  side: "YES" | "NO",
  action: "BUY" | "SELL",
  price: number,
  count: number,
  reduce_only: boolean
}

## cancelOrder(orderId)

## getPosition(ticker)
