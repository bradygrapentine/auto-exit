# Data Schemas

## OrderBookLevel
{
  price: number,
  size: number
}

## OrderBook
{
  bids: OrderBookLevel[],
  asks: OrderBookLevel[]
}

## Position
{
  ticker: string,
  side: "YES" | "NO",
  size: number
}

## ExecutionConfig
{
  chunkSize: number,
  mode: "FAST" | "BALANCED" | "MAX_VALUE",
  dryRun: boolean
}

## ExecutionResult
{
  filled: number,
  avgPrice: number,
  status: "RUNNING" | "COMPLETE" | "FAILED"
}
