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
export const formatEuropeanCurrency = (number, currency = '€', decimals = 0) => {
  // Usar formateo escalado para números grandes, sin céntimos
  const formattedNumber = formatEuropeanScaled(number, decimals);
  return `${formattedNumber}${currency}`; // Sin espacio entre número y euro
};

/**
 * Formats percentage using European notation
 * @param {number} number - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export const formatEuropeanPercentage = (number, decimals = 1) => {
  const formattedNumber = formatEuropeanNumber(number, decimals);
  return `${formattedNumber}%`;
};

/**
 * Formats an asset price with adaptive decimal places based on magnitude.
 * Use this for unit prices (market price, avg cost), NOT for portfolio values.
 * @param {number} number - The price to format
 * @param {string} currency - Currency symbol (default: '€')
 * @returns {string} Formatted price string
 */
export const formatEuropeanPrice = (number, currency = '€') => {
  if (isNaN(number) || number === null || number === undefined || number === 0) {
    return `0${currency}`;
  }
  const abs = Math.abs(number);
  let decimals;
  if (abs >= 10000) decimals = 0;       // €85.234
  else if (abs >= 1)  decimals = 2;     // €4,52 / €2.400,50
  else if (abs >= 0.001) decimals = 4;  // €0,0820
  else decimals = 6;                    // €0,000021
  return `${formatEuropeanNumber(number, decimals)}${currency}`;
};

/**
 * Formats large numbers with appropriate scaling (K, M, B)
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted scaled number
 */
export const formatEuropeanScaled = (number, decimals = 0) => {
  const absNumber = Math.abs(number);
  
  // Para billones: siempre abreviar (números muy largos)
  if (absNumber >= 1e9) {
    return formatEuropeanNumber(number / 1e9, 1) + 'B';
  }
  
  // Para millones: abreviar solo si el número completo sería muy largo (>7 cifras)
  if (absNumber >= 1e7) { // 10 millones o más
    return formatEuropeanNumber(number / 1e6, 1) + 'M';
  }
  
  // Para miles: abreviar solo si el número completo sería muy largo (>5 cifras)
  if (absNumber >= 1e5) { // 100.000 o más
    return formatEuropeanNumber(number / 1e3, 0) + 'K'; // Sin decimal para miles
  }
  
  // Números menores: mostrar completos
  // 1.552€, 12.345€, 99.999€ se muestran enteros
  return formatEuropeanNumber(number, 0);
};