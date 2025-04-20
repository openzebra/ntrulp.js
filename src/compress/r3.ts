import { shuffleArray, unshuffleArray } from '../encode/shuffle';
import { ParamsConfig } from '../params';
import { randomSign } from '../rng';
import { ErrorType } from '../errors';

export const BITS_SIZE = 6;
export const SYS_SIZE = 8;

export function usizeArrayToBytes(list: number[]): Uint8Array {
  const buffer = new ArrayBuffer(list.length * SYS_SIZE);
  const view = new DataView(buffer);
  for (let i = 0; i < list.length; i++) {
    const num = list[i];
    if (!Number.isSafeInteger(num) || num < 0) {
      throw ErrorType.OutOfRange;
    }
    view.setBigUint64(i * SYS_SIZE, BigInt(num), true);
  }
  return new Uint8Array(buffer);
}

export function bytesToUsizeArray(bytes: Uint8Array): number[] {
  if (bytes.length % SYS_SIZE !== 0) {
    throw ErrorType.ByteslengthError;
  }
  const result: number[] = new Array(bytes.length / SYS_SIZE);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < result.length; i++) {
    const val = view.getBigUint64(i * SYS_SIZE, true);
    if (val > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw ErrorType.OutOfRange;
    }
    result[i] = Number(val);
  }
  return result;
}

export function packBytes(dataBytes: Uint8Array, size: number[], seed: bigint): Uint8Array {
  const sizeBytes = usizeArrayToBytes(size);
  const sizeLenBytes = usizeArrayToBytes([sizeBytes.length]);
  const seedBytes = new Uint8Array(8);
  new DataView(seedBytes.buffer).setBigUint64(0, seed, true);

  const totalLength = dataBytes.length + sizeBytes.length + sizeLenBytes.length + seedBytes.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;

  result.set(dataBytes, offset);
  offset += dataBytes.length;
  result.set(sizeBytes, offset);
  offset += sizeBytes.length;
  result.set(sizeLenBytes, offset);
  offset += sizeLenBytes.length;
  result.set(seedBytes, offset);

  return result;
}

export function unpackBytes(bytes: Uint8Array): { dataBytes: Uint8Array; size: number[]; seed: bigint } {
  const bytesLen = bytes.length;
  const X2_SYS_SIZE = SYS_SIZE * 2;

  if (bytesLen < X2_SYS_SIZE) {
    throw ErrorType.ByteslengthError;
  }

  let seed: bigint;
  try {
    const seedBytes = bytes.subarray(bytesLen - 8);
    seed = new DataView(seedBytes.buffer, seedBytes.byteOffset).getBigUint64(0, true);
  } catch (e) {
      throw ErrorType.SeedSliceError;
  }

  let sizeLen: number;
   try {
    const sizeLenBytes = bytes.subarray(bytesLen - X2_SYS_SIZE, bytesLen - SYS_SIZE);
    const sizeLenArray = bytesToUsizeArray(sizeLenBytes);
    if (sizeLenArray.length !== 1) {
        throw ErrorType.SizeSliceError;
    }
    sizeLen = sizeLenArray[0];
   } catch (e) {
       throw ErrorType.SizeSliceError;
   }

  const dataSectionLength = bytesLen - sizeLen - X2_SYS_SIZE;
  if (bytesLen < sizeLen + X2_SYS_SIZE || dataSectionLength < 0 ) {
      throw ErrorType.ByteslengthError;
  }

   let size: number[];
   try {
        const sizeBytes = bytes.subarray(bytesLen - sizeLen - X2_SYS_SIZE, bytesLen - X2_SYS_SIZE);
        if (sizeBytes.length !== sizeLen) {
             throw ErrorType.SizeSliceError;
        }
        size = bytesToUsizeArray(sizeBytes);
   } catch (e) {
        throw ErrorType.SizeSliceError;
   }

  const dataBytes = bytes.subarray(0, dataSectionLength);

  return { dataBytes, size, seed };
}

