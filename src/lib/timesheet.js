import { hoursToDays } from '@/lib/time'

// Logged hours in the timesheet display unit: hours, days, or the salary
// they represent at the person's daily rate.
export const convertHours = (hours, unit, organisation, dailyRate = 0) => {
  if (unit === 'hour') return hours
  const days = hoursToDays(organisation, hours)
  return unit === 'salary' ? days * dailyRate : days
}
