import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseNaturalDate, formatDateForInput, getRelativeDateLabel } from './dateParser';

describe('dateParser', () => {
  beforeEach(() => {
    // Mock current date to 2026-01-06 (a Tuesday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-06T12:00:00'));
  });

  describe('parseNaturalDate', () => {
    it('should return null for empty input', () => {
      expect(parseNaturalDate('')).toBeNull();
      expect(parseNaturalDate('   ')).toBeNull();
    });

    it('should parse ISO date format', () => {
      const result = parseNaturalDate('2026-03-15');
      expect(result).toBeInstanceOf(Date);
      expect(formatDateForInput(result!)).toBe('2026-03-15');
    });

    it('should parse "today"', () => {
      const result = parseNaturalDate('today');
      expect(formatDateForInput(result!)).toBe('2026-01-06');
    });

    it('should parse "tomorrow"', () => {
      const result = parseNaturalDate('tomorrow');
      expect(formatDateForInput(result!)).toBe('2026-01-07');
    });

    it('should parse "tmr" shorthand', () => {
      const result = parseNaturalDate('tmr');
      expect(formatDateForInput(result!)).toBe('2026-01-07');
    });

    it('should parse "yesterday"', () => {
      const result = parseNaturalDate('yesterday');
      expect(formatDateForInput(result!)).toBe('2026-01-05');
    });

    it('should parse "next week"', () => {
      const result = parseNaturalDate('next week');
      expect(formatDateForInput(result!)).toBe('2026-01-13');
    });

    it('should parse "next month"', () => {
      const result = parseNaturalDate('next month');
      expect(formatDateForInput(result!)).toBe('2026-02-06');
    });

    it('should parse "in 3 days"', () => {
      const result = parseNaturalDate('in 3 days');
      expect(formatDateForInput(result!)).toBe('2026-01-09');
    });

    it('should parse "in 2 weeks"', () => {
      const result = parseNaturalDate('in 2 weeks');
      expect(formatDateForInput(result!)).toBe('2026-01-20');
    });

    it('should parse "in 1 month"', () => {
      const result = parseNaturalDate('in 1 month');
      expect(formatDateForInput(result!)).toBe('2026-02-06');
    });

    it('should parse "5 days from now"', () => {
      const result = parseNaturalDate('5 days from now');
      expect(formatDateForInput(result!)).toBe('2026-01-11');
    });

    it('should parse "friday" as next Friday', () => {
      // Current day is Tuesday (Jan 6), next Friday is Jan 9
      const result = parseNaturalDate('friday');
      expect(formatDateForInput(result!)).toBe('2026-01-09');
    });

    it('should parse "next monday"', () => {
      // Current day is Tuesday (Jan 6), "next monday" goes to next week's Monday (Jan 19)
      // because it adds 7 days to skip to the following week
      const result = parseNaturalDate('next monday');
      expect(formatDateForInput(result!)).toBe('2026-01-19');
    });

    it('should parse "end of week" as Friday', () => {
      const result = parseNaturalDate('eow');
      expect(formatDateForInput(result!)).toBe('2026-01-09');
    });

    it('should parse "end of month"', () => {
      const result = parseNaturalDate('eom');
      expect(formatDateForInput(result!)).toBe('2026-01-31');
    });

    it('should parse "end of year"', () => {
      const result = parseNaturalDate('eoy');
      expect(formatDateForInput(result!)).toBe('2026-12-31');
    });

    it('should parse MM/DD format', () => {
      // Future date in current year
      const result = parseNaturalDate('03/15');
      expect(formatDateForInput(result!)).toBe('2026-03-15');
    });

    it('should parse MM-DD format', () => {
      const result = parseNaturalDate('12-25');
      expect(formatDateForInput(result!)).toBe('2026-12-25');
    });

    it('should parse MM/DD/YYYY format', () => {
      const result = parseNaturalDate('06/15/2027');
      expect(formatDateForInput(result!)).toBe('2027-06-15');
    });

    it('should return null for invalid input', () => {
      expect(parseNaturalDate('invalid')).toBeNull();
      expect(parseNaturalDate('not a date')).toBeNull();
    });
  });

  describe('getRelativeDateLabel', () => {
    it('should return "Today" for today', () => {
      expect(getRelativeDateLabel('today')).toBe('Today');
    });

    it('should return "Tomorrow" for tomorrow', () => {
      expect(getRelativeDateLabel('tomorrow')).toBe('Tomorrow');
    });

    it('should return day name for near future dates', () => {
      const label = getRelativeDateLabel('in 3 days');
      expect(label).toContain('Friday');
      expect(label).toContain('3 days');
    });

    it('should return null for invalid input', () => {
      expect(getRelativeDateLabel('invalid')).toBeNull();
    });
  });
});
