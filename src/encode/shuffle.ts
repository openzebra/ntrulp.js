import { ParamsConfig } from '../params';
import { ErrorType } from '../errors';
import { ChaChaRng } from '@hicaru/chacharand.js';

export function shuffleArray<T>(arr: T[], seed: bigint, params: ParamsConfig): void {
    if (arr.length !== params.P) {
        throw new Error(ErrorType.SliceLengthNotR3Size);
    }

    const n = params.P;
    const rng = ChaChaRng.fromU64Seed(seed, 20);

    for (let i = 0; i < n; i++) {
        const j = rng();

        if (j < 0 || j >= n) {
             throw new Error(ErrorType.OutOfRange);
        }

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

export function unshuffleArray<T>(arr: T[], seed: bigint, params: ParamsConfig): void {
     if (arr.length !== params.P) {
        throw new Error(ErrorType.SliceLengthNotR3Size);
    }
    const n = params.P;
    const rng = createInternalIntPrng(seed, n);
    const indexList: number[] = [];

    for (let i = 0; i < n; i++) {
        const j = rng();
         if (j < 0 || j >= n) {
             throw new Error(ErrorType.OutOfRange);
         }
        indexList.push(j);
    }

    for (let i = n - 1; i >= 0; i--) {
        const j = indexList[i];
         if (i >= n || j >= n || i < 0 || j < 0) {
             throw new Error(ErrorType.OutOfRange);
         }
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

