import { expect, describe, test } from "vitest";
import { freeze, round } from "../";

describe("F3 Functions", () => {
  test("freeze function should match reference implementation", () => {
    function testFreeze(a: number): number {
      const b = a - 3 * Math.floor((10923 * a) / 32768);
      const c = b - 3 * Math.floor((89478485 * b + 134217728) / 268435456);
      return c;
    }

    for (let i = 0; i < 1000; i++) {
      const r = Math.floor(Math.random() * 65536) - 32768;

      const t1 = testFreeze(r);
      const t2 = freeze(r);

      expect(t2).toBe(t1);
    }
  });

  test("round function should match expected behavior for ntrup761", () => {
    const P = 761;

    const rqCoeffs = new Array(P).fill(1);

    function round3(h: number[]): void {
      const f = [...h];
      for (let i = 0; i < 761; i++) {
        const inner = 21846 * (f[i] + 2295);
        h[i] = Math.floor((inner + 32768) / 65536) * 3 - 2295;
      }
    }

    const originalArray = [...rqCoeffs];
    const newRoundArray = [...rqCoeffs];

    round3(originalArray);
    round(newRoundArray);

    expect(newRoundArray).toEqual(originalArray);
  });

  test("freeze function should match reference implementation", () => {
    let values = [0, 42, -1, -42, -66, 1000, -1000, 32767, -32768, 500];
    let shoul_be = [0, 0, -1, 0, 0, 1, -1, 1, 1, -1];

    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      const t2 = freeze(r);
      expect(t2).toBe(shoul_be[i]);
    }
  });
});
