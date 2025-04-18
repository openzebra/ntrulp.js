import { expect, describe, test } from 'vitest';
import { freeze, round } from '../src/poly/f3';


describe('F3 Functions', () => {
  test('freeze function should match reference implementation', () => {
    function testFreeze(a: number): number {
      const b = a - (3 * Math.floor((10923 * a) / 32768));
      const c = b - (3 * Math.floor((89478485 * b + 134217728) / 268435456));
      return c;
    }
    
    for (let i = 0; i < 1000; i++) {
      const r = Math.floor(Math.random() * 65536) - 32768;
      
      const t1 = testFreeze(r);
      const t2 = freeze(r);
      
      expect(t2).toBe(t1);
    }
  });
  
  test('round function should match expected behavior for ntrup761', () => {
    const P = 761;
    
    const rqCoeffs = new Array(P).fill(1);
    
    function round3(h: number[]): void {
      const f = [...h];
      for (let i = 0; i < 761; i++) {
        const inner = 21846 * (f[i] + 2295);
        h[i] = (Math.floor((inner + 32768) / 65536) * 3 - 2295);
      }
    }
    
    const originalArray = [...rqCoeffs];
    const newRoundArray = [...rqCoeffs];
    
    round3(originalArray);
    round(newRoundArray);
    
    expect(newRoundArray).toEqual(originalArray);
  });
});

