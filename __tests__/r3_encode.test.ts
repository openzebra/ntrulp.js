import { describe, expect, it } from "vitest";
import { r3Encode, r3Decode } from "../";
import { params1277, params653, params761, ParamsConfig } from "../";
import { randomSmall } from "../";
import { ChaChaRng } from "@hicaru/chacharand.js";

function createSeededRng() {
  const rng = ChaChaRng.fromU64Seed(42n, 20);

  return rng;
}

describe("R3 Encoder", () => {
  const testWithParams = (params: ParamsConfig) => {
    it(`should encode and decode r3 values correctly with params P=${params.P}`, () => {
      const getRandomValue = createSeededRng();

      for (let i = 0; i < 5; i++) {
        const r3 = randomSmall(getRandomValue, params);
        const bytes = r3Encode(r3, params);
        const dec = r3Decode(bytes, params);

        expect(dec.length).toBe(r3.length);

        for (let j = 0; j < params.P; j++) {
          expect(dec[j]).toBe(r3[j]);
        }
      }
    });

    it(`should handle partial chunks correctly with params P=${params.P}`, () => {
      const r3 = new Int8Array(params.P);

      // Set specific values to test edge cases
      for (let i = 0; i < params.P; i++) {
        r3[i] = ((i % 3) - 1) as -1 | 0 | 1;
      }

      const bytes = r3Encode(r3, params);
      const dec = r3Decode(bytes, params);

      expect(dec.length).toBe(r3.length);

      for (let j = 0; j < params.P; j++) {
        expect(dec[j]).toBe(r3[j]);
      }
    });
  };

  // Test with multiple parameter sets to ensure the generics work correctly
  testWithParams(params1277);
  testWithParams(params653);
  testWithParams(params761);
});
