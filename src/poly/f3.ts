export function freeze(a: number): number {
  const a_32 = a;
  const b = a_32 - (3 * Math.floor((10923 * a_32) / 32768));
  
  const c = b - (3 * Math.floor((89478485 * b + 134217728) / 268435456));

  return c;
}

export function round(a: number[]): void {
  for (let i = 0; i < a.length; i++) {
    a[i] -= freeze(a[i]);
  }
}
