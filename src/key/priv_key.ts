import { ParamsConfig } from '../params';
import { R3 } from '../poly/r3';
import { Rq } from '../poly/rq';
import { ErrorType } from '../errors';
import { r3Decode } from '../encode/r3';

export class PrivKey {
  public f: R3;
  public ginv: R3;

  constructor(f: R3, ginv: R3) {
    this.f = f;
    this.ginv = ginv;
  }

  static compute(f: Rq, g: R3, params: ParamsConfig): PrivKey {
    try {
      const ginv = g.recip(params);
      const f_r3 = f.r3FromRq(params);
      return new PrivKey(f_r3, ginv);
    } catch (e) {
      if (e === ErrorType.R3NoSolutionRecip) {
        throw ErrorType.R3NoSolutionRecip; 
      } else {
        throw ErrorType.KemError; 
      }
    }
  }

  to_bytes(params: ParamsConfig): Uint8Array {
    const sk = new Uint8Array(params.SECRETKEYS_BYTES);
    const ginvBytes = this.ginv.to_bytes(params);
    const fBytes = this.f.to_bytes(params);

    if (ginvBytes.length !== params.R3_BYTES || fBytes.length !== params.R3_BYTES) {
      throw ErrorType.PolyError; 
    }

    sk.set(ginvBytes, 0);
    sk.set(fBytes, params.R3_BYTES);

    return sk;
  }

  static import(skBytes: Uint8Array, params: ParamsConfig): PrivKey {
    if (skBytes.length !== params.SECRETKEYS_BYTES) {
      throw ErrorType.ByteslengthError; 
    }

    let ginvBytes: Uint8Array;
    let fBytes: Uint8Array;

    try {
      ginvBytes = skBytes.subarray(0, params.R3_BYTES);
      fBytes = skBytes.subarray(params.R3_BYTES); 
    } catch (e) {
       throw ErrorType.KemError;
    }
    
    if (ginvBytes.length !== params.R3_BYTES) throw ErrorType.InvalidR3GInvrBytes;
    if (fBytes.length !== params.R3_BYTES) throw ErrorType.InvalidR3FBytes;


    const ginvCoeffs = r3Decode(ginvBytes, params);
    const fCoeffs = r3Decode(fBytes, params);

    const ginv = R3.from(ginvCoeffs, params);
    const f = R3.from(fCoeffs, params);

    return new PrivKey(f, ginv);
  }
}
