import { describe, it, expect } from 'vitest';
import { freezeFq, recip } from '../src/poly/fq';
import { params } from '../src/params';

describe('fq module', () => {
  it('test_freeze function matches expected implementation', () => {
    function testFreeze(a: number): number {
      let b = a;
      const q = params.Q;
      const rq = 34069; // RQ_FREEZE for ntrup1277

      b -= q * Math.floor((228 * b) / Math.pow(2, 20));
      b -= q * Math.floor((rq * b + 134217728) / Math.pow(2, 28));

      return b;
    }

    for (let n = 0; n < 32767; n++) {
      const t1 = testFreeze(n);
      const t2 = freezeFq(n, params.Q12, params.Q);

      expect(t2).toEqual(t1);
    }
  });

  it('test_recip has expected properties', () => {
    expect(recip(42, params.Q12, params.Q)).toEqual(-recip(-42, params.Q12, params.Q));
    expect(recip(-42, params.Q12, params.Q)).toEqual(-recip(42, params.Q12, params.Q));
  });

  it('freeze handles a range of inputs correctly', () => {
    const testValues = [0, 1, -1, 100, -100, 2000, -2000, 8000, -8000];
    
    for (const val of testValues) {
      const result = freezeFq(val, params.Q12, params.Q);
      
      // Result should be in the range -Q12 to Q12
      expect(result).toBeGreaterThanOrEqual(-params.Q12);
      expect(result).toBeLessThanOrEqual(params.Q12);
      
      // Result should be equivalent to the input modulo Q
      // Fix: Use toEqual for modulo result to handle negative zero
      const modResult = Math.abs((result - val) % params.Q);
      expect(modResult).toEqual(0);
    }
  });

  it('recip produces valid reciprocals', () => {
    for (const testValue of [1, 2, 3, 42, 100, 1000]) {
      const recipValue = recip(testValue, params.Q12, params.Q);
      
      // Calculate (a * a^-1) mod Q - should be congruent to 1
      let product = (testValue * recipValue) % params.Q;
      // Normalize to positive
      if (product < 0) product += params.Q;
      
      expect(product).toBe(1);
    }
  });
});
