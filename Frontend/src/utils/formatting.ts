import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(
  date: string | Date,
  formatString = 'MMM dd, yyyy'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}


/**
 * Format a date to show relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format area in hectares with appropriate unit
 */
export function formatArea(hectares: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const acres = hectares * 2.47105;
    return `${acres.toFixed(2)} acres`;
  }
  return `${hectares.toFixed(2)} ha`;
}
export function formatHectares(value: number | undefined | null): string {
  // Handle undefined/null values
  if (value === undefined || value === null || isNaN(value)) {
    return "0.0";
  }
  
  if (value >= 1e12) return (value / 1e12).toFixed(1) + "Tri";
  if (value >= 1e9)  return (value / 1e9).toFixed(1) + "Bil";
  if (value >= 1e6)  return (value / 1e6).toFixed(1) + "Mil";
  if (value >= 1e3)  return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(1);
}

/**
 * Format temperature with unit
 */
export function formatTemperature(celsius: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}