import { ParamsConfig } from '../params';
import * as f3 from './f3';
import * as fq from './fq';
import { r3Encode } from '../encode/r3';
import { Rq } from './rq';
import { ErrorType } from '../errors';
import { i16NonzeroMask, i16NegativeMask } from '../math';

export class R3 {
  public coeffs: Int8Array;

  constructor(params: ParamsConfig) {
    this.coeffs = new Int8Array(params.P).fill(0);
  }

  static from(coeffs: Int8Array | number[], params: ParamsConfig): R3 {
    const r3 = new R3(params);
    
    if (coeffs instanceof Int8Array) {
      r3.coeffs = coeffs;
    } else {
      r3.coeffs = new Int8Array(coeffs);
    }
    
    return r3;
  }

  eq_zero(): boolean {
    for (const c of this.coeffs) {
      if (c !== 0) {
        return false;
      }
    }
    return true;
  }

  mult(g3: R3, params: ParamsConfig): R3 {
    const f = this.coeffs;
    const g = g3.coeffs;
    const out = new Int8Array(params.P);
    const fg = new Int8Array(params.P + params.P - 1);

    const quotient = (r: number, f: number, g: number): number => {
      const x = r + f * g;
      return f3.freeze(x);
    };

    for (let i = 0; i < params.P; i++) {
      let r = 0;
      for (let j = 0; j <= i; j++) {
        r = quotient(r, f[j], g[i - j]);
      }
      fg[i] = r;
    }

    for (let i = params.P; i < params.P + params.P - 1; i++) {
      let r = 0;
      for (let j = i - params.P + 1; j < params.P; j++) {
        r = quotient(r, f[j], g[i - j]);
      }
      fg[i] = r;
    }

    for (let i = params.P + params.P - 2; i >= params.P; i--) {
      const x0 = fg[i - params.P] + fg[i];
      const x1 = fg[i - params.P + 1] + fg[i];

      fg[i - params.P] = f3.freeze(x0);
      fg[i - params.P + 1] = f3.freeze(x1);
    }

    for (let i = 0; i < params.P; i++) {
      out[i] = fg[i];
    }
    
    return R3.from(out,params);
  }

  eq_one(): boolean {
    for (let i = 1; i < this.coeffs.length; i++) {
      if (this.coeffs[i] !== 0) {
        return false;
      }
    }
    return this.coeffs[0] === 1;
  }

  recip(params: ParamsConfig): R3 {
    const input = this.coeffs;
    const out = new Int8Array(params.P);
    const f = new Int8Array(params.P + 1);
    const g = new Int8Array(params.P + 1);
    const v = new Int8Array(params.P + 1);
    const r = new Int8Array(params.P + 1);
    let delta = 1;
    let sign: number;
    let swap: number;
    let t: number;

    const quotient = (g: number, sign: number, f: number): number => {
      const x = g + sign * f;
      return f3.freeze(x);
    };

    r[0] = 1;

    f[0] = 1;
    f[params.P - 1] = -1;
    f[params.P] = -1;

    for (let i = 0; i < params.P; i++) {
      g[params.P - 1 - i] = input[i];
    }

    g[params.P] = 0;

    for (let _ = 0; _ < 2 * params.P - 1; _++) {
      for (let i = params.P; i >= 1; i--) {
        v[i] = v[i - 1];
      }
      v[0] = 0;

      sign = -g[0] * f[0];
      swap = (i16NegativeMask(-delta) & i16NonzeroMask(g[0]));
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

      for (let i = 0; i < params.P + 1; i++) {
        g[i] = quotient(g[i], sign, f[i]);
      }
      for (let i = 0; i < params.P + 1; i++) {
        r[i] = quotient(r[i], sign, v[i]);
      }

      for (let i = 0; i < params.P; i++) {
        g[i] = g[i + 1];
      }
      g[params.P] = 0;
    }

    sign = f[0];
    for (let i = 0; i < params.P; i++) {
      out[i] = sign * v[params.P - 1 - i];
    }

    if (i16NonzeroMask(delta) === 0) {
      return R3.from(out, params);
    } else {
      throw ErrorType.R3NoSolutionRecip;
    }
  }

  rq_from_r3(params: ParamsConfig): Rq {
    const out = new Int16Array(params.P);

    for (let i = 0; i < params.P; i++) {
      out[i] = fq.freeze(this.coeffs[i], params.Q12, params.Q);
    }

    return Rq.from(out, params);
  }

  to_bytes(params: ParamsConfig): Uint8Array {
    return r3Encode(this.coeffs, params);
  }
}
