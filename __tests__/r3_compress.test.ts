import { describe, it, expect, beforeEach } from 'vitest';
import { ChaChaRng } from '@hicaru/chacharand.js'; // For deterministic randomness
import {
    packBytes,
    unpackBytes,
    convertToTernary,
    convertToDecimal,
    r3EncodeChunks,
    r3DecodeChunks,
    r3MergeWChunks,
    r3SplitWChunks,
    usizeArrayToBytes, // Import helper functions
    bytesToUsizeArray, // Import helper functions
    BITS_SIZE, // Import constant
} from '../src/compress/r3';
import { ParamsConfig, params1277 } from '../src/params'; // Adjust path as needed
import { ErrorType } from '../src/errors'; // Import ErrorType

describe('R3 Compression Utilities', () => {
    let rng: ChaChaRng;
    let getRandomValue: () => number;
    const currentParams: ParamsConfig = params1277; // Use a specific param set

    beforeEach(() => {
        // Use a fixed seed for deterministic tests matching Rust behavior if possible
        rng = ChaChaRng.fromU64Seed(0xabcdef0123456789n, 20);
        getRandomValue = () => rng.nextU32(); // Provide a u32 random source
    });

    // Mirrors Rust's pack_unpack_bytes test structure [cite: 36, 37, 38, 39, 40, 41]
    it('pack_unpack_bytes should pack and unpack data correctly', () => {
        const initialBytes = new Uint8Array(1000); // Like first `bytes` in Rust test [cite: 37]
        rng.fillBytes(initialBytes);
        const unlimitedPoly = r3DecodeChunks(initialBytes); // [cite: 37]
        const { chunks, size, seed } = r3SplitWChunks(unlimitedPoly, getRandomValue, currentParams); // [cite: 37]

        // Create the data that will actually be packed (shadowing pattern like Rust)
        let bytesToPackList: Uint8Array[] = [];
        let totalPackedDataLen = 0;
        for (let i = 0; i < chunks.length; i++) { // [cite: 38]
            const rqBytes = new Uint8Array(currentParams.RQ_BYTES); // [cite: 39]
            rng.fillBytes(rqBytes); // Fill with random data [cite: 39]
            bytesToPackList.push(rqBytes);
            totalPackedDataLen += rqBytes.length;
        }
        // Concatenate the chunks into one Uint8Array
        const dataToPack = new Uint8Array(totalPackedDataLen);
        let currentOffset = 0;
        for(const arr of bytesToPackList) {
            dataToPack.set(arr, currentOffset);
            currentOffset += arr.length;
        }

        const packed = packBytes(dataToPack, size, seed); // [cite: 40]
        const { dataBytes: unpackedData, size: unpackedSize, seed: unpackedSeed } = unpackBytes(packed); // [cite: 40]

        expect(unpackedData).toEqual(dataToPack); // [cite: 40]
        expect(unpackedSize).toEqual(size); // [cite: 40]
        expect(unpackedSeed).toEqual(seed); // [cite: 40]
    });

    // Mirrors test_u64_convert [cite: 42, 43]
    it('usizeArrayToBytes and bytesToUsizeArray should convert correctly', () => {
        const originalList: number[] = [];
        for (let i = 0; i < 1024; i++) {
            originalList.push(rng.nextU32()); // Use u32 to stay within safe JS Number range easily [cite: 42]
        }

        const bytes = usizeArrayToBytes(originalList); // [cite: 42]
        const out = bytesToUsizeArray(bytes); // [cite: 42]

        expect(out).toEqual(originalList); // [cite: 42]
    });

     // Test edge cases for usize conversion
    it('usizeArrayToBytes should throw for unsafe integers or negative numbers', () => {
        expect(() => usizeArrayToBytes([Number.MAX_SAFE_INTEGER + 1])).toThrow(ErrorType.OutOfRange);
        expect(() => usizeArrayToBytes([-1])).toThrow(ErrorType.OutOfRange);
    });

    it('bytesToUsizeArray should throw for incorrect byte length', () => {
        const invalidBytes = new Uint8Array(7); // Not a multiple of SYS_SIZE (8)
        expect(() => bytesToUsizeArray(invalidBytes)).toThrow(ErrorType.ByteslengthError);
    });


    // Mirrors test_bit_convert [cite: 44, 45]
    it('convertToTernary and convertToDecimal should be inverses', () => {
        for (let n = 0; n <= 255; n++) { // Test all u8 values
            const bits = convertToTernary(n); // [cite: 44]
            expect(bits.length).toBe(BITS_SIZE); // Check length
             // Check digits are valid (-1, 0, 1)
            bits.forEach(digit => expect([-1, 0, 1]).toContain(digit));

            const out = convertToDecimal(bits); // [cite: 44]
            const bits0 = convertToTernary(out); // Convert back [cite: 44]

            expect(out).toBe(n); // Check n -> out (decimal) conversion is identity [cite: 44]
            expect(bits0).toEqual(bits); // Check n -> bits -> out -> bits0; bits should equal bits0 [cite: 44]
        }
    });

     // Test edge cases for ternary conversion
    it('convertToTernary should throw for out-of-range input', () => {
        expect(() => convertToTernary(-1)).toThrow(ErrorType.OutOfRange);
        expect(() => convertToTernary(256)).toThrow(ErrorType.OutOfRange);
        expect(() => convertToTernary(1.5)).toThrow(ErrorType.OutOfRange);
    });

    it('convertToDecimal should throw for invalid length or digits', () => {
        expect(() => convertToDecimal(new Int8Array(BITS_SIZE - 1))).toThrow(ErrorType.SliceLengthNotR3Size);
        expect(() => convertToDecimal(new Int8Array([1, 0, 2, -1, 0, 1]))).toThrow(ErrorType.CompressError); // Invalid digit 2
    });


    // Mirrors test_r3_encode_decode_chunks [cite: 46, 47, 48]
    it('r3EncodeChunks and r3DecodeChunks should be inverses', () => {
        for(let i = 0; i < 10; i++) { // [cite: 46]
            const originalBytes = new Uint8Array(1000); // Create random bytes [cite: 46]
            rng.fillBytes(originalBytes);

            const r3 = r3DecodeChunks(originalBytes); // [cite: 47]
            // The decoded length might be longer due to padding in the last chunk
            expect(r3.length).toBe(originalBytes.length * BITS_SIZE);

            const encodedBytes = r3EncodeChunks(r3); // [cite: 47]

            // Encoded bytes length should match original bytes length
            expect(encodedBytes.length).toBe(originalBytes.length);
            // The content should match the original bytes
            expect(encodedBytes).toEqual(originalBytes); // [cite: 47]
        }
    });

    // Mirrors test_encode_decode_bytes_by_chunks_spliter_merge [cite: 49, 50, 51, 52, 53, 54, 55, 56]
    it('r3SplitWChunks and r3MergeWChunks should correctly split and merge', () => {
        for (let i = 0; i < 100; i++) { // Match loop count [cite: 49]
            // Generate random length between 5 and 999
            const randLen = (rng.nextU32() % 995) + 5; // [cite: 50]
            const bytes = new Uint8Array(randLen);
            rng.fillBytes(bytes); // [cite: 50]

            const originalR3 = r3DecodeChunks(bytes); // Decode to get potentially long R3 poly
            // Trim trailing zeros from decoding if necessary, as split expects meaningful data
             let lastNonZeroIndex = originalR3.length - 1;
            while (lastNonZeroIndex >= 0 && originalR3[lastNonZeroIndex] === 0) {
                lastNonZeroIndex--;
            }
            const r3ToSplit = originalR3.slice(0, lastNonZeroIndex + 1);


            if (r3ToSplit.length === 0) continue; // Skip if all zeros after decode

            const { chunks, size, seed } = r3SplitWChunks(r3ToSplit, getRandomValue, currentParams); // [cite: 50]
            const merged = r3MergeWChunks(chunks, size, seed, currentParams); // [cite: 51]

            // Calculate sum of absolute values for comparison [cite: 52, 53, 54, 55]
            const r3Sum = r3ToSplit.reduce((acc, val) => acc + Math.abs(val), 0);
            const mSum = merged.reduce((acc, val) => acc + Math.abs(val), 0);

            expect(r3Sum).toEqual(mSum); // Check weights match [cite: 55]
            expect(size.length).toEqual(chunks.length); // Check array lengths [cite: 55]
            expect(merged.length).toEqual(r3ToSplit.length); // Check final poly length [cite: 55]
            expect(merged).toEqual(r3ToSplit); // Check content equality [cite: 55]
        }
    });

    // Mirrors test_spliter [cite: 57, 58, 59, 60]
    it('r3SplitWChunks should produce valid chunks', () => {
        for (let i = 0; i < 10; i++) { // [cite: 57]
            const randLen = (rng.nextU32() % 995) + 5; // [cite: 57]
            const bytes = new Uint8Array(randLen);
            rng.fillBytes(bytes); // [cite: 58]
            const r3 = r3DecodeChunks(bytes); // [cite: 58]
             // Trim trailing zeros
             let lastNonZeroIndex = r3.length - 1;
             while (lastNonZeroIndex >= 0 && r3[lastNonZeroIndex] === 0) {
                 lastNonZeroIndex--;
             }
             const r3ToSplit = r3.slice(0, lastNonZeroIndex + 1);

             if (r3ToSplit.length === 0) continue;

            const { chunks, size } = r3SplitWChunks(r3ToSplit, getRandomValue, currentParams); // [cite: 58]

            expect(chunks.length).toBeGreaterThan(0); // Ensure chunks are produced

            for(let k=0; k < chunks.length; k++) { // [cite: 59]
                const chunk = chunks[k];
                const indexSize = size[k]; // Renamed from 'index' in Rust test to avoid confusion

                // Calculate sum of absolute values for the chunk
                const sum = chunk.reduce((acc, val) => acc + Math.abs(val), 0);

                expect(sum).toEqual(currentParams.W); // Weight must equal W [cite: 60]
                expect(chunk.length).toEqual(currentParams.P); // Chunk length must equal P [cite: 60]
                expect(indexSize).toBeLessThanOrEqual(currentParams.P); // Size must be <= P [cite: 60]
                expect(indexSize).toBeGreaterThanOrEqual(0); // Add non-negativity check for size
            }
        }
    });
});
