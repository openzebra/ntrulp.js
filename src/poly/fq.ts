import { i32ModU14 } from "../math";

export function freeze(x: number, q12: number, q: number): number {
  const r = i32ModU14(x + q12, q);
  const result = r - q12;
  return result === 0 ? 0 : result;
}

export function recip(a1: number, q12: number, q: number): number {
  let i = 1;
  let ai = a1;

  while (i < q - 2) {
    ai = freeze((a1 * ai), q12, q);
    i += 1;
  }

  return ai;
}
