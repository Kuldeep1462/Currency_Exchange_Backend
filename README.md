# Currency Exchange Quotes API

A small Node.js + Express API that fetches USD currency quotes for regions (BRL/ARS), computes averages and per-source slippage, and exposes simple endpoints for use in Postman or other clients.

This project scrapes public web pages and also falls back to a free public exchange-rate API when scraping fails. It includes a light in-memory cache and an optional Postgres persistence layer.

Contents
- Endpoints and example requests
- How to install and run (PowerShell on Windows)
- Environment variables
- Debugging and test helpers
- Notes about scraping, fallbacks and reliability

## Quick start (Windows PowerShell)

1. Open PowerShell in the project root and install dependencies:

```powershell
cd C:\Users\ks\Desktop\currency-exchange-api
npm install
```

2. Start the server:

```powershell
npm run start
```

3. The server will log the mounted routes and the port (default 3000). Use Postman or PowerShell to call the endpoints described below.

**Live Deployed API:** https://currency-exchange-backend-2zim.onrender.com/

## Available endpoints

- GET /quotes
	- Returns an array of quotes (buy_price, sell_price, source, timestamp)
- GET /average
	- Returns the average_buy_price and average_sell_price across available sources
- GET /slippage
	- Returns per-source slippage relative to the averages
- GET /debug/refresh
	- Triggers a manual refresh of quotes inside the running server process and returns the annotated quotes (useful for ensuring the in-memory cache is populated)

Example PowerShell requests:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/quotes -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://localhost:3000/average -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://localhost:3000/slippage -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://localhost:3000/debug/refresh -Method GET | ConvertTo-Json -Depth 5
```

## Environment variables

Create a `.env` file in the project root or copy `.env.example`. Supported variables:

- PORT - port to run the server (default: 3000)
- REGION - currency region (BRL or ARS). Controls which source list is used for scraping.
- DATABASE_URL - optional Postgres connection string (if set, quotes are saved into the `quotes` table)

## How fetching works

- The service scrapes a small list of public pages (configured in `src/services/fetchRates.js`) using `axios` and `cheerio`.
- To improve reliability the code:
	- Uses a realistic `User-Agent` header
	- Uses an axios retry helper with exponential backoff and an increased timeout (30s)
	- Attempts a public API fallback (`https://api.exchangerate.host/convert`) if scraping fails to ensure at least one live rate can be returned
	- Keeps a mock fallback only as a last resort for local testing

Notes:
- Many finance websites render prices client-side or protect against bots. If you need robust scraping for a specific site, consider using Puppeteer/Playwright (headless browser) to render pages before parsing.

## Debugging and testing helpers

- `scripts/testFetch.js` — standalone script to run the fetcher (`fetchAllQuotes`) and print results. Useful for debugging scraping in isolation.
- `scripts/testRefresh.js` — calls the controller `refreshQuotesCache()` in a separate process and prints annotated quotes; note this does not affect the running server's in-memory cache.
- Use `GET /debug/refresh` to trigger `refreshQuotesCache()` inside the running server process so the server's cache is populated for subsequent requests to `/quotes`.

## Postman

- A `postman_collection.json` file is included for quick import. Import it into Postman and set the `baseUrl` variable (default `http://localhost:3000`).

## Database (optional)

- If you set `DATABASE_URL`, the app will attempt to insert quotes into a `quotes` table via `src/models/quotesModel.js`. The insert operation is wrapped in a transaction and failures are logged but do not crash the server.

Table schema suggestion (Postgres):

```sql
CREATE TABLE quotes (
	id SERIAL PRIMARY KEY,
	source TEXT,
	buy_price NUMERIC,
	sell_price NUMERIC,
	currency TEXT,
	created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Logs and runtime visibility

- The server prints helpful logs that show scraper attempts, parsed numeric values, retries, and fallbacks. Example log messages:
	- `[fetchFromUrl] <url> - numbers found: [...]`
	- `[axiosFetchWithRetry] attempt 1/3 failed for <url>: <error>`
	- `[fetchAllQuotes] region=BRL - successful sources: X/3`
	- `[fetchAllQuotes] API fallback succeeded`

If `/quotes` returns an empty array in Postman, run:

1. `GET /debug/refresh` to refresh the server's cache
2. Check the server terminal logs for the scraping/fallback output

## Development

- Run in watch mode:

```powershell
npm run dev
```

## Deployment

- This app can be deployed to Heroku/Render/Railway. Make sure to set `DATABASE_URL` and `PORT` in your hosting environment. Avoid exposing debug endpoints in production unless protected.

## Extending reliability

- If you want guaranteed scraping of JS-rendered pages, I can add optional Puppeteer-based site scrapers. This requires adding `puppeteer` (or `playwright`) to `package.json` and increases memory usage.

## Contributing

- Feel free to open issues or PRs. Keep scrapers site-specific and well-tested, and avoid hardcoding fragile selectors across many sites.

## License

MIT

