import { expect, describe, test } from "vitest";
import { randomRange3, randomSmall, shortRandom, urandom32 } from "../";
import { params1277, params653, params761, ParamsConfig } from "../";
import { ChaCha20Rng, ChaChaRng } from "@hicaru/chacharand.js";

function createSeededRng() {
  const rng = ChaChaRng.fromU64Seed(42n, 20);

  return rng;
}

test(`test urandom32`, () => {
  let seed = Uint8Array.from([
    155, 113, 210, 36, 189, 98, 243, 120, 93, 150, 212, 106, 211, 234, 61, 115,
    49, 155, 251, 194, 137, 12, 170, 218, 226, 223, 247, 37, 25, 103, 60, 167,
  ]);
  const rng = ChaCha20Rng(seed);
  const num = urandom32(rng);

  expect(num).toBe(3554650324);
});

describe("random functions", () => {
  test("randomRange3 should return values between -1 and 1", () => {
    const rng = createSeededRng();

    for (let i = 0; i < 200; i++) {
      const value = randomRange3(rng);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  const testWithParams = (params: ParamsConfig) => {
    describe(`with params P=${params.P}`, () => {
      test(`randomSmall should return array with length P=${params.P} containing values -1, 0, 1`, () => {
        const rng = createSeededRng();

        for (let i = 0; i < 10; i++) {
          const result = randomSmall(rng, params);

          expect(result.length).toBe(params.P);

          const uniqueValues = new Set(result);
          expect(uniqueValues.has(-1)).toBe(true);
          expect(uniqueValues.has(0)).toBe(true);
          expect(uniqueValues.has(1)).toBe(true);

          for (const val of result) {
            expect(val).toBeGreaterThanOrEqual(-1);
            expect(val).toBeLessThanOrEqual(1);
          }
        }
      });

      test(`shortRandom should return valid array with sum of absolute values equal to W=${params.W}`, () => {
        const rng = createSeededRng();

        for (let i = 0; i < 10; i++) {
          const result = shortRandom(rng, params);

          expect(result.length).toBe(params.P);

          const uniqueValues = new Set(result);
          expect(uniqueValues.has(-1)).toBe(true);
          expect(uniqueValues.has(0)).toBe(true);
          expect(uniqueValues.has(1)).toBe(true);

          let sum = 0;
          for (const val of result) {
            sum += Math.abs(val);
          }

          expect(sum).toBe(params.W);
        }
      });
    });
  };

  testWithParams(params1277);
  testWithParams(params653);
  testWithParams(params761);
});
