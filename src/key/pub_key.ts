import { ParamsConfig } from '../params';
import * as rqEncode from '../encode/rq';
import { R3 } from '../poly/r3';
import { Rq } from '../poly/rq';
import { ErrorType } from '../errors';
import { PrivKey } from './priv_key'; 


export class PubKey extends Rq {

    constructor(params: ParamsConfig, coeffs?: Int16Array) {
       super(params);
       if (coeffs) {
           if (coeffs.length !== params.P) {
               throw ErrorType.PolyError; 
           }
           this.coeffs = coeffs;
       }
    }

    static compute(f: Rq, g: R3, params: ParamsConfig): PubKey {
       try {
          const finv = f.recip(3, params);
          const h = finv.multR3(g, params);
          return new PubKey(params, h.coeffs); 
       } catch (e) {
          if (e === ErrorType.NoSolutionRecip3) {
              throw ErrorType.NoSolutionRecip3;
          } else {
              throw ErrorType.KemError; 
          }
       }
    }

    static fromSk(privKey: PrivKey, params: ParamsConfig): PubKey {
        try {
           const f_r3 = privKey.f;
           const ginv = privKey.ginv;
           const f = Rq.from(Int16Array.from(f_r3.coeffs), params); 
           const g = ginv.recip(params);
           const finv = f.recip(3, params);
           const h = finv.multR3(g, params);
           return new PubKey(params, h.coeffs);
        } catch (e) {
            if (e === ErrorType.R3NoSolutionRecip || e === ErrorType.NoSolutionRecip3) {
                throw e; 
            } else {
                throw ErrorType.KemError; 
            }
        }
   }

    static import(bytes: Uint8Array, params: ParamsConfig): PubKey {
      if (bytes.length !== params.PUBLICKEYS_BYTES) {
         throw ErrorType.ByteslengthError;
      }
      try {
          const decodedCoeffs = rqEncode.decode(bytes, params);
          return new PubKey(params, decodedCoeffs); 
      } catch (e) {
          throw ErrorType.KemError; 
      }
   }
}
