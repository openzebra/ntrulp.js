import { shuffleArray, unshuffleArray } from '../encode/shuffle';
import { ParamsConfig } from '../params';
import { urandom32, randomSign } from '../rng';

const BITS_SIZE = 6;
const SYS_SIZE = 8;

function uSizeArrayToBytes(list: number[]): Uint8Array {
    const buffer = new ArrayBuffer(list.length * SYS_SIZE);
    const view = new DataView(buffer);
    list.forEach((value, index) => {
        view.setBigUint64(index * SYS_SIZE, BigInt(value), true); // little-endian
    });
    return new Uint8Array(buffer);
}

function bytesToUSizeArray(bytes: Uint8Array): number[] {
    if (bytes.length % SYS_SIZE !== 0) {
        throw new Error("Byte array length must be a multiple of SYS_SIZE");
    }
    const list: number[] = [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < bytes.length; i += SYS_SIZE) {
        const val = view.getBigUint64(i, true); // little-endian
        if (val > BigInt(Number.MAX_SAFE_INTEGER)) {
            console.warn("Potential precision loss converting BigInt to number");
        }
        list.push(Number(val));
    }
    return list;
}

// --- Packing/Unpacking ---

export function packBytes(dataBytes: Uint8Array, size: number[], seed: bigint): Uint8Array {
    const sizeBytes = uSizeArrayToBytes(size);
    const sizeLenBytes = uSizeArrayToBytes([sizeBytes.length]);
    const seedBytes = new Uint8Array(SYS_SIZE);
    new DataView(seedBytes.buffer).setBigUint64(0, seed, true); // Little-endian

    const totalLength = dataBytes.length + sizeBytes.length + sizeLenBytes.length + seedBytes.length;
    const result = new Uint8Array(totalLength);

    result.set(dataBytes, 0);
    result.set(sizeBytes, dataBytes.length);
    result.set(sizeLenBytes, dataBytes.length + sizeBytes.length);
    result.set(seedBytes, dataBytes.length + sizeBytes.length + sizeLenBytes.length);

    return result;
}

export class CompressError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CompressError";
    }
}

export function unpackBytes(packedBytes: Uint8Array): { dataBytes: Uint8Array; size: number[]; seed: bigint } {
    const bytesLen = packedBytes.length;

    if (bytesLen < SYS_SIZE * 2) {
        throw new CompressError("Packed bytes too short");
    }

    const seedOffset = bytesLen - SYS_SIZE;
    const sizeLenOffset = bytesLen - SYS_SIZE * 2;

    const seedBytes = packedBytes.slice(seedOffset);
    const sizeLenBytes = packedBytes.slice(sizeLenOffset, seedOffset);

    const seed = new DataView(seedBytes.buffer, seedBytes.byteOffset).getBigUint64(0, true); // Little-endian
    const sizeLen = bytesToUSizeArray(sizeLenBytes)[0];

    const sizeBytesOffset = sizeLenOffset - sizeLen;
    const dataBytesEnd = sizeBytesOffset;

    if (sizeBytesOffset < 0 || dataBytesEnd < 0) {
         throw new CompressError("Invalid size length leads to negative offset");
    }

    if (bytesLen < sizeLen + SYS_SIZE * 2) {
        throw new CompressError("Bytes length inconsistent with size length");
    }

    const sizeBytes = packedBytes.slice(sizeBytesOffset, sizeLenOffset);
    const size = bytesToUSizeArray(sizeBytes);
    const dataBytes = packedBytes.slice(0, dataBytesEnd);

    return { dataBytes, size, seed };
}

// --- Ternary Conversion ---

export function convertToTernary(num: number): Int8Array {
    const result = new Int8Array(BITS_SIZE);
    let n = num;

    if (n < 0 || n >= Math.pow(3, BITS_SIZE)) {
         throw new Error(`Input number ${n} out of range [0, ${Math.pow(3, BITS_SIZE) - 1}] for BITS_SIZE ternary representation`);
    }

    for (let i = BITS_SIZE - 1; i >= 0; i--) {
        const digit = n % 3;
        result[i] = digit === 2 ? -1 : digit;
        n = Math.floor(n / 3);
    }
    return result;
}

export function convertToDecimal(ternary: Int8Array | ArrayLike<number>): number {
    let result = 0;
    if (ternary.length !== BITS_SIZE) {
        throw new Error(`Input ternary array must have length ${BITS_SIZE}`);
    }
    for (let i = 0; i < BITS_SIZE; i++) {
        const digit = ternary[i];
        const x = digit === -1 ? 2 : digit;
        if (x !== 0 && x !== 1 && x !== 2) {
             throw new Error(`Invalid ternary digit encountered: ${digit}`);
        }
        result = result * 3 + x;
    }
    return result;
}

