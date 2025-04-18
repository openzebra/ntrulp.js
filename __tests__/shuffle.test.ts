import { describe, it, expect } from 'vitest';
import { shuffleArray, unshuffleArray } from '../src/encode/shuffle'; 
import { params } from '../src/params';

describe('Shuffle Tests', () => {
    const testSeed = 1234567890123456789n; 
    const P = params.P;

    it('should shuffle an array deterministically', () => {
        const originalArray1 = Array.from({ length: P }, (_, i) => i);
        const arrayToShuffle1 = [...originalArray1];

        shuffleArray(arrayToShuffle1, testSeed, params);

        // Check that the array is actually shuffled (highly likely for large P)
        expect(arrayToShuffle1).not.toEqual(originalArray1);
        // Check length remains the same
        expect(arrayToShuffle1.length).toBe(P);

        // Shuffle another identical array with the same seed
        const originalArray2 = Array.from({ length: P }, (_, i) => i);
        const arrayToShuffle2 = [...originalArray2];
        shuffleArray(arrayToShuffle2, testSeed, params);

        // Check that the results are identical (deterministic)
        expect(arrayToShuffle1).toEqual(arrayToShuffle2);
    });

    it('unshuffleArray should reverse shuffleArray with the same seed', () => {
        const originalArray = Array.from({ length: P }, (_, i) => i * 3 - P); // Some sample data
        const shuffledArray = [...originalArray];

        shuffleArray(shuffledArray, testSeed, params);

        // Ensure it's shuffled first
        expect(shuffledArray).not.toEqual(originalArray);

        const unshuffledArray = [...shuffledArray];
        unshuffleArray(unshuffledArray, testSeed, params);

        // Check if it's back to the original state
        expect(unshuffledArray).toEqual(originalArray);
    });

     it('unshuffleArray with different seed should not restore original array', () => {
        const originalArray = Array.from({ length: P }, (_, i) => i);
        const shuffledArray = [...originalArray];
        const wrongSeedTest = testSeed + 1n;

        shuffleArray(shuffledArray, testSeed, params);
        expect(shuffledArray).not.toEqual(originalArray); // Make sure it shuffled

        const unshuffledArray = [...shuffledArray];
        unshuffleArray(unshuffledArray, wrongSeedTest, params); // Use wrong seed

        // It's extremely unlikely to unshuffle correctly with the wrong seed
        expect(unshuffledArray).not.toEqual(originalArray);
    });
});
