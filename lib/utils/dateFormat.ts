/**
 * Formats a date in the format "dd MMM yyyy HH:mm:ss"
 * Example: "23 May 2025 23:55:32"
 */
export function formatDate(date: Date | number): string {
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  
  // Array of month names
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = months[d.getMonth()];
  
  const year = d.getFullYear();
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}