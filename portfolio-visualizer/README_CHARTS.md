# Portfolio Charts Implementation

This document explains the new JavaScript-based portfolio visualization system that has been implemented to work with the FastAPI backend.

## Overview

The portfolio visualization system consists of several key components:

1. **PortfolioCharts Component** (`/src/components/PortfolioCharts.jsx`) - Main React component that handles data fetching and chart rendering
2. **Chart Utilities** (`/src/utils/chartUtils.js`) - Utility functions and Chart.js plugins
3. **Backend Integration** - Connects to the FastAPI backend at `http://localhost:8000/api/portfolio`

## Features

### Charts Implemented

1. **Portfolio Distribution (Donut Chart)** - Shows current value distribution across different assets
2. **Investment Distribution (Pie Chart)** - Shows investment distribution by amount invested
3. **Portfolio Summary (Bar Chart)** - Compares total invested vs current value vs profit
4. **Portfolio Timeline (Line Chart)** - Shows portfolio value and profit evolution over time

### Key Performance Indicators (KPIs)

- Total Invested
- Current Value 
- Profit (absolute and percentage)
- Available Liquidity

### Interactive Features

- **Granularity Control** - Switch between daily, weekly, and monthly timeline views
- **Responsive Design** - Charts adapt to different screen sizes
- **Real-time Data** - Fetches live data from Kraken API through backend
- **Error Handling** - Comprehensive error messages and loading states

## Technical Stack

- **Frontend**: React 19 + Vite
- **Charts**: Chart.js 4.5 + react-chartjs-2 5.3
- **Styling**: Tailwind CSS
- **Backend**: FastAPI (Python)
- **Data Source**: Kraken API

## Setup Instructions

### 1. Backend Setup

Make sure your FastAPI backend is running:

```bash
cd portfolio-visualizer/backend
python main.py
```

The backend should be available at `http://localhost:8000`

### 2. Frontend Setup

Install dependencies and start the development server:

```bash
cd portfolio-visualizer
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Usage

1. Enter your Kraken API credentials in the form
2. Click "Submit" to navigate to the portfolio view
3. Click "Load Portfolio Data" to fetch and display your portfolio information
4. Use the granularity selector to change timeline resolution
5. Use the "Back to Form" button to return and enter different credentials

## Architecture

### Component Structure

```
App.jsx
├── ApiForm.jsx (existing)
└── PortfolioCharts.jsx (new)
    ├── KPI Cards
    ├── Chart Grid
    │   ├── Portfolio Distribution Chart
    │   ├── Portfolio Summary Chart
    │   ├── Investment Distribution Chart
    │   └── Timeline Chart
    └── Portfolio Table
```

### Data Flow

1. User enters API credentials in `ApiForm`
2. `App` component stores credentials and switches to portfolio view
3. `PortfolioCharts` receives credentials as props
4. User clicks "Load Portfolio Data" 
5. Component makes POST request to `/api/portfolio` endpoint
6. Backend fetches data from Kraken API and processes it
7. Charts are rendered with the received data
8. Timeline data is grouped according to selected granularity

### Chart.js Plugins

Custom plugins implemented:

- **centerTextPlugin** - Displays total value in center of donut charts
- **centerInvestmentTextPlugin** - Displays total investment in center of investment pie chart

## API Integration

### Endpoint: `POST /api/portfolio`

**Request Body:**
```json
{
  "api_key": "your_kraken_api_key",
  "api_secret": "your_kraken_api_secret"
}
```

**Response:**
```json
{
  "summary": [
    {
      "asset": "XXBT",
      "amount": 0.5,
      "average_cost": 45000.0,
      "current_price": 50000.0,
      "total_invested": 22500.0,
      "current_value": 25000.0,
      "pnl_eur": 2500.0,
      "pnl_percent": 11.11
    }
  ],
  "timeline": [
    {
      "date": "2024-01-01",
      "value": 25000.0,
      "cost": 22500.0,
      "profit": 2500.0,
      "profit_pct": 11.11
    }
  ]
}
```

## Utility Functions

### Chart Configuration Functions

- `createDonutChartData()` - Formats data for portfolio distribution chart
- `createSummaryChartData()` - Formats data for summary bar chart  
- `createInvestmentPieChartData()` - Formats data for investment distribution chart
- `createTimelineChartData()` - Formats data for timeline chart

### Helper Functions

- `getFiatSymbol()` - Extracts fiat currency symbol from portfolio data
- `calculateKPIs()` - Calculates key performance indicators
- `groupTimelineData()` - Groups timeline data by granularity (daily/weekly/monthly)
- `formatCurrency()` - Formats currency values
- `formatPercentage()` - Formats percentage values

## Customization

### Adding New Charts

1. Create a new data formatting function in `chartUtils.js`
2. Add the chart configuration in `PortfolioCharts.jsx`
3. Add the chart component to the charts grid

### Modifying Chart Appearance

- Colors are defined in `chartColors` array in `chartUtils.js`
- Chart options can be modified in the respective options objects
- Styling is handled through Tailwind CSS classes

### Adding New Asset Types

Update the `assetLabelMap` in `chartUtils.js` to include mappings for new Kraken asset codes.

## Error Handling

The system includes comprehensive error handling for:

- Missing API credentials
- Backend connection errors
- Invalid API responses
- Chart rendering errors
- Data processing errors

## Performance Considerations

- Charts are only rendered when data is available
- Chart instances are properly destroyed when components unmount
- API calls are debounced to prevent excessive requests
- Large datasets are automatically grouped for better performance

## Browser Compatibility

- Supports all modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on mobile devices
- Chart.js provides excellent cross-browser compatibility

## Future Enhancements

Potential improvements:

1. Add asset filtering capabilities
2. Implement data caching for better performance
3. Add export functionality for charts and data
4. Include more advanced analytics and metrics
5. Add comparison features between different time periods
6. Implement real-time data updates
7. Add portfolio optimization suggestions

## Troubleshooting

### Common Issues

1. **Backend not running**: Make sure FastAPI server is started on port 8000
2. **CORS errors**: Backend is configured to allow all origins
3. **Chart not rendering**: Check browser console for JavaScript errors
4. **Data not loading**: Verify API credentials are correct and have proper permissions

### Debug Mode

Enable debug logging by opening browser developer tools and checking the console for detailed error messages.