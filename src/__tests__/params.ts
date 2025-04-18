// params.test.ts
import { expect, describe, test } from 'vitest';
import { 
  params,
  params653, 
  params761, 
  params857, 
  params953, 
  params1013, 
  params1277 
} from '../src/params';

describe('NTRU Prime Parameter Sets', () => {
  test('params653 has correct values', () => {
    expect(params653.P).toBe(653);
    expect(params653.Q).toBe(4621);
    expect(params653.W).toBe(288);
    expect(params653.Q12).toBe(2310);
    expect(params653.R3_BYTES).toBe(164);
    expect(params653.RQ_BYTES).toBe(1306);
    expect(params653.PUBLICKEYS_BYTES).toBe(1306);
    expect(params653.SECRETKEYS_BYTES).toBe(328);
    expect(params653.DIFFICULT).toBe(4);
  });

  test('params761 has correct values', () => {
    expect(params761.P).toBe(761);
    expect(params761.Q).toBe(4591);
    expect(params761.W).toBe(286);
    expect(params761.Q12).toBe(2295);
    expect(params761.R3_BYTES).toBe(191);
    expect(params761.RQ_BYTES).toBe(1522);
    expect(params761.PUBLICKEYS_BYTES).toBe(1522);
    expect(params761.SECRETKEYS_BYTES).toBe(382);
    expect(params761.DIFFICULT).toBe(6);
  });

  test('params857 has correct values', () => {
    expect(params857.P).toBe(857);
    expect(params857.Q).toBe(5167);
    expect(params857.W).toBe(322);
    expect(params857.Q12).toBe(2583);
    expect(params857.R3_BYTES).toBe(215);
    expect(params857.RQ_BYTES).toBe(1714);
    expect(params857.PUBLICKEYS_BYTES).toBe(1714);
    expect(params857.SECRETKEYS_BYTES).toBe(430);
    expect(params857.DIFFICULT).toBe(8);
  });

  test('params953 has correct values', () => {
    expect(params953.P).toBe(953);
    expect(params953.Q).toBe(6343);
    expect(params953.W).toBe(396);
    expect(params953.Q12).toBe(3171);
    expect(params953.R3_BYTES).toBe(239);
    expect(params953.RQ_BYTES).toBe(1906);
    expect(params953.PUBLICKEYS_BYTES).toBe(1906);
    expect(params953.SECRETKEYS_BYTES).toBe(478);
    expect(params953.DIFFICULT).toBe(10);
  });

  test('params1013 has correct values', () => {
    expect(params1013.P).toBe(1013);
    expect(params1013.Q).toBe(7177);
    expect(params1013.W).toBe(448);
    expect(params1013.Q12).toBe(3588);
    expect(params1013.R3_BYTES).toBe(254);
    expect(params1013.RQ_BYTES).toBe(2026);
    expect(params1013.PUBLICKEYS_BYTES).toBe(2026);
    expect(params1013.SECRETKEYS_BYTES).toBe(508);
    expect(params1013.DIFFICULT).toBe(12);
  });

  test('params1277 has correct values', () => {
    expect(params1277.P).toBe(1277);
    expect(params1277.Q).toBe(7879);
    expect(params1277.W).toBe(492);
    expect(params1277.Q12).toBe(3939);
    expect(params1277.R3_BYTES).toBe(320);
    expect(params1277.RQ_BYTES).toBe(2554);
    expect(params1277.PUBLICKEYS_BYTES).toBe(2554);
    expect(params1277.SECRETKEYS_BYTES).toBe(640);
    expect(params1277.DIFFICULT).toBe(14);
  });

  test('default params is params1277', () => {
    expect(params).toBe(params1277);
  });

  test('verifies correct mathematical relationships', () => {
    // Test (Q-1)/2 = Q12 for each parameter set
    expect(Math.floor((params653.Q - 1) / 2)).toBe(params653.Q12);
    expect(Math.floor((params761.Q - 1) / 2)).toBe(params761.Q12);
    expect(Math.floor((params857.Q - 1) / 2)).toBe(params857.Q12);
    expect(Math.floor((params953.Q - 1) / 2)).toBe(params953.Q12);
    expect(Math.floor((params1013.Q - 1) / 2)).toBe(params1013.Q12);
    expect(Math.floor((params1277.Q - 1) / 2)).toBe(params1277.Q12);

    // Test (P+3)/4 = R3_BYTES for each parameter set
    expect(Math.floor((params653.P + 3) / 4)).toBe(params653.R3_BYTES);
    expect(Math.floor((params761.P + 3) / 4)).toBe(params761.R3_BYTES);
    expect(Math.floor((params857.P + 3) / 4)).toBe(params857.R3_BYTES);
    expect(Math.floor((params953.P + 3) / 4)).toBe(params953.R3_BYTES);
    expect(Math.floor((params1013.P + 3) / 4)).toBe(params1013.R3_BYTES);
    expect(Math.floor((params1277.P + 3) / 4)).toBe(params1277.R3_BYTES);

    // Test P*2 = RQ_BYTES for each parameter set
    expect(params653.P * 2).toBe(params653.RQ_BYTES);
    expect(params761.P * 2).toBe(params761.RQ_BYTES);
    expect(params857.P * 2).toBe(params857.RQ_BYTES);
    expect(params953.P * 2).toBe(params953.RQ_BYTES);
    expect(params1013.P * 2).toBe(params1013.RQ_BYTES);
    expect(params1277.P * 2).toBe(params1277.RQ_BYTES);
  });
});
