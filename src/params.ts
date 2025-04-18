export interface ParamsConfig {
  P: number;
  Q: number;
  W: number;
  Q12: number;
  R3_BYTES: number;
  RQ_BYTES: number;
  PUBLICKEYS_BYTES: number;
  SECRETKEYS_BYTES: number;
  DIFFICULT: number;
}

export const params653: ParamsConfig = {
  P: 653,
  Q: 4621,
  W: 288,
  Q12: 2310,   // (4621 - 1) / 2
  R3_BYTES: 164,  // (653 + 3) / 4
  RQ_BYTES: 1306,  // 653 * 2
  PUBLICKEYS_BYTES: 1306,  // 653 * 2
  SECRETKEYS_BYTES: 328,  // 164 * 2
  DIFFICULT: 4
};

export const params761: ParamsConfig = {
  P: 761,
  W: 286,
  Q: 4591,
  Q12: 2295,  // (4591 - 1) / 2
  R3_BYTES: 191,  // (761 + 3) / 4
  RQ_BYTES: 1522,  // 761 * 2
  PUBLICKEYS_BYTES: 1522,  // 761 * 2
  SECRETKEYS_BYTES: 382,  // 191 * 2
  DIFFICULT: 6
};

export const params857: ParamsConfig = {
  P: 857,
  W: 322,
  Q: 5167,
  Q12: 2583,  // (5167 - 1) / 2
  R3_BYTES: 215,  // (857 + 3) / 4
  RQ_BYTES: 1714,  // 857 * 2
  PUBLICKEYS_BYTES: 1714,  // 857 * 2
  SECRETKEYS_BYTES: 430,  // 215 * 2
  DIFFICULT: 8
};

export const params953: ParamsConfig = {
  P: 953,
  Q: 6343,
  W: 396,
  Q12: 3171,  // (6343 - 1) / 2
  R3_BYTES: 239,  // (953 + 3) / 4
  RQ_BYTES: 1906,  // 953 * 2
  PUBLICKEYS_BYTES: 1906,  // 953 * 2
  SECRETKEYS_BYTES: 478,  // 239 * 2
  DIFFICULT: 10
};

export const params1013: ParamsConfig = {
  P: 1013,
  Q: 7177,
  W: 448,
  Q12: 3588,  // (7177 - 1) / 2
  R3_BYTES: 254,  // (1013 + 3) / 4
  RQ_BYTES: 2026,  // 1013 * 2
  PUBLICKEYS_BYTES: 2026,  // 1013 * 2
  SECRETKEYS_BYTES: 508,  // 254 * 2
  DIFFICULT: 12
};

export const params1277: ParamsConfig = {
  P: 1277,
  Q: 7879,
  W: 492,
  Q12: 3939,  // (7879 - 1) / 2
  R3_BYTES: 320,  // (1277 + 3) / 4
  RQ_BYTES: 2554,  // 1277 * 2
  PUBLICKEYS_BYTES: 2554,  // 1277 * 2
  SECRETKEYS_BYTES: 640,  // 320 * 2
  DIFFICULT: 14
};

export const params: ParamsConfig = params1277;
