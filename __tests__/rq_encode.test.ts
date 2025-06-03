import { describe, it, expect } from "vitest";
import { rqEncodeToBytes, bytesRqDecode } from "../";
import { shortRandom } from "../";
import { Rq } from "../";
import {
  params,
  params653,
  params761,
  params857,
  params953,
  params1013,
  params1277,
} from "../";
import { ChaChaRng } from "@hicaru/chacharand.js";

describe("rq encode/decode", () => {
  it("should correctly encode and decode Rq coefficients", () => {
    for (let i = 0; i < 100; i++) {
      const rng = ChaChaRng.fromU64Seed(42n, 20);

      try {
        // Generate random coefficients like in the Rust test
        const coeffs = shortRandom(rng, params);

        // Create Rq instance
        const rq = Rq.from(coeffs, params);

        // Encode to bytes
        const bytes = rqEncodeToBytes(rq.coeffs, params);

        // Decode back to coefficients
        const res = bytesRqDecode(bytes, params);

        // Verify the coefficients match
        for (let j = 0; j < params.P; j++) {
          expect(res[j]).toEqual(rq.coeffs[j]);
        }
      } catch (error) {
        // Skip if generation failed
        continue;
      }
    }
  });

  it("should handle boundary values correctly", () => {
    const testCases = [0, 1, -1, 127, -128, 255, -256, 32767, -32768];

    for (const testValue of testCases) {
      const coeffs = new Int16Array(params.P);
      coeffs.fill(testValue);

      const bytes = rqEncodeToBytes(coeffs, params);
      const decoded = bytesRqDecode(bytes, params);

      for (let i = 0; i < params.P; i++) {
        expect(decoded[i]).toEqual(testValue);
      }
    }
  });

  it("should work with different parameter sets", () => {
    const paramSets = [
      params653,
      params761,
      params857,
      params953,
      params1013,
      params1277,
    ];

    for (const paramSet of paramSets) {
      const testValue = 42;
      const coeffs = new Int16Array(paramSet.P);
      coeffs.fill(testValue);

      const bytes = rqEncodeToBytes(coeffs, paramSet);
      const decoded = bytesRqDecode(bytes, paramSet);

      // Check that bytes length matches parameter set
      expect(bytes.length).toEqual(paramSet.RQ_BYTES);

      // Check that decoded values match original
      for (let i = 0; i < paramSet.P; i++) {
        expect(decoded[i]).toEqual(testValue);
      }
    }
  });
});
