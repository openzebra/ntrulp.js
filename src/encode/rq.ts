import { ParamsConfig } from '../params';

export function rqEncodeToBytes(input: Int16Array, { P, RQ_BYTES }: ParamsConfig): Uint8Array {
  const bytes = new Uint8Array(RQ_BYTES);

  for (let i = 0; i < P; i++) {
    const value = input[i];
    const byteIndex = i * 2;
    bytes[byteIndex] = (value >> 8) & 0xFF;
    bytes[byteIndex + 1] = value & 0xFF;
  }

  return bytes;
}

export function bytesRqDecode(input: Uint8Array, { P }: ParamsConfig): Int16Array {
  const coeffs = new Int16Array(P);

  for (let i = 0; i < P; i++) {
    const byteIndex = i * 2;
    coeffs[i] = ((input[byteIndex] << 8) | input[byteIndex + 1]) << 0;
  }

  return coeffs;
}
