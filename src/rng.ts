import type { ChaChaRng } from "@hicaru/chacharand.js";

import { ParamsConfig } from "./params";
import { ErrorType } from "./errors";

export function urandom32(rng: ChaChaRng): number {
  const c0 = rng.nextU8();
  const c1 = rng.nextU8();
  const c2 = rng.nextU8();
  const c3 = rng.nextU8();

  return c0 + 256 * c1 + 65536 * c2 + 16777216 * c3;
}

export function randomSign(getRandomValue: () => number): number {
  return getRandomValue() < 0.5 ? 1 : -1;
}

export function randomRange3(rng: ChaChaRng): number {
  const r = urandom32(rng);
  return (((r & 0x3fffffff) * 3) >>> 30) - 1;
}

export function randomSmall<T extends ParamsConfig>(
  rng: ChaChaRng,
  params: T,
): Int8Array {
  const r = new Int8Array(params.P);
  for (let i = 0; i < params.P; i++) {
    r[i] = randomRange3(rng);
  }
  return r;
}

export function shortRandom<T extends ParamsConfig>(
  rng: ChaChaRng,
  params: T,
): Int16Array {
  const list = new Uint32Array(params.P);

  for (let i = 0; i < params.P; i++) {
    const value = urandom32(rng);
    list[i] = i < params.W ? value & ~1 : (value & ~3) | 1;
  }

  for (let i = 0; i < params.W; i++) {
    if (list[i] % 2 !== 0) {
      throw new Error(ErrorType.Mod2ShouldZero);
    }
  }

  for (let i = params.W; i < params.P; i++) {
    if (list[i] % 4 !== 1) {
      throw new Error(ErrorType.Mod4ShouldOne);
    }
  }

  list.sort();

  const newList = new Int32Array(params.P);
  let sum = 0;

  for (let i = 0; i < params.P; i++) {
    const newValue = (list[i] % 4) - 1;

    if (newValue > 1) {
      throw new Error(ErrorType.OutOfRange);
    }

    newList[i] = newValue;
    sum += Math.abs(newValue);
  }

  if (sum !== params.W) {
    throw new Error(ErrorType.SumShouldEqW);
  }

  const i16List = new Int16Array(params.P);
  for (let i = 0; i < params.P; i++) {
    i16List[i] = newList[i];
  }

  return i16List;
}
