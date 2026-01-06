// Natural language date parser
// Supports phrases like: "tomorrow", "next week", "in 3 days", "next monday", etc.

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function parseNaturalDate(input: string): Date | null {
  if (!input) return null;

  const text = input.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Try to parse as ISO date first
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(text + 'T00:00:00');
  }

  // Today
  if (text === 'today' || text === 'tod') {
    return today;
  }

  // Tomorrow
  if (text === 'tomorrow' || text === 'tom' || text === 'tmr') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Yesterday
  if (text === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Next week
  if (text === 'next week' || text === 'nextweek') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  // Next month
  if (text === 'next month' || text === 'nextmonth') {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // In N days/weeks/months
  const inPattern = /^in\s+(\d+)\s+(day|days|week|weeks|month|months)$/;
  const inMatch = text.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2];
    const result = new Date(today);

    if (unit.startsWith('day')) {
      result.setDate(result.getDate() + amount);
    } else if (unit.startsWith('week')) {
      result.setDate(result.getDate() + amount * 7);
    } else if (unit.startsWith('month')) {
      result.setMonth(result.getMonth() + amount);
    }

    return result;
  }

  // N days/weeks/months from now
  const fromNowPattern = /^(\d+)\s+(day|days|week|weeks|month|months)(\s+from\s+now)?$/;
  const fromNowMatch = text.match(fromNowPattern);
  if (fromNowMatch) {
    const amount = parseInt(fromNowMatch[1]);
    const unit = fromNowMatch[2];
    const result = new Date(today);

    if (unit.startsWith('day')) {
      result.setDate(result.getDate() + amount);
    } else if (unit.startsWith('week')) {
      result.setDate(result.getDate() + amount * 7);
    } else if (unit.startsWith('month')) {
      result.setMonth(result.getMonth() + amount);
    }

    return result;
  }

  // Next [day of week]
  const nextDayPattern = /^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)$/;
  const nextDayMatch = text.match(nextDayPattern);
  if (nextDayMatch) {
    const dayName = nextDayMatch[1];
    let targetDay = DAYS_OF_WEEK.indexOf(dayName);
    if (targetDay === -1) {
      targetDay = SHORT_DAYS.indexOf(dayName);
    }

    if (targetDay !== -1) {
      const result = new Date(today);
      const currentDay = result.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      result.setDate(result.getDate() + daysUntil + 7); // Next week
      return result;
    }
  }

  // This [day of week] or just [day of week]
  const dayPattern = /^(this\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)$/;
  const dayMatch = text.match(dayPattern);
  if (dayMatch) {
    const dayName = dayMatch[2];
    let targetDay = DAYS_OF_WEEK.indexOf(dayName);
    if (targetDay === -1) {
      targetDay = SHORT_DAYS.indexOf(dayName);
    }

    if (targetDay !== -1) {
      const result = new Date(today);
      const currentDay = result.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0) daysUntil += 7;
      if (daysUntil === 0) daysUntil = 7; // If today, go to next week
      result.setDate(result.getDate() + daysUntil);
      return result;
    }
  }

  // End of week (Friday)
  if (text === 'end of week' || text === 'eow' || text === 'friday' || text === 'fri') {
    const result = new Date(today);
    const currentDay = result.getDay();
    let daysUntilFriday = 5 - currentDay;
    if (daysUntilFriday <= 0) daysUntilFriday += 7;
    result.setDate(result.getDate() + daysUntilFriday);
    return result;
  }

  // End of month
  if (text === 'end of month' || text === 'eom') {
    const result = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return result;
  }

  // End of year
  if (text === 'end of year' || text === 'eoy') {
    return new Date(today.getFullYear(), 11, 31);
  }

  // MM/DD or MM-DD format
  const mdPattern = /^(\d{1,2})[\/\-](\d{1,2})$/;
  const mdMatch = text.match(mdPattern);
  if (mdMatch) {
    const month = parseInt(mdMatch[1]) - 1;
    const day = parseInt(mdMatch[2]);
    let year = today.getFullYear();

    const result = new Date(year, month, day);
    // If the date is in the past, assume next year
    if (result < today) {
      result.setFullYear(year + 1);
    }
    return result;
  }

  // MM/DD/YYYY or MM-DD-YYYY format
  const mdyPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  const mdyMatch = text.match(mdyPattern);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1]) - 1;
    const day = parseInt(mdyMatch[2]);
    let year = parseInt(mdyMatch[3]);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  return null;
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getRelativeDateLabel(text: string): string | null {
  const date = parseNaturalDate(text);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 7) {
    const dayName = DAYS_OF_WEEK[date.getDay()];
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${diff} days)`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Common shortcuts for quick reference
export const DATE_SHORTCUTS = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Next Week', value: 'next week' },
  { label: 'Next Month', value: 'next month' },
  { label: 'End of Week', value: 'eow' },
  { label: 'End of Month', value: 'eom' },
];
