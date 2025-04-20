import { describe, it, expect, vi } from 'vitest';
import { Rq } from '../src/poly/rq';
import { R3 } from '../src/poly/r3';
import { shortRandom } from '../src/rng';
import { params } from '../src/params';

describe('Rq', () => {
  it('should initialize with zero coefficients', () => {
    const rq = new Rq(params);
    expect(rq.coeffs).toEqual(new Int16Array(params.P).fill(0));
  });

  it('should create Rq from Int16Array', () => {
    const coeffs = new Int16Array([1, 2, 3]);
    const rq = Rq.from(coeffs, { ...params, P: 3 });
    expect(rq.coeffs).toEqual(coeffs);
  });

  it('should create Rq from number array', () => {
    const coeffs = [1, 2, 3];
    const rq = Rq.from(coeffs, { ...params, P: 3 });
    expect(rq.coeffs).toEqual(new Int16Array(coeffs));
  });

  it('should return true for eqOne when coeffs[0] = 1 and others are 0', () => {
    const rq = new Rq(params);
    rq.coeffs[0] = 1;
    expect(rq.eqOne()).toBe(true);
  });

  it('should return false for eqOne when coeffs[0] != 1', () => {
    const rq = new Rq(params);
    rq.coeffs[0] = 2;
    expect(rq.eqOne()).toBe(false);
  });

  it('should return false for eqOne when any non-zero coeff after index 0', () => {
    const rq = new Rq(params);
    rq.coeffs[0] = 1;
    rq.coeffs[1] = 1;
    expect(rq.eqOne()).toBe(false);
  });

  it('should return true for eqZero when all coeffs are 0', () => {
    const rq = new Rq(params);
    expect(rq.eqZero()).toBe(true);
  });

  it('should return false for eqZero when any coeff is non-zero', () => {
    const rq = new Rq(params);
    rq.coeffs[1] = 1;
    expect(rq.eqZero()).toBe(false);
  });

  it('should multiply by integer correctly', () => {
    const rq = new Rq({ ...params, P: 3 });
    rq.coeffs.set([1, 1, 1]);
    const result = rq.multInt(3, { ...params, P: 3 });
    expect(result.coeffs).toEqual(new Int16Array([3, 3, 3]));
  });

  it('should convert to R3 correctly', () => {
    const rq = new Rq({ ...params, P: 3 });
    rq.coeffs.set([1, -1, 0]);
    const r3 = rq.r3FromRq({ ...params, P: 3 });
    expect(r3.coeffs).toEqual(new Int8Array([1, -1, 0]));
  });

  it('should compute multiplicative inverse correctly', () => {
    const rq = new Rq({ ...params, P: 3 });
    rq.coeffs.set([1, 0, 0]);
    const inverse = rq.recip(1, { ...params, P: 3 });
    const product = inverse.multR3(rq.r3FromRq({ ...params, P: 3 }), { ...params, P: 3 });
    expect(product.eqOne()).toBe(true);
  });

  it('should throw NoSolutionRecip3 for non-invertible polynomial', () => {
    const rq = new Rq({ ...params, P: 3 });
    rq.coeffs.set([0, 0, 0]);
    expect(() => rq.recip(1, { ...params, P: 3 })).toThrow();
  });

  it('should multiply with R3 correctly', () => {
    const rq = new Rq({ ...params, P: 3 });
    const r3 = new R3({ ...params, P: 3 });
    rq.coeffs.set([1, 0, 0]);
    r3.coeffs.set([1, 0, 0]);
    const result = rq.multR3(r3, { ...params, P: 3 });
    expect(result.coeffs).toEqual(new Int16Array([1, 0, 0]));
  });

  it('should multiply by random integer correctly', () => {
    const bytes = new Uint8Array([0, 0, Math.floor(Math.random() * 256), 0, 0]);
    const num = bytes[2];
    const rq = Rq.from(new Int16Array(params.P).fill(1), params);
    const out = rq.multInt(num, params);
    for (let i = 0; i < params.P; i++) {
      expect(out.coeffs[i]).toBe(num);
    }
  });

  it('should compute reciprocal with short random polynomial', () => {
    const getRandomValue = vi.fn().mockReturnValue(Math.random());
    const coeffs = shortRandom(getRandomValue, params);
    const rq = Rq.from(coeffs, params);
    const out = rq.recip(1, params);
    const h = out.multR3(rq.r3FromRq(params), params);
    expect(h.eqOne()).toBe(true);
  });
});
