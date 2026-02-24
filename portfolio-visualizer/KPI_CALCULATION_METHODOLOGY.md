# KPI Calculation Methodology - Portfolio Visualizer

## Overview

This document explains how KPIs (Key Performance Indicators) are calculated when date filters are applied in the Portfolio Visualizer application.

## Core Methodology: Portfolio State Approach

### What You See vs What Period You Select

**Important:** When you filter by a date range (e.g., "May 2025"), you are NOT seeing gains/losses for that period only. Instead, you see the **accumulated portfolio state** as of the end date.

### Example Scenario

**Your operations throughout 2025:**
- January: Buy 100€ AAPL
- March: Buy 200€ MSFT  
- May: Sell 50€ AAPL
- July: Buy 150€ GOOGL
- October: Sell 100€ MSFT

**When filtering to "May 2025", you will see:**

| KPI | Value | Calculation |
|-----|-------|-------------|
| **Total Invested** | 250€ | All purchases up to May 31 (using FIFO for cost basis) |
| **Portfolio Value** | Market value as of May 31 | Current holdings × market prices as of May 31 |
| **Total P&L** | Portfolio Value - Total Invested | **Cumulative** gains/losses since inception |
| **Realized Gains** | Gains from sales up to May 31 | FIFO-calculated gains from completed trades |
| **Unrealized Gains** | Total P&L - Realized Gains | Paper gains/losses on current holdings |

## Technical Implementation

### Date Filtering Logic

```javascript
// Located in: src/components/Dashboard/Sections/Overview/components/KPIGrid.jsx
// ALWAYS use "Portfolio State" view: process all data up to the end date
timelineToProcess = portfolioData.timeline.filter(entry => {
  const entryDateStr = entry.date.split('T')[0];
  return entryDateStr <= endDateStr; // Include all operations up to end date
});
```

### Key Calculation Functions

#### 1. Total Invested (Cost Basis)
- **Method:** FIFO (First In, First Out)
- **Includes:** All purchase costs + fees up to end date
- **Excludes:** Operations after the filtered end date

#### 2. Portfolio Value
- **Method:** Current market value of holdings
- **Calculation:** Sum of (quantity × latest available price) for each asset
- **Date Context:** Holdings and prices as of the filtered end date

#### 3. Realized Gains
- **Method:** FIFO-based calculation of completed trades
- **Formula:** `(Sale Price - Cost Basis) × Quantity` for all sales up to end date
- **Processing:** Uses oldest purchases first when matching sales

#### 4. Unrealized Gains
- **Formula:** `Total P&L - Realized Gains`
- **Represents:** Paper gains/losses on current holdings

### Backend Calculation Functions

Located in `backend/main2.py`:
- `calcular_portfolio_value()` - Market value calculation
- `calcular_cost_basis()` - FIFO-based cost calculation
- `calcular_realized_gains()` - FIFO-based realized gains
- `calcular_unrealized_gains()` - Portfolio Value - Cost Basis

## Important Behavioral Notes

### What Date Filtering DOES Show:
✅ Portfolio state as of the end date
✅ All operations from inception through end date
✅ Cumulative performance since you started investing
✅ What your portfolio looked like on that specific date

### What Date Filtering DOES NOT Show:
❌ Gains/losses that occurred only during the filtered period
❌ Performance metrics for just that time period
❌ Period-over-period comparisons
❌ Returns calculated for just the selected range

## Why This Methodology?

This approach is standard in financial applications because:

1. **Historical State Analysis:** Shows exactly how your portfolio performed up to a specific date
2. **Consistency:** Matches how brokers and trading platforms report portfolio status
3. **Accuracy:** Provides true portfolio state at any point in time
4. **Utility:** Useful for tracking portfolio growth and making historical comparisons

## Debug Information

The application includes comprehensive logging for verification:

```javascript
console.log('KPI Calculation:', {
  dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All dates',
  currentValue,
  totalInvested,
  profit,
  calculatedRealizedGains,
  calculatedUnrealizedGains,
  check: `Realized + Unrealized = ${realizedGains + unrealizedGains}, should equal profit = ${profit}`
});
```

## File Locations

- **Frontend KPI Logic:** `src/components/Dashboard/Sections/Overview/components/KPIGrid.jsx` (lines 281-455)
- **Backend Calculations:** `backend/main2.py` (calculation functions)
- **FIFO Processing:** `backend/main.py` (lines 381-456)

---

**Last Updated:** December 2024
**Version:** 1.0