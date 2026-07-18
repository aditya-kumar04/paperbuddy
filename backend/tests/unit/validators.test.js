import { describe, it, expect } from 'vitest';
import { isValidEmail, getPasswordError, generateTempPassword } from '../../src/utils/validators.js';

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('first.last@school.edu.in')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(12345)).toBe(false);
  });
});

describe('getPasswordError', () => {
  it('accepts a password with 8+ chars, a letter, and a number', () => {
    expect(getPasswordError('Passw0rd')).toBeNull();
    expect(getPasswordError('abcdefg1')).toBeNull();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(getPasswordError('Ab1')).toMatch(/at least 8 characters/i);
  });

  it('rejects passwords missing a number', () => {
    expect(getPasswordError('abcdefgh')).toMatch(/letter and one number/i);
  });

  it('rejects passwords missing a letter', () => {
    expect(getPasswordError('12345678')).toMatch(/letter and one number/i);
  });

  it('rejects non-string input', () => {
    expect(getPasswordError(undefined)).toMatch(/at least 8 characters/i);
  });
});

describe('generateTempPassword', () => {
  it('generates a password of the requested length', () => {
    expect(generateTempPassword(12)).toHaveLength(12);
    expect(generateTempPassword()).toHaveLength(10); // default
  });

  it('never includes visually ambiguous characters (0/1/O/o/I/i/L/l)', () => {
    for (let i = 0; i < 25; i++) {
      const pw = generateTempPassword(20);
      expect(pw).not.toMatch(/[01OoIiLl]/);
    }
  });

  it('generates different passwords on each call', () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });
});
