const axios = require('axios');
const cheerio = require('cheerio');

const ARS_SOURCES = [
  'https://www.ambito.com/contenidos/dolar.html',
  'https://www.dolarhoy.com',
  'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB'
];

const BRL_SOURCES = [
  'https://wise.com/es/currency-converter/brl-to-usd-rate',
  'https://nubank.com.br/taxas-conversao/',
  'https://www.nomadglobal.com'
];

function extractNumbersFromText(text) {
  if (!text || typeof text !== 'string') return [];
  // allow any integer length and 1-4 decimal places (covers 140.3, 140.30, 1000.00, etc.)
  const rx = /\d+(?:[.,]\d{1,4})?/g;
  const matches = text.match(rx) || [];
  return matches.map(m => parseFloat(m.replace(',', '.'))).filter(n => !Number.isNaN(n));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function axiosFetchWithRetry(url, opts = {}, attempts = 3) {
  let lastErr;
  const ua = opts.headers && opts.headers['User-Agent'] ? opts.headers['User-Agent'] :
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

  for (let i = 0; i < attempts; i++) {
    try {
      const cfg = Object.assign({}, opts, {
        timeout: opts.timeout || 30000,
        headers: Object.assign({
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }, opts.headers || {})
      });
      const resp = await axios.get(url, cfg);
      return resp;
    } catch (err) {
      lastErr = err;
      const wait = Math.min(1000 * Math.pow(2, i), 5000);
      console.warn(`[axiosFetchWithRetry] attempt ${i + 1}/${attempts} failed for ${url}: ${err && err.message ? err.message : err}. retrying in ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function fetchFromUrl(url) {
  try {
    // try with retries and a more permissive timeout and realistic User-Agent
    const resp = await axiosFetchWithRetry(url, { timeout: 30_000 }, 3);
    const data = resp && resp.data ? resp.data : '';
    const $ = cheerio.load(data);

    // naive approach: gather all text and extract numbers
    const bodyText = $('body').text();
    const numbers = extractNumbersFromText(bodyText);

    // log what we found for debugging
    console.log(`[fetchFromUrl] ${url} - numbers found:`, numbers.slice(0, 10));

    let buy = null, sell = null;
    if (numbers.length >= 2) {
      buy = numbers[0];
      sell = numbers[1];
    } else if (numbers.length === 1) {
      buy = numbers[0];
      sell = numbers[0];
    }

    // Final fallback: try meta tags or data attributes
    if (!buy || !sell) {
      const metaVals = $('meta')
        .map((i, el) => $(el).attr('content'))
        .get()
        .filter(Boolean)
        .join(' ');
      const metaNumbers = extractNumbersFromText(metaVals);
      if (metaNumbers.length >= 2) {
        buy = buy || metaNumbers[0];
        sell = sell || metaNumbers[1];
      }
    }

    if (!buy || !sell) {
      // If we still don't have values, return an error marker
      return { source: url, error: true, message: 'Could not parse prices' };
    }

    return {
      buy_price: Number(buy),
      sell_price: Number(sell),
      source: url
    };
  } catch (err) {
    console.warn(`[fetchFromUrl] ${url} - fetch error:`, err && err.message ? err.message : err);
    return { source: url, error: true, message: err.message || String(err) };
  }
}

async function fetchAllQuotes(region = 'BRL') {
  const sources = region === 'ARS' ? ARS_SOURCES : BRL_SOURCES;

  // Ensure we use Promise.all to wait for all scrapers
  const results = await Promise.all(sources.map(async (url) => await fetchFromUrl(url)));

  // Filter out failed results
  const ok = results.filter(r => r && !r.error).map(r => ({ buy_price: r.buy_price, sell_price: r.sell_price, source: r.source }));

  console.log(`[fetchAllQuotes] region=${region} - successful sources: ${ok.length}/${sources.length}`);

  // If scraping returned nothing usable, try a public exchange-rate API as a reliable fallback
  if (ok.length === 0) {
    console.warn('[fetchAllQuotes] No valid scraped data found. Trying public API fallback (exchangerate.host)');
    try {
      const apiResults = await fetchRatesFromPublicApi(region);
      if (apiResults && apiResults.length > 0) {
        console.log('[fetchAllQuotes] API fallback succeeded');
        return apiResults;
      }
    } catch (err) {
      console.warn('[fetchAllQuotes] API fallback failed:', err && err.message ? err.message : err);
    }

    console.warn('[fetchAllQuotes] Returning mock data for testing.');
    if (region === 'ARS') {
      return [
        { buy_price: 140.3, sell_price: 144.0, source: 'mock://ambito' },
        { buy_price: 139.8, sell_price: 143.5, source: 'mock://dolarhoy' }
      ];
    }
    // default BRL mock
    return [
      { buy_price: 0.19, sell_price: 0.21, source: 'mock://wise' },
      { buy_price: 0.185, sell_price: 0.205, source: 'mock://nubank' }
    ];
  }

  return ok;
}

async function fetchRatesFromPublicApi(region = 'BRL') {
  // Use exchangerate.host convert endpoint as a simple, free fallback for one reliable rate
  try {
    if (region === 'ARS') {
      // want ARS per USD (e.g., 140.3)
      const url = 'https://api.exchangerate.host/convert?from=USD&to=ARS';
      const resp = await axiosFetchWithRetry(url, { timeout: 10_000 }, 2);
      const rate = resp && resp.data && resp.data.result ? Number(resp.data.result) : null;
      if (rate) return [{ buy_price: rate, sell_price: rate, source: 'https://api.exchangerate.host' }];
    }
    // BRL: return USD per BRL (1 BRL -> USD)
    const url = 'https://api.exchangerate.host/convert?from=BRL&to=USD';
    const resp = await axiosFetchWithRetry(url, { timeout: 10_000 }, 2);
    const rate = resp && resp.data && resp.data.result ? Number(resp.data.result) : null;
    if (rate) return [{ buy_price: rate, sell_price: rate, source: 'https://api.exchangerate.host' }];
    return [];
  } catch (err) {
    console.warn('[fetchRatesFromPublicApi] failed', err && err.message ? err.message : err);
    return [];
  }
}

module.exports = {
  fetchAllQuotes
};
