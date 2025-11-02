function calculateAverage(quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0) return { average_buy_price: 0, average_sell_price: 0 };
  const buySum = quotes.reduce((s, q) => s + (Number(q.buy_price) || 0), 0);
  const sellSum = quotes.reduce((s, q) => s + (Number(q.sell_price) || 0), 0);
  const n = quotes.length;
  return {
    average_buy_price: +(buySum / n).toFixed(6),
    average_sell_price: +(sellSum / n).toFixed(6)
  };
}

function calculateSlippage(quotes, averages) {
  const avgBuy = averages.average_buy_price;
  const avgSell = averages.average_sell_price;
  return quotes.map(q => {
    const buy = Number(q.buy_price) || 0;
    const sell = Number(q.sell_price) || 0;
    const buy_slippage = avgBuy ? +( (buy - avgBuy) / avgBuy ).toFixed(6) : 0;
    const sell_slippage = avgSell ? +( (sell - avgSell) / avgSell ).toFixed(6) : 0;
    return {
      source: q.source,
      buy_price_slippage: buy_slippage,
      sell_price_slippage: sell_slippage
    };
  });
}

module.exports = { calculateAverage, calculateSlippage };
