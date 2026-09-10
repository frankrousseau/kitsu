// Whole amounts grouped by thousands. The grouping follows the clock
// preference rather than the UI language: an English UI does not make its
// reader American. 12-hour clock: "1,200"; 24-hour clock: "1 200" (ISO
// grouping, narrow no-break space).
export const formatAmount = (value, use12HourClock = false) =>
  Math.round(value).toLocaleString(use12HourClock ? 'en-US' : 'fr-FR')