export function convertToTernary(num: number): Int8Array {
   if (!Number.isInteger(num) || num < 0 || num > 255) {
       throw ErrorType.OutOfRange;
   }
  const result = new Int8Array(BITS_SIZE).fill(0);
  let n = num;
  for (let i = BITS_SIZE - 1; i >= 0; i--) {
    const digit = n % 3;
    result[i] = digit === 2 ? -1 : (digit as -1 | 0 | 1);
    n = Math.floor(n / 3);
  }
  return result;
}

export function convertToDecimal(ternary: Int8Array | ArrayLike<number>): number {
  if (ternary.length !== BITS_SIZE) {
    throw ErrorType.SliceLengthNotR3Size;
  }
  let result = 0;
  for (let i = 0; i < BITS_SIZE; i++) {
    const digit = ternary[i];
    if (digit !== 0 && digit !== 1 && digit !== -1) {
       throw ErrorType.CompressError;
    }
    const x = digit === -1 ? 2 : digit;
    result = result * 3 + x;
  }
  return result & 0xFF;
}

export function r3EncodeChunks(r3: Int8Array): Uint8Array {
  const chunkCount = Math.ceil(r3.length / BITS_SIZE);
  const output = new Uint8Array(chunkCount);
  for (let i = 0; i < chunkCount; i++) {
    const start = i * BITS_SIZE;
    const end = Math.min(start + BITS_SIZE, r3.length);
    const chunk = r3.subarray(start, end);
    const bits = new Int8Array(BITS_SIZE).fill(0);
    bits.set(chunk);
    output[i] = convertToDecimal(bits);
  }
  return output;
}

export function r3DecodeChunks(bytes: Uint8Array): Int8Array {
  const output = new Int8Array(bytes.length * BITS_SIZE);
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const bits = convertToTernary(byte);
    output.set(bits, i * BITS_SIZE);
  }
  return output;
}

export function r3MergeWChunks(chunks: Int8Array[], size: number[], seed: bigint, params: ParamsConfig): Int8Array {
  if (chunks.length !== size.length) {
    throw ErrorType.SliceLengthNotR3Size;
  }
  const output: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkSeed = seed + BigInt(i);
    const point = size[i];
    const chunk = chunks[i];

    if (chunk.length !== params.P) {
        throw ErrorType.SliceLengthNotR3Size;
    }
    if (point < 0 || point > params.P) {
      throw ErrorType.OutOfRange;
    }

    const part = Array.from(chunk);
    unshuffleArray(part, chunkSeed, params);
    output.push(...part.slice(0, point));
  }
  return Int8Array.from(output);
}

export function r3SplitWChunks(
  input: Int8Array,
  rng: () => number,
  params: ParamsConfig
): { chunks: Int8Array[]; size: number[]; seed: bigint } {
  const LIMIT = params.W - params.DIFFICULT;
  const P = params.P;
  const W = params.W;

  const seedHigh = BigInt(rng());
  const seedLow = BigInt(rng());
  const originSeed = (seedHigh << 32n) | seedLow;

  let currentSeed = originSeed;
  const chunks: Int8Array[] = [];
  const size: number[] = [];
  let part = new Int8Array(P);

  let sum = 0;
  let inputPtr = 0;
  let partPtr = 0;

  while (inputPtr < input.length) {
    while (sum < LIMIT && inputPtr < input.length) {
      const value = input[inputPtr];
      if (value !== -1 && value !== 0 && value !== 1) {
        throw ErrorType.CompressError;
      }
      const absValue = Math.abs(value);

      if (partPtr >= P) {
          throw ErrorType.OverFlow;
      }

      sum += absValue;
      part[partPtr] = value;
      inputPtr++;
      partPtr++;
    }

    size.push(partPtr);

    while (sum < W) {
       if (partPtr >= P) {
           throw ErrorType.OverFlow;
       }
       const value = randomSign(rng);
       part[partPtr] = value;
       sum += 1;
       partPtr++;
    }

    if (sum !== W) {
      throw ErrorType.SumShouldEqW;
    }

     for (let k = partPtr; k < P; k++) {
        part[k] = 0;
    }

    const partArray = Array.from(part);
    shuffleArray(partArray, currentSeed, params);
    chunks.push(Int8Array.from(partArray));

    part = new Int8Array(P);
    currentSeed += 1n;
    partPtr = 0;
    sum = 0;
  }

  return { chunks, size, seed: originSeed };
}
