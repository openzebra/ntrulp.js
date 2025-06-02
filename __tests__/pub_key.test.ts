import { describe, it, expect } from "vitest";
import { PubKey } from "../";
import { PrivKey } from "../";
import { Rq } from "../";
import { R3 } from "../";
import { randomSmall, shortRandom } from "../";
import { params } from "../";
import { ErrorType } from "../";
import { ChaChaRng } from "@hicaru/chacharand.js";

describe("PubKey", () => {
  it("test_import_export: should correctly serialize and deserialize a public key", () => {
    const rng = ChaChaRng.fromU64Seed(42n, 20);
    let successCount = 0;
    const attempts = 5;

    for (let i = 0; i < attempts; i++) {
      try {
        const f_coeffs = shortRandom(rng, params);
        const f = Rq.from(f_coeffs, params);
        const g_coeffs = randomSmall(rng, params);
        const g = R3.from(g_coeffs, params);

        // Compute the public key, may throw if f is not invertible mod 3
        const pub_key = PubKey.compute(f, g, params);

        // Convert to bytes
        const bytes = pub_key.toBytes(params);
        expect(bytes.length).toBe(params.PUBLICKEYS_BYTES);

        // Import back from bytes
        const new_pub_key = PubKey.import(bytes, params);

        // Assert equality of the polynomial coefficients
        expect(new_pub_key.coeffs).toEqual(pub_key.coeffs);

        successCount++;
      } catch (error) {
        // Allow continuation if specific compute errors occur
        if (error !== ErrorType.NoSolutionRecip3) {
          throw error; // Re-throw unexpected errors
        }
        // console.log("Skipping import/export iteration due to non-invertible polynomial (expected behavior).");
        continue;
      }
    }
    // Ensure the test ran successfully at least once
    expect(successCount).toBeGreaterThan(0);
  });

  it("test_from_sk: should correctly derive public key from secret key", () => {
    const rng = ChaChaRng.fromU64Seed(42n, 20);
    let successCount = 0;
    const attempts = 10; // Increase attempts as PrivKey.compute can also fail

    for (let i = 0; i < attempts; i++) {
      let sk: PrivKey | null = null;
      let f: Rq | null = null;
      let g: R3 | null = null;

      try {
        // Find a valid key pair first
        while (!sk) {
          try {
            const f_coeffs = shortRandom(rng, params);
            f = Rq.from(f_coeffs, params);
            const g_coeffs = randomSmall(rng, params);
            g = R3.from(g_coeffs, params);
            // This compute might throw R3NoSolutionRecip
            sk = PrivKey.compute(f, g, params);
          } catch (e) {
            if (
              e !== ErrorType.R3NoSolutionRecip &&
              e !== ErrorType.NoSolutionRecip3
            )
              throw e; // Rethrow unexpected errors
            // Otherwise, continue loop to find a working g
          }
        }

        // Ensure f and g are not null (should always be set if sk is found)
        if (!f || !g) throw new Error("Test logic error: f or g not set");

        // Compute public key directly from f and g (might throw NoSolutionRecip3)
        const pub_key_from_entropy = PubKey.compute(f, g, params);

        // Derive public key from the generated secret key (might throw R3NoSolutionRecip or NoSolutionRecip3)
        const pub_key_from_sk = PubKey.fromSk(sk, params);

        // Assert equality
        expect(pub_key_from_sk.coeffs).toEqual(pub_key_from_entropy.coeffs);

        successCount++;
      } catch (error) {
        // Allow continuation if specific compute/derivation errors occur
        if (
          error !== ErrorType.R3NoSolutionRecip &&
          error !== ErrorType.NoSolutionRecip3
        ) {
          throw error; // Re-throw unexpected errors
        }
        // console.log(`Skipping from_sk iteration due to non-invertible polynomial: ${error}`);
        continue;
      }
    }
    // Ensure the test ran successfully at least once
    expect(successCount).toBeGreaterThan(0);
  }, 20000);

  it("import should throw ByteslengthError for incorrect byte length", () => {
    const wrongLengthBytes = new Uint8Array(params.PUBLICKEYS_BYTES - 1);
    expect(() => PubKey.import(wrongLengthBytes, params)).toThrow(
      ErrorType.ByteslengthError,
    );

    const wrongLengthBytes2 = new Uint8Array(params.PUBLICKEYS_BYTES + 1);
    expect(() => PubKey.import(wrongLengthBytes2, params)).toThrow(
      ErrorType.ByteslengthError,
    );
  });

  it("toBytes should produce correct length", () => {
    const rng = ChaChaRng.fromU64Seed(42n, 20);
    let pub_key: PubKey | null = null;

    // Find a valid key pair first
    while (!pub_key) {
      try {
        const f_coeffs = shortRandom(rng, params);
        const f = Rq.from(f_coeffs, params);
        const g_coeffs = randomSmall(rng, params);
        const g = R3.from(g_coeffs, params);
        pub_key = PubKey.compute(f, g, params);
      } catch (e) {
        if (e !== ErrorType.NoSolutionRecip3) throw e;
      }
    }

    const bytes = pub_key.toBytes(params);
    expect(bytes.length).toBe(params.PUBLICKEYS_BYTES);
  });
});
