import { describe, it, expect } from 'vitest';
import {
  i16NonzeroMask,
  i16NegativeMask,
  u32DivmodU14,
  i32DivmodU14,
  u32ModU14,
  i32ModU14,
  weightWMask
} from '../src/math';

describe('Math functions', () => {
  it('i32DivmodU14 should match expected behavior', () => {
    expect(i32DivmodU14(100, 30)).toEqual([3, 10]);
    expect(i32DivmodU14(-100, 30)[0]).toBe(4294967292);
    expect(i32DivmodU14(-100, 30)[1]).toBe(20);
  });

  it('u32DivmodU14 should match expected behavior', () => {
    expect(u32DivmodU14(100, 30)).toEqual([3, 10]);
    expect(u32DivmodU14(223, 300)).toEqual([0, 223]);
    
    const [q, r] = u32DivmodU14(0x80000000, 3000);
    expect(q).toBe(715827);
    expect(r).toBe(2648);
  });

  it('i16NonzeroMask should match expected behavior', () => {
    expect(i16NonzeroMask(0)).toBe(0);
    expect(i16NonzeroMask(42)).toBe(-1);
    expect(i16NonzeroMask(-42)).toBe(-1);
    expect(i16NonzeroMask(-32768)).toBe(-1);
    expect(i16NonzeroMask(32767)).toBe(-1);
    expect(i16NonzeroMask(33)).toBe(-1);
    expect(i16NonzeroMask(-33)).toBe(-1);
    expect(i16NonzeroMask(28)).toBe(-1);
    expect(i16NonzeroMask(-28)).toBe(-1);
    expect(i16NonzeroMask(12345)).toBe(-1);
    expect(i16NonzeroMask(-12345)).toBe(-1);
  });

  it('weightWMask should match expected behavior', () => {
    const P = 761;
    const W = 286;
    
    // All zeros
    const zeros = new Int8Array(P).fill(0);
    expect(weightWMask(zeros, W)).toBe(-1);
    
    // Exactly W ones
    const ones = new Int8Array(P).fill(0);
    for (let i = 0; i < W; i++) {
      ones[i] = 1;
    }
    expect(weightWMask(ones, W)).toBe(0);
    
    // W-1 ones
    const almostW = new Int8Array(P).fill(0);
    for (let i = 0; i < W-1; i++) {
      almostW[i] = 1;
    }
    expect(weightWMask(almostW, W)).toBe(-1);
  });
});
