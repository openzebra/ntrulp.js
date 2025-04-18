import { params } from '../params';
import * as rqEncode from '../encode/rq';
import { R3 } from './r3';
import * as f3 from './f3';
import * as fq from './fq';
import { i16NonzeroMask, i16NegativeMask } from '../math';
import { ErrorType } from '../errors';

export class Rq {
  public coeffs: Int16Array;

  constructor() {
    this.coeffs = new Int16Array(params.P).fill(0);
  }

  static from(coeffs: Int16Array | number[]): Rq {
    const rq = new Rq();
    
    if (coeffs instanceof Int16Array) {
      rq.coeffs = coeffs;
    } else {
      rq.coeffs = new Int16Array(coeffs);
    }
    
    return rq;
  }

  eq_one(): boolean {
    for (let i = 1; i < this.coeffs.length; i++) {
      if (this.coeffs[i] !== 0) {
        return false;
      }
    }
    return this.coeffs[0] === 1;
  }

  eq_zero(): boolean {
    for (const c of this.coeffs) {
      if (c !== 0) {
        return false;
      }
    }
    return true;
  }

  mult_r3(gq: R3): Rq {
    const out = new Int16Array(params.P);
    const f = this.coeffs;
    const g = gq.coeffs;
    const fg = new Int16Array(params.P + params.P - 1);

    const quotient = (r: number, f: number, g: number): number => {
      const value = r + f * g;
      return fq.freeze(value, params.Q12, params.Q);
    };

    for (let i = 0; i < params.P; i++) {
      let result = 0;

      for (let j = 0; j <= i; j++) {
        result = quotient(result, f[j], g[i - j]);
      }

      fg[i] = result;
    }

    for (let i = params.P; i < params.P + params.P - 1; i++) {
      let result = 0;

      for (let j = i - params.P + 1; j < params.P; j++) {
        result = quotient(result, f[j], g[i - j]);
      }

      fg[i] = result;
    }

    for (let i = params.P + params.P - 2; i >= params.P; i--) {
      fg[i - params.P] = fq.freeze(fg[i - params.P] + fg[i], params.Q12, params.Q);
      fg[i - params.P + 1] = fq.freeze(fg[i - params.P + 1] + fg[i], params.Q12, params.Q);
    }

    out.set(fg.subarray(0, params.P));

    return Rq.from(out);
  }

  recip<T extends number>(ratio: T): Rq {
    const input = this.coeffs;
    const out = new Int16Array(params.P);
    const f = new Int16Array(params.P + 1);
    const g = new Int16Array(params.P + 1);
    const v = new Int16Array(params.P + 1);
    const r = new Int16Array(params.P + 1);
    let delta: number = 1;
    let swap: number;
    let t: number;
    let f0: number;
    let g0: number;

    const quotient = (out: Int16Array, f0: number, g0: number, fv: Int16Array) => {
      for (let i = 0; i < params.P + 1; i++) {
        const x = f0 * out[i] - g0 * fv[i];
        out[i] = fq.freeze(x, params.Q12, params.Q);
      }
    };

    r[0] = fq.recip(ratio, params.Q12, params.Q);
    f[0] = 1;
    f[params.P - 1] = -1;
    f[params.P] = -1;

    for (let i = 0; i < params.P; i++) {
      g[params.P - 1 - i] = input[i];
    }

    g[params.P] = 0;
    delta = 1;

    for (let _ = 0; _ < 2 * params.P - 1; _++) {
      for (let i = params.P; i >= 1; i--) {
        v[i] = v[i - 1];
      }
      v[0] = 0;

      swap = i16NegativeMask(-delta) & i16NonzeroMask(g[0]);
      delta ^= swap & (delta ^ -delta);
      delta += 1;

      for (let i = 0; i < params.P + 1; i++) {
        t = swap & (f[i] ^ g[i]);
        f[i] ^= t;
        g[i] ^= t;
        t = swap & (v[i] ^ r[i]);
        v[i] ^= t;
        r[i] ^= t;
      }

      f0 = f[0];
      g0 = g[0];

      quotient(g, f0, g0, f);
      quotient(r, f0, g0, v);

      for (let i = 0; i < params.P; i++) {
        g[i] = g[i + 1];
      }

      g[params.P] = 0;
    }

    const scale = fq.recip(f[0], params.Q12, params.Q);

    for (let i = 0; i < params.P; i++) {
      const x = scale * v[params.P - 1 - i];
      out[i] = fq.freeze(x, params.Q12, params.Q);
    }

    if (i16NonzeroMask(delta) === 0) {
      return Rq.from(out);
    } else {
      throw ErrorType.NoSolutionRecip3;
    }
  }

  mult_int(num: number): Rq {
    const out = new Int16Array(params.P);

    for (let i = 0; i < params.P; i++) {
      const x = num * this.coeffs[i];
      out[i] = fq.freeze(x, params.Q12, params.Q);
    }

    return Rq.from(out);
  }

  r3_from_rq(): R3 {
    const out = new Int8Array(params.P);

    for (let i = 0; i < params.P; i++) {
      out[i] = f3.freeze(this.coeffs[i]);
    }

    return R3.from(out);
  }

  to_bytes(): Uint8Array {
    return rqEncode.encode(this.coeffs);
  }
}
