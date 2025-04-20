import { describe, it, expect } from 'vitest';
import { shuffleArray, unshuffleArray } from '../src/encode/shuffle'; 
import { params1277, ParamsConfig } from '../src/params';
import { ErrorType} from '../src/errors';

describe('shuffleArray and unshuffleArray', () => {
    it('should shuffle and then correctly unshuffle an array using params1277', () => {
        const seed = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
        const originalArr: number[] = Array.from({ length: params1277.P }, (_, i) => i);
        const arr = [...originalArr];

        shuffleArray(arr, seed, params1277);

        expect(arr).not.toEqual(originalArr);
        expect(arr.length).toEqual(params1277.P);

        unshuffleArray(arr, seed, params1277);

        expect(arr).toEqual(originalArr);
    });

    it('should throw an error if array length does not match params.P using params1277', () => {
        const seed = 12345n;
        const shortArr = Array.from({ length: params1277.P - 1 }, (_, i) => i);
        const longArr = Array.from({ length: params1277.P + 1 }, (_, i) => i);

        const expectedErrorMessage = (len: number) => ErrorType.SliceLengthNotR3Size;

        expect(() => shuffleArray(shortArr, seed, params1277)).toThrow(expectedErrorMessage(shortArr.length));
        expect(() => shuffleArray(longArr, seed, params1277)).toThrow(expectedErrorMessage(longArr.length));

        expect(() => unshuffleArray(shortArr, seed, params1277)).toThrow(expectedErrorMessage(shortArr.length));
        expect(() => unshuffleArray(longArr, seed, params1277)).toThrow(expectedErrorMessage(longArr.length));
    });

    it('should handle different data types with a small P', () => {
        const localParams: ParamsConfig = { ...params1277, P: 5 };
        const seed = 98765n;
        const stringArr = ['x', 'y', 'z', 'w', 'v'];
        const originalStringArr = [...stringArr];
        const objArr = [{val:10}, {val:20}, {val:30}, {val:40}, {val:50}];
        const originalObjArr = objArr.map(o => ({...o}));

        shuffleArray(stringArr, seed, localParams);
        expect(stringArr).not.toEqual(originalStringArr);
        unshuffleArray(stringArr, seed, localParams);
        expect(stringArr).toEqual(originalStringArr);

        shuffleArray(objArr, seed, localParams);
        expect(objArr).not.toEqual(originalObjArr);
        unshuffleArray(objArr, seed, localParams);
        expect(objArr).toEqual(originalObjArr);
    });
});
