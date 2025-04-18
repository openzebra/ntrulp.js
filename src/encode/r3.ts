import { ParamsConfig } from '../params';

export function r3Encode<T extends ParamsConfig>(f: Int8Array, params: T): Uint8Array {
  const s = new Uint8Array(params.R3_BYTES);

  for (let i = 0; i < Math.floor(f.length / 4); i++) {
    s[i] = 0;
    for (let j = 0; j < 4; j++) {
      if (i * 4 + j < f.length) {
        s[i] |= ((f[i * 4 + j] + 1) & 0x3) << (j * 2);
      }
    }
  }

  if (params.P % 4 !== 0) {
    s[Math.floor(params.P / 4)] = (f[params.P - 1] + 1) & 0xFF;
  }

  return s;
}

export function r3Decode<T extends ParamsConfig>(s: Uint8Array, params: T): Int8Array {
  const f = new Int8Array(params.P);
  let x: number;
  let i = 0;

  const swap = (x: number): number => (x & 3) - 1;

  while (i < Math.floor(params.P / 4)) {
    x = s[i];
    f[i * 4] = swap(x);
    x >>= 2;
    f[i * 4 + 1] = swap(x);
    x >>= 2;
    f[i * 4 + 2] = swap(x);
    x >>= 2;
    f[i * 4 + 3] = swap(x);
    i++;
  }

  if (params.P % 4 !== 0) {
    x = s[i];
    f[i * 4] = swap(x);
  }

  return f;
}
