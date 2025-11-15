# 📈 Algorithmic Trading Platform with Backtesting Dashboard

A full-stack MERN application that allows users to create, test, and analyze trading strategies using historical market data. Features interactive charts, comprehensive performance metrics, and a user-friendly interface for strategy development.

## 🚀 Features

### Backend
- **Node.js/Express.js** REST API
- **MongoDB** for storing OHLCV data, strategies, and backtest results
- **Backtesting Engine** with realistic trade simulation
- **Performance Metrics** calculation:
  - Sharpe Ratio
  - Maximum Drawdown
  - Win Rate
  - Profit Factor
  - Total Return
  - Trade Statistics

### Frontend
- **React** with modern hooks
- **Vite** for fast development and build
- **Recharts** for interactive data visualization
  - Equity curve charts
  - Drawdown charts
  - Trade history tables
- **Responsive UI** with dark theme
- **Real-time** backtest execution

### Trading Strategies
Pre-built strategies included:
1. **Moving Average Crossover** - Golden/Death cross signals
2. **RSI Strategy** - Overbought/Oversold indicators
3. **Bollinger Bands** - Mean reversion strategy
4. **MACD** - Momentum-based signals

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
cd "d:\Odin Project\repo\ikbal project\algo-trading-platform"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

The `.env` file is already created in the backend folder with default values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/algo-trading
NODE_ENV=development
```

Update these values if needed for your environment.

## 🗄️ Database Setup

### 1. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 2. Seed Sample Data
The project includes a data seeder that generates 2 years of synthetic OHLCV data for 5 symbols (AAPL, GOOGL, MSFT, TSLA, AMZN):

```bash
cd backend
npm run seed
```

This will:
- Clear existing data
- Generate realistic price movements for 5 stocks
- Create 730 days of daily data per symbol
- Insert 3,650 total records into MongoDB

## 🚀 Running the Application

### Development Mode

### Start Backend Server
```bash
cd backend
npm run dev
# Server will run on http://localhost:5000
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Application will open on http://localhost:3000
```

### Production Deployment

This application is ready to deploy to **Vercel**:

- **Quick Guide**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- **Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

Deploy in 5 minutes:
1. Push code to GitHub
2. Connect to Vercel
3. Add MongoDB Atlas connection string
4. Deploy! 🎉

## 📖 Usage Guide

### 1. Dashboard
- View summary statistics of all backtests
- See recent backtest results
- Quick access to all features

### 2. Strategies
- Create custom trading strategies using JavaScript
- View and manage all strategies
- Strategies receive historical data and return trading signals

**Example Strategy:**
```javascript
function myStrategy(data, params) {
  const { shortPeriod = 10, longPeriod = 50 } = params;
  
  if (data.length < longPeriod) return null;
  
  // Calculate moving averages
  const shortMA = data.slice(-shortPeriod)
    .reduce((sum, bar) => sum + bar.close, 0) / shortPeriod;
  const longMA = data.slice(-longPeriod)
    .reduce((sum, bar) => sum + bar.close, 0) / longPeriod;
  
  // Generate signals
  if (shortMA > longMA) return 'BUY';
  if (shortMA < longMA) return 'SELL';
  
  return null;
}
```

### 3. Run Backtest
- Select a strategy (default or custom)
- Choose symbol and date range
- Set initial capital
- Configure strategy parameters
- Execute backtest

### 4. Results
- View detailed performance metrics
- Analyze equity curves
- Review drawdown charts
- Examine individual trade history
- Compare different strategies

## 📊 API Endpoints

### OHLCV Data
- `GET /api/ohlcv` - Get available symbols
- `GET /api/ohlcv/:symbol` - Get OHLCV data for a symbol
- `POST /api/ohlcv` - Add OHLCV data (for seeding)

### Strategies
- `GET /api/strategies` - Get all strategies
- `GET /api/strategies/:id` - Get a specific strategy
- `POST /api/strategies` - Create a new strategy
- `PUT /api/strategies/:id` - Update a strategy
- `DELETE /api/strategies/:id` - Delete a strategy

### Backtesting
- `POST /api/backtest/run` - Run a backtest
- `GET /api/backtest/results` - Get all backtest results
- `GET /api/backtest/results/:id` - Get a specific result
- `DELETE /api/backtest/results/:id` - Delete a result
- `GET /api/backtest/strategies/default` - Get default strategies

## 🧮 Performance Metrics Explained

### Sharpe Ratio
Measures risk-adjusted returns. Higher is better.
- `> 1` - Good
- `> 2` - Very Good
- `> 3` - Excellent

### Maximum Drawdown
The largest peak-to-trough decline. Lower is better.
- Indicates worst-case scenario
- Important for risk management

### Win Rate
Percentage of profitable trades.
- `50%+` is generally good
- Not the only important metric

### Profit Factor
Ratio of gross profits to gross losses.
- `> 1` - Profitable strategy
- `> 2` - Strong strategy
- `> 3` - Excellent strategy

## 🏗️ Project Structure

```
algo-trading-platform/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── engine/          # Backtesting engine
│   ├── strategies/      # Default trading strategies
│   ├── utils/           # Utility functions and data seeder
│   ├── server.js        # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── services/    # API service layer
│   │   ├── App.jsx      # Main app component
│   │   └── index.jsx    # Entry point
│   ├── index.html       # HTML entry point
│   ├── vite.config.js   # Vite configuration
│   └── package.json
│
└── README.md
```

## 🔧 Technology Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Math.js** - Mathematical calculations
- **Date-fns** - Date manipulation

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Toastify** - Notifications

## 📝 Adding Custom Strategies

1. Go to the **Strategies** page
2. Click "New Strategy"
3. Write your strategy function:
   - Receives `(data, params)` as arguments
   - `data` is an array of OHLCV objects
   - Return `'BUY'`, `'SELL'`, `'SHORT'`, `'COVER'`, or `null`
4. Set default parameters in JSON format
5. Save and use in backtests

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB is accessible on port 27017

### Port Already in Use
- Change port in backend `.env` file
- Update proxy in frontend `package.json` if needed

### No Data Available
- Run the data seeder: `npm run seed`
- Check MongoDB connection
- Verify data exists: Use MongoDB Compass or CLI

## 🚀 Future Enhancements

- [ ] Real-time market data integration
- [ ] More technical indicators
- [ ] Portfolio optimization
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulation
- [ ] Paper trading mode
- [ ] Strategy optimization
- [ ] Multiple timeframe support
- [ ] Advanced charting (candlesticks)
- [ ] Export results to CSV/PDF

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This software is for educational purposes only. Do not use this for actual trading without proper testing and risk management. Past performance does not guarantee future results. Trading involves risk of loss.

---

**Happy Trading! 📈💰**
