// Utility functions for number formatting

/**
 * Formats numbers using European notation (, for decimals, . for thousands)
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} locale - Locale for formatting (default: 'de-DE' for EU format)
 * @returns {string} Formatted number string
 */
export const formatEuropeanNumber = (number, decimals = 2, locale = 'de-DE') => {
  if (isNaN(number) || number === null || number === undefined) {
    return '0,00';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Formats currency using European notation
 * @param {number} number - The number to format
 * @param {string} currency - Currency symbol (default: '€')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatEuropeanCurrency = (number, currency = '€', decimals = 2) => {
  const formattedNumber = formatEuropeanNumber(number, decimals);
  return `${formattedNumber}${currency}`;
};

/**
 * Formats percentage using European notation
 * @param {number} number - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export const formatEuropeanPercentage = (number, decimals = 2) => {
  const formattedNumber = formatEuropeanNumber(number, decimals);
  return `${formattedNumber}%`;
};

/**
 * Formats large numbers with appropriate scaling (K, M, B)
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted scaled number
 */
export const formatEuropeanScaled = (number, decimals = 1) => {
  if (Math.abs(number) >= 1e9) {
    return formatEuropeanNumber(number / 1e9, decimals) + 'B';
  } else if (Math.abs(number) >= 1e6) {
    return formatEuropeanNumber(number / 1e6, decimals) + 'M';
  } else if (Math.abs(number) >= 1e3) {
    return formatEuropeanNumber(number / 1e3, decimals) + 'K';
  }
  return formatEuropeanNumber(number, decimals);
};