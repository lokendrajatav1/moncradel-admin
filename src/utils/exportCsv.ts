/**
 * Converts an array of objects into a CSV string.
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create rows
  const rows = data.map(row => {
    return headers.map(fieldName => {
      let value = row[fieldName];
      
      // Handle nested objects or arrays by stringifying them
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Escape quotes and wrap in quotes if there's a comma, quote or newline
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a browser download of the provided data as a CSV file.
 * 
 * @param data Array of objects to export
 * @param filename Name of the file (without .csv extension)
 */
export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data provided to export.");
    return;
  }
  
  const csvStr = convertToCSV(data);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
