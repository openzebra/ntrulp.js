import { expect, describe, test } from 'vitest';
import { 
  randomRange3, 
  randomSmall, 
  shortRandom, 
} from '../src/rng';
import { params1277, params653, params761, ParamsConfig } from '../src/params';

function createSeededRng() {
  let seed = 42;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('random functions', () => {
  test('randomRange3 should return values between -1 and 1', () => {
    const rng = createSeededRng();
    
    for (let i = 0; i < 200; i++) {
      const value = randomRange3(rng);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  const testWithParams = (params: ParamsConfig) => {
    describe(`with params P=${params.P}`, () => {
      test(`randomSmall should return array with length P=${params.P} containing values -1, 0, 1`, () => {
        const rng = createSeededRng();
        
        for (let i = 0; i < 10; i++) {
          const result = randomSmall(rng, params);
          
          expect(result.length).toBe(params.P);
          
          const uniqueValues = new Set(result);
          expect(uniqueValues.has(-1)).toBe(true);
          expect(uniqueValues.has(0)).toBe(true);
          expect(uniqueValues.has(1)).toBe(true);
          
          for (const val of result) {
            expect(val).toBeGreaterThanOrEqual(-1);
            expect(val).toBeLessThanOrEqual(1);
          }
        }
      });

      test(`shortRandom should return valid array with sum of absolute values equal to W=${params.W}`, () => {
        const rng = createSeededRng();
        
        for (let i = 0; i < 10; i++) {
          const result = shortRandom(rng, params);
          
          expect(result.length).toBe(params.P);
          
          const uniqueValues = new Set(result);
          expect(uniqueValues.has(-1)).toBe(true);
          expect(uniqueValues.has(0)).toBe(true);
          expect(uniqueValues.has(1)).toBe(true);
          
          let sum = 0;
          for (const val of result) {
            sum += Math.abs(val);
          }
          
          expect(sum).toBe(params.W);
        }
      });
    });
  };

  // Test with multiple parameter sets
  testWithParams(params1277);
  testWithParams(params653);
  testWithParams(params761);
});
