import { describe, it, expect } from 'vitest';
import { PrivKey } from '../';
import { Rq } from '../';
import { R3 } from '../';
import { randomSmall, shortRandom } from '../';
import { params } from '../'; 
import { ErrorType } from '../';


describe('PrivKey', () => {
  it('test_import_export: should correctly serialize and deserialize a private key', () => {
    const rng = Math.random;

    let successCount = 0;
    const attempts = 5;

    for (let i = 0; i < attempts; i++) {
      try {
        // Generate f (Rq) and g (R3) polynomials [cite: 131, 132]
        const f_coeffs = shortRandom(rng, params);
        const f = Rq.from(f_coeffs, params);
        const g_coeffs = randomSmall(rng, params);
        const g = R3.from(g_coeffs, params);
        
        // Compute the secret key, skip iteration if recip fails [cite: 132]
        const secret_key = PrivKey.compute(f, g, params);

        // Convert to bytes [cite: 133]
        const bytes = secret_key.toBytes(params);
        expect(bytes.length).toBe(params.SECRETKEYS_BYTES);

        // Import back from bytes [cite: 133]
        const new_secret_key = PrivKey.import(bytes, params);

        // Assert equality of the polynomial coefficients [cite: 134]
        expect(new_secret_key.f.coeffs).toEqual(secret_key.f.coeffs);
        expect(new_secret_key.ginv.coeffs).toEqual(secret_key.ginv.coeffs);
        
        successCount++;

      } catch (error) {
        // Allow continuation if R3NoSolutionRecip occurs, fail on other errors
        if (error !== ErrorType.R3NoSolutionRecip && error !== ErrorType.NoSolutionRecip3) {
           throw error; // Re-throw unexpected errors
        }
        // console.log("Skipping iteration due to non-invertible polynomial (expected behavior).");
        continue; 
      }
    }
    // Ensure the test ran successfully at least once
    expect(successCount).toBeGreaterThan(0); 
  });

   it('import should throw ByteslengthError for incorrect byte length', () => {
    const wrongLengthBytes = new Uint8Array(params.SECRETKEYS_BYTES - 1);
    expect(() => PrivKey.import(wrongLengthBytes, params)).toThrow(ErrorType.ByteslengthError);

    const wrongLengthBytes2 = new Uint8Array(params.SECRETKEYS_BYTES + 1);
     expect(() => PrivKey.import(wrongLengthBytes2, params)).toThrow(ErrorType.ByteslengthError);
  });

   it('to_bytes should produce correct length', () => {
       const rng = Math.random;
       let secret_key: PrivKey | null = null;

       // Find a valid key pair first
       while (!secret_key) {
           try {
               const f_coeffs = shortRandom(rng, params);
               const f = Rq.from(f_coeffs, params);
               const g_coeffs = randomSmall(rng, params);
               const g = R3.from(g_coeffs, params);
               secret_key = PrivKey.compute(f, g, params);
           } catch (e) {
               if (e !== ErrorType.R3NoSolutionRecip && e !== ErrorType.NoSolutionRecip3) throw e;
           }
       }
       
       const bytes = secret_key.toBytes(params);
       expect(bytes.length).toBe(params.SECRETKEYS_BYTES);
   });
});
