import { ParamsConfig } from '../params';
import { PrivKey } from '../key/priv_key';
import { PubKey } from '../key/pub_key';
import { Rq } from '../poly/rq';
import { R3 } from '../poly/r3';
import { round } from '../poly/f3';
import { weightWMask } from '../math';
import { r3Decode } from '../encode/r3';
import { decode as rqDecode } from '../encode/rq';
import { ErrorType } from '../errors';


export function rqDecrypt(c: Rq, privKey: PrivKey, params: ParamsConfig): R3 {
    const f = privKey.f;
    const ginv = privKey.ginv;
    const r_coeffs = new Int8Array(params.P);

    const cf = c.multR3(f, params);
    const cf3 = cf.multInt(3, params);
    const e = cf3.r3FromRq(params);
    const ev = e.mult(ginv, params);

    const mask: number = weightWMask(ev.coeffs, params.W);

    for (let i = 0; i < params.P; i++) {
       const coeff = ev.coeffs[i];
       if (i < params.W) {
           r_coeffs[i] = (((coeff ^ 1) & ~mask) ^ 1);
       } else {
           r_coeffs[i] = (coeff & ~mask);
       }
    }

    return R3.from(r_coeffs, params);
}


export function r3Encrypt(r: R3, pubKey: PubKey, params: ParamsConfig): Rq {
    const hr = pubKey.multR3(r, params);

    const coeffsAsNumbers = Array.from(hr.coeffs);
    round(coeffsAsNumbers);
    hr.coeffs = Int16Array.from(coeffsAsNumbers);

    return hr;
}


export function staticBytesEncrypt(bytes: Uint8Array, pubKey: PubKey, params: ParamsConfig): Uint8Array {
     if (bytes.length !== params.R3_BYTES) {
         throw ErrorType.ByteslengthError;
     }
     const r_coeffs = r3Decode(bytes, params);
     const r = R3.from(r_coeffs, params);
     const encryptedRq = r3Encrypt(r, pubKey, params);
     return encryptedRq.toBytes(params);
}


export function staticBytesDecrypt(cipherBytes: Uint8Array, privKey: PrivKey, params: ParamsConfig): Uint8Array {
     if (cipherBytes.length !== params.RQ_BYTES) {
          throw ErrorType.ByteslengthError;
     }
     const c_coeffs = rqDecode(cipherBytes, params);
     const c = Rq.from(c_coeffs, params);
     const decryptedR3 = rqDecrypt(c, privKey, params);

     return decryptedR3.toBytes(params);
}
