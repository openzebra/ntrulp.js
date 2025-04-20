import { describe, it, expect } from 'vitest';
import { 
    rqDecrypt, 
    r3Encrypt, 
    staticBytesEncrypt, 
    staticBytesDecrypt, 
    generateKeyPair
} from '../src/ntru/cipher';
import { Rq } from '../src/poly/rq';
import { shortRandom } from '../src/rng';
import { params } from '../src/params';
import { ErrorType } from '../src/errors';


describe('Cipher Functions', () => {

    it('test_encrypt_and_decrypt: should encrypt R3 and decrypt Rq correctly', () => {
        const rng = Math.random;
        const { sk, pk } = generateKeyPair(rng, params);

        // Generate plaintext R3
        const plaintext_coeffs = shortRandom(rng, params);
        const plaintext_rq = Rq.from(plaintext_coeffs, params);
        const plaintext = plaintext_rq.r3FromRq(params); 

        // Encrypt
        const encrypted = r3Encrypt(plaintext, pk, params);

        // Decrypt
        const decrypted = rqDecrypt(encrypted, sk, params);

        // Assert
        expect(decrypted.coeffs).toEqual(plaintext.coeffs);
    });

    it('test_bytes_encrypt_and_decrypt: should encrypt and decrypt bytes correctly', () => {
        const rng = Math.random;
        const { sk, pk } = generateKeyPair(rng, params);

        // Generate plaintext bytes (by creating R3 and converting)
         const r_coeffs = shortRandom(rng, params);
         const r_rq = Rq.from(r_coeffs, params);
         const r_r3 = r_rq.r3FromRq(params); 
         const plaintext_bytes = r_r3.toBytes(params);
         expect(plaintext_bytes.length).toBe(params.R3_BYTES); // Verify length before encryption

        // Encrypt bytes
        const encrypted_bytes = staticBytesEncrypt(plaintext_bytes, pk, params);
        expect(encrypted_bytes.length).toBe(params.RQ_BYTES); // Verify length after encryption


        // Decrypt bytes
        const decrypted_bytes = staticBytesDecrypt(encrypted_bytes, sk, params);
        expect(decrypted_bytes.length).toBe(params.R3_BYTES); // Verify length after decryption


        // Assert
        expect(decrypted_bytes).toEqual(plaintext_bytes);
    });

     it('staticBytesEncrypt should throw for incorrect input length', () => {
        const rng = Math.random;
        const { pk } = generateKeyPair(rng, params);
        const wrongBytes = new Uint8Array(params.R3_BYTES - 1);
        expect(() => staticBytesEncrypt(wrongBytes, pk, params)).toThrow(ErrorType.ByteslengthError);
        const wrongBytes2 = new Uint8Array(params.R3_BYTES + 1);
        expect(() => staticBytesEncrypt(wrongBytes2, pk, params)).toThrow(ErrorType.ByteslengthError);
    });

     it('staticBytesDecrypt should throw for incorrect input length', () => {
        const rng = Math.random;
        const { sk } = generateKeyPair(rng, params);
        const wrongBytes = new Uint8Array(params.RQ_BYTES - 1);
        expect(() => staticBytesDecrypt(wrongBytes, sk, params)).toThrow(ErrorType.ByteslengthError);
        const wrongBytes2 = new Uint8Array(params.RQ_BYTES + 1);
        expect(() => staticBytesDecrypt(wrongBytes2, sk, params)).toThrow(ErrorType.ByteslengthError);
    });
});
