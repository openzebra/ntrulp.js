import { describe, it, expect } from 'vitest';
import {
  i16NonzeroMask,
  i16NegativeMask,
  u32DivmodU14,
  i32DivmodU14,
  u32ModU14,
  i32ModU14,
  weightWMask
} from '../'; 

describe('Math functions', () => {

  // --- i16NonzeroMask ---
  it('i16NonzeroMask should handle various inputs', () => {
    // Existing tests
    expect(i16NonzeroMask(0)).toBe(0);
    expect(i16NonzeroMask(42)).toBe(-1);
    expect(i16NonzeroMask(-42)).toBe(-1); // Lower 16 bits are 0xFFD6 (non-zero)
    expect(i16NonzeroMask(-32768)).toBe(-1); // Lower 16 bits are 0x8000 (non-zero)
    expect(i16NonzeroMask(32767)).toBe(-1); // Lower 16 bits are 0x7FFF (non-zero)
    expect(i16NonzeroMask(33)).toBe(-1);
    expect(i16NonzeroMask(-33)).toBe(-1); // Lower 16 bits are 0xFFDF (non-zero)
    expect(i16NonzeroMask(28)).toBe(-1);
    expect(i16NonzeroMask(-28)).toBe(-1); // Lower 16 bits are 0xFFE4 (non-zero)
    expect(i16NonzeroMask(12345)).toBe(-1);
    expect(i16NonzeroMask(-12345)).toBe(-1); // Lower 16 bits are 0xCFC7 (non-zero)

    // Additional tests
    expect(i16NonzeroMask(1)).toBe(-1);
    expect(i16NonzeroMask(-1)).toBe(-1); // Lower 16 bits are 0xFFFF (non-zero)
    expect(i16NonzeroMask(65535)).toBe(-1); // 0xFFFF (non-zero)
    expect(i16NonzeroMask(65536)).toBe(0); // 0x10000, lower 16 bits are 0
    expect(i16NonzeroMask(-65536)).toBe(0); // Lower 16 bits are 0
    expect(i16NonzeroMask(0xABCDE)).toBe(-1); // Lower 16 bits are 0xBCDE (non-zero)
  });

  // --- i16NegativeMask ---
  it('i16NegativeMask should identify numbers >= 0x8000 in lower 16 bits', () => {
    expect(i16NegativeMask(0)).toBe(0);          // 0x0000 < 0x8000
    expect(i16NegativeMask(1)).toBe(0);          // 0x0001 < 0x8000
    expect(i16NegativeMask(32767)).toBe(0);     // 0x7FFF < 0x8000
    expect(i16NegativeMask(32768)).toBe(-1);    // 0x8000 >= 0x8000
    expect(i16NegativeMask(65535)).toBe(-1);    // 0xFFFF >= 0x8000
    expect(i16NegativeMask(-1)).toBe(-1);       // Lower 16 bits 0xFFFF >= 0x8000
    expect(i16NegativeMask(-32768)).toBe(-1);   // Lower 16 bits 0x8000 >= 0x8000
    expect(i16NegativeMask(-32769)).toBe(0);    // Lower 16 bits 0x7FFF < 0x8000
    expect(i16NegativeMask(0x18000)).toBe(-1);  // Lower 16 bits 0x8000 >= 0x8000
    expect(i16NegativeMask(0x17FFF)).toBe(0);   // Lower 16 bits 0x7FFF < 0x8000
    expect(i16NegativeMask(0xFFF8000)).toBe(-1); // Lower 16 bits 0x8000 >= 0x8000
  });

  // --- u32DivmodU14 ---
  it('u32DivmodU14 should perform unsigned division and modulo', () => {
    // Existing tests
    expect(u32DivmodU14(100, 30)).toEqual([3, 10]);
    expect(u32DivmodU14(223, 300)).toEqual([0, 223]);
    const [q, r] = u32DivmodU14(0x80000000, 3000); // 2147483648 / 3000
    expect(q).toBe(715827); // 2147483648 / 3000 = 715827.88...
    expect(r).toBe(2648);  // 2147483648 - 715827 * 3000 = 2147483648 - 2147481000 = 2648
    
    // Additional tests
    expect(u32DivmodU14(0, 30)).toEqual([0, 0]); // x = 0
    expect(u32DivmodU14(100, 1)).toEqual([100, 0]); // m = 1
    expect(u32DivmodU14(42, 42)).toEqual([1, 0]); // x = m
    expect(u32DivmodU14(41, 42)).toEqual([0, 41]); // x < m
    expect(u32DivmodU14(84, 42)).toEqual([2, 0]); // x = 2m
    expect(u32DivmodU14(0xFFFFFFFF, 10)).toEqual([429496729, 5]); // Max uint32
  });

  // --- i32DivmodU14 ---
  it('i32DivmodU14 should perform signed division and modulo', () => {
    // Existing tests
    expect(i32DivmodU14(100, 30)).toEqual([3, 10]); // 100 = 3 * 30 + 10
    expect(i32DivmodU14(-100, 30)).toEqual([-4 >>> 0, 20]); // -100 = -4 * 30 + 20. -4 is 0xFFFFFFFC
    expect(i32DivmodU14(-100, 30)[0]).toBe(4294967292); // Check unsigned value explicitly
    expect(i32DivmodU14(-100, 30)[1]).toBe(20);

    // Additional tests
    expect(i32DivmodU14(0, 30)).toEqual([0, 0]); // x = 0
    expect(i32DivmodU14(42, 1)).toEqual([42, 0]); // m = 1, positive x
    expect(i32DivmodU14(-42, 1)).toEqual([-42 >>> 0, 0]); // m = 1, negative x. -42 is 0xFFFFFFD6
    expect(i32DivmodU14(-42, 1)[0]).toBe(4294967254);
    expect(i32DivmodU14(-1, 30)).toEqual([-1 >>> 0, 29]); // -1 = -1 * 30 + 29. -1 is 0xFFFFFFFF
    expect(i32DivmodU14(-1, 30)[0]).toBe(4294967295);
    expect(i32DivmodU14(-30, 30)).toEqual([-1 >>> 0, 0]); // -30 = -1 * 30 + 0
    expect(i32DivmodU14(-31, 30)).toEqual([-2 >>> 0, 29]); // -31 = -2 * 30 + 29. -2 is 0xFFFFFFFE
    expect(i32DivmodU14(0x7FFFFFFF, 10)).toEqual([214748364, 7]); // Max int32. 2147483647 = 214748364 * 10 + 7
    expect(i32DivmodU14(-2147483648, 10)).toEqual([-214748365 >>> 0, 2]); // Min int32. -2147483648 = -214748365 * 10 + 2
    // -214748365 is 0xF3333333
    expect(i32DivmodU14(-2147483648, 10)[0]).toBe(4080218931); // Check unsigned value explicitly
  });

  // --- u32ModU14 ---
  it('u32ModU14 should return unsigned remainder', () => {
    expect(u32ModU14(100, 30)).toBe(10);
    expect(u32ModU14(223, 300)).toBe(223);
    expect(u32ModU14(0, 30)).toBe(0);
    expect(u32ModU14(84, 42)).toBe(0);
    expect(u32ModU14(0xFFFFFFFF, 10)).toBe(5);
    expect(u32ModU14(0x80000000, 3000)).toBe(2648);
  });

  // --- i32ModU14 ---
  it('i32ModU14 should return signed remainder (always non-negative)', () => {
    expect(i32ModU14(100, 30)).toBe(10);
    expect(i32ModU14(-100, 30)).toBe(20);
    expect(i32ModU14(0, 30)).toBe(0);
    expect(i32ModU14(-1, 30)).toBe(29);
    expect(i32ModU14(-30, 30)).toBe(0);
    expect(i32ModU14(-2147483648, 10)).toBe(2);
    expect(i32ModU14(0x7FFFFFFF, 10)).toBe(7);
  });

  // --- weightWMask ---
  it('weightWMask should check Hamming weight against W', () => {
    const P = 761; // Example size, could be anything
    const W = 286; // Example weight target

    // Existing tests
    // All zeros -> weight 0
    const zeros = new Int8Array(P).fill(0);
    expect(weightWMask(zeros, W)).toBe(-1); // weight 0 != W (286) -> -1
    expect(weightWMask(zeros, 0)).toBe(0);  // weight 0 == W (0) -> 0

    // Exactly W ones -> weight W
    const ones = new Int8Array(P).fill(0);
    for (let i = 0; i < W; i++) {
      ones[i] = 1;
    }
    expect(weightWMask(ones, W)).toBe(0); // weight W == W -> 0

    // W-1 ones -> weight W-1
    const almostW = new Int8Array(P).fill(0);
    for (let i = 0; i < W - 1; i++) {
      almostW[i] = 1;
    }
    expect(weightWMask(almostW, W)).toBe(-1); // weight W-1 != W -> -1

    // Additional tests
    // Empty array -> weight 0
    const empty = new Int8Array(0);
    expect(weightWMask(empty, 0)).toBe(0);  // weight 0 == W (0) -> 0
    expect(weightWMask(empty, 1)).toBe(-1); // weight 0 != W (1) -> -1

    // Array with mixed positive/negative/even/odd numbers
    // r = [-1, -2, -3, 4, 5, 7]
    // & 1: [ 1,  0,  1, 0, 1, 1] -> sum = 4
    const mixed = new Int8Array([-1, -2, -3, 4, 5, 7]);
    expect(weightWMask(mixed, 4)).toBe(0);  // weight 4 == W (4) -> 0
    expect(weightWMask(mixed, 3)).toBe(-1); // weight 4 != W (3) -> -1
    expect(weightWMask(mixed, 5)).toBe(-1); // weight 4 != W (5) -> -1

    // W+1 ones -> weight W+1
    const overW = new Int8Array(P).fill(0);
    for (let i = 0; i < W + 1; i++) {
        // Ensure we don't exceed array bounds if P is small, though unlikely here
        if (i < P) overW[i] = 1;
    }
    // Check if W+1 exceeds P, adjust expectation if needed
    const expectedWeight = Math.min(W + 1, P);
    if (expectedWeight === W) {
        expect(weightWMask(overW, W)).toBe(0);
    } else {
        expect(weightWMask(overW, W)).toBe(-1); // weight W+1 != W -> -1
    }

  });
});
