export const formatTime12Hour = (timeStr: string) => {
  if (!timeStr) return '';
  // If the string already contains AM/PM, just return it
  if (timeStr.toLowerCase().includes('m')) return timeStr;
  
  const [h, m] = timeStr.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${m} ${ampm}`;
};