// --- R3 Encoding/Decoding ---

export function r3EncodeChunks(r3: Int8Array): Uint8Array {
    const output: number[] = [];
    const len = r3.length;
    for (let i = 0; i < len; i += BITS_SIZE) {
        const chunk = r3.slice(i, i + BITS_SIZE);
        let bits: Int8Array;
        if (chunk.length === BITS_SIZE) {
            bits = chunk;
        } else {
            bits = new Int8Array(BITS_SIZE);
            bits.set(chunk);
        }
        const byte = convertToDecimal(bits);
        output.push(byte);
    }
    return Uint8Array.from(output);
}

export function r3DecodeChunks(bytes: Uint8Array): Int8Array {
    const output: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        const bits = convertToTernary(byte);
        output.push(...Array.from(bits));
    }
    return Int8Array.from(output);
}

// --- Chunk Merging/Splitting ---

export function r3MergeWChunks(chunks: Int8Array[], size: number[], seed: bigint, params: ParamsConfig): Int8Array {
    const out: number[] = [];
    if (chunks.length !== size.length) {
        throw new Error("Chunks and size arrays must have the same length");
    }

    for (let index = 0; index < chunks.length; index++) {
        const chunkSeed = seed + BigInt(index);
        const point = size[index];
        const chunk = chunks[index];

        if (chunk.length !== params.P) {
             throw new Error(`Chunk ${index} has incorrect length: ${chunk.length}, expected ${params.P}`);
        }
        if (point < 0 || point > params.P) {
             throw new Error(`Size element ${index} is out of bounds: ${point}`);
        }

        let partArray = Array.from(chunk);
        unshuffleArray(partArray, chunkSeed, params);
        out.push(...partArray.slice(0, point));
    }
    return Int8Array.from(out);
}

export function r3SplitWChunks(
    input: Int8Array,
    getRandomValue: () => number,
    params: ParamsConfig
): { chunks: Int8Array[]; size: number[]; seed: bigint } {
    const LIMIT = params.W - params.DIFFICULT;

    const seedPart1 = BigInt(urandom32(getRandomValue));
    const seedPart2 = BigInt(urandom32(getRandomValue));
    const originSeed = (seedPart1 << 32n) | seedPart2;

    let currentSeed = originSeed;
    const chunks: Int8Array[] = [];
    const size: number[] = [];
    let part = new Int8Array(params.P);

    let sum = 0;
    let inputPtr = 0;
    let partPtr = 0;
    const inputLen = input.length;

    while (inputPtr < inputLen) {
        while (sum < LIMIT && inputPtr < inputLen) {
            const value = input[inputPtr];
            if (value !== 0 && value !== 1 && value !== -1) {
                throw new Error(`Invalid value in input R3 array: ${value}`);
            }
            const absValue = Math.abs(value);
            if (sum + absValue > LIMIT && partPtr > 0) {
                 break;
            }
            sum += absValue;
            part[partPtr] = value;
            inputPtr++;
            partPtr++;
        }

        if (inputPtr === inputLen && sum < LIMIT && partPtr > 0) {
            // Last chunk
        } else if (sum !== LIMIT && partPtr > 0) {
             console.warn(`Chunk sum reached ${sum} instead of LIMIT ${LIMIT} before padding`);
        }

        const currentChunkSize = partPtr;
        size.push(currentChunkSize);

        while (sum < params.W) {
            if (partPtr >= params.P) {
                throw new Error(`Cannot pad chunk, part array is full (size ${partPtr}) before reaching sum ${params.W}`);
            }
            const value = randomSign(getRandomValue) as -1 | 1;
            part[partPtr] = value;
            sum += 1;
            partPtr++;
        }

        while (partPtr < params.P) {
            part[partPtr] = 0;
            partPtr++;
        }

        let partArray = Array.from(part);
        shuffleArray(partArray, currentSeed, params);
        chunks.push(Int8Array.from(partArray));

        part.fill(0);
        currentSeed++;
        partPtr = 0;
        sum = 0;

        if (inputPtr >= inputLen) break;
    }

     if (inputLen === 0 && chunks.length === 0) {
        let part = new Int8Array(params.P);
        let partPtr = 0;
        let sum = 0;
         while (sum < params.W) {
             if (partPtr >= params.P) break;
             const value = randomSign(getRandomValue) as -1 | 1;
             part[partPtr] = value;
             sum += 1;
             partPtr++;
         }
         while (partPtr < params.P) {
             part[partPtr] = 0;
             partPtr++;
         }
         let partArray = Array.from(part);
         shuffleArray(partArray, currentSeed, params);
         chunks.push(Int8Array.from(partArray));
         size.push(0);
     }

    return { chunks, size, seed: originSeed };
}

