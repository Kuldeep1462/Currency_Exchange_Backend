# 💱 Currency Exchange Quotes API

🚀 **Live API:** [https://currency-exchange-backend-2zim.onrender.com/](https://currency-exchange-backend-2zim.onrender.com/)

---

### 📘 Overview

**Currency Exchange Quotes API** is a lightweight **Node.js + Express** service that fetches live USD currency quotes for different regions (currently supports **BRL** and **ARS**), computes averages and slippage, and exposes clean JSON endpoints for integration or testing in **Postman**.

The system:
- Scrapes real-time rates from multiple financial websites.
- Falls back to a free public exchange-rate API when scraping fails.
- Caches data in memory for speed.
- Optionally stores rates in a **PostgreSQL** database.

---

## ⚙️ Features

✅ Fetches real-time currency quotes (USD/BRL, USD/ARS)  
✅ Computes **average buy/sell prices** across sources  
✅ Calculates **per-source slippage** relative to averages  
✅ Includes **debug routes** for testing  
✅ Uses **axios + cheerio** for reliable scraping  
✅ Optional **PostgreSQL persistence**  
✅ Ready for deployment on **Render / Railway / Heroku**  

---

## 📁 Project Structure

```
currency-exchange-api/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── averageController.js  # Handles average price calculations
│   │   ├── quotesController.js   # Manages quotes fetching and caching
│   │   └── slippageController.js # Computes slippage per source
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handling
│   ├── models/
│   │   └── quotesModel.js        # Database operations for quotes
│   ├── routes/
│   │   ├── averageRoute.js       # Routes for average endpoints
│   │   ├── debugRoute.js         # Debug and refresh routes
│   │   ├── quotesRoute.js        # Quotes endpoints
│   │   └── slippageRoute.js      # Slippage endpoints
│   ├── services/
│   │   └── fetchRates.js         # Core scraping and fetching logic
│   ├── utils/
│   │   ├── cache.js              # In-memory caching utilities
│   │   └── helpers.js            # Helper functions
│   └── server.js                 # Main server entry point
├── scripts/
│   ├── testFetch.js              # Standalone fetch testing
│   └── testRefresh.js            # Cache refresh testing
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── postman_collection.json       # Postman API collection
└── README.md                     # This file
```

---

## 🧭 Available Endpoints

| Method | Endpoint | Description |
|--------|-----------|--------------|
| `GET` | `/quotes` | Returns all current quotes with buy/sell prices, source, and timestamp |
| `GET` | `/average` | Returns average buy/sell prices across available sources |
| `GET` | `/slippage` | Returns per-source slippage relative to the average |
| `GET` | `/debug/refresh` | Manually triggers a refresh of quotes inside the running server |

---

## 🧪 Example Requests (PowerShell)

```powershell
Invoke-RestMethod -Uri https://currency-exchange-backend-2zim.onrender.com/quotes -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri https://currency-exchange-backend-2zim.onrender.com/average -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri https://currency-exchange-backend-2zim.onrender.com/slippage -Method GET | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri https://currency-exchange-backend-2zim.onrender.com/debug/refresh -Method GET | ConvertTo-Json -Depth 5
```

---

## 🚀 Quick Start (Windows PowerShell)

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/Kuldeep1462/Currency_Exchange_Backend.git
   cd Currency_Exchange_Backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Configure your settings (PORT, REGION, DATABASE_URL if needed)

4. **Start the server:**
   ```powershell
   npm run start
   ```

5. **Test the API:**
   - Use the PowerShell commands above or import `postman_collection.json` into Postman

---

## 🔧 Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `REGION` | Currency region (BRL or ARS) | `BRL` |
| `DATABASE_URL` | PostgreSQL connection string (optional) | - |

---

## 🔍 How Fetching Works

- **Scraping:** Uses `axios` and `cheerio` to parse HTML from financial websites
- **Reliability:** Implements retry logic with exponential backoff and realistic User-Agent headers
- **Fallbacks:** If scraping fails, uses `https://api.exchangerate.host/convert` as backup
- **Caching:** Stores results in memory for 60 seconds (configurable)
- **Persistence:** Optionally saves to PostgreSQL for historical data

---

## 🧪 Debugging and Testing

### Debug Endpoints
- `GET /debug/refresh` - Force refresh the server's cache

### Logs
The server provides detailed logs for:
- Scraping attempts and results
- API fallback usage
- Cache hits/misses
- Database operations

---

## 📮 Postman

Import `postman_collection.json` into Postman for easy testing. Set the `baseUrl` variable to your local server or the live API.

---

## 🗄️ Database (Optional)

If `DATABASE_URL` is set, quotes are saved to a `quotes` table:

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

---
## 📄 License

MIT License - see LICENSE file for details

---
