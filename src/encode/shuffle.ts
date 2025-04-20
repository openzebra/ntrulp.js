import { ParamsConfig } from '../params';
import { ChaChaRng } from '@hicaru/chacharand.js';
import { ErrorType } from '../errors';

export function shuffleArray<T>(arr: T[], seed: bigint, params: ParamsConfig): void {
    if (arr.length !== params.P) {
        throw new Error(ErrorType.SliceLengthNotR3Size);
    }

    const n = params.P;
    const rng = ChaChaRng.fromU64Seed(seed, 20);

    for (let i = 0; i < n; i++) {
        const j = rng.genRangeU32(0, n);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

export function unshuffleArray<T>(arr: T[], seed: bigint, params: ParamsConfig): void {
    if (arr.length !== params.P) {
        throw new Error(ErrorType.SliceLengthNotR3Size);
    }

    const n = params.P;
    const rng = ChaChaRng.fromU64Seed(seed, 20);

    const indexList: number[] = [];
    for (let i = 0; i < n; i++) {
        const j = rng.genRangeU32(0, n);
        indexList.push(j);
    }

    for (let i = n - 1; i >= 0; i--) {
        const j = indexList[i];
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
