const V = 0x80000000;

export function i16NonzeroMask(x: number): number {
  const u = x & 0xFFFF;
  let v = u;
  v = v ? ~(v - 1) : 0;
  v >>>= 31;
  return v ? -1 : 0;
}

export function i16NegativeMask(x: number): number {
  const u = x & 0xFFFF;
  const u15 = u >>> 15;
  return u15 == 0 ? u15 : -u15;
}

export function u32DivmodU14(x: number, m: number): [number, number] {
  let v = V;
  let qpart: number;
  v = Math.floor(v / m);
  
  let q = 0;
  qpart = Math.floor((x * v) / 0x80000000);
  let newX = x - qpart * m;
  
  q += qpart;
  qpart = Math.floor((newX * v) / 0x80000000);
  let finalX = newX - qpart * m;
  
  q += qpart;
  let subX = finalX - m;
  
  q += 1;
  const mask = (subX >>> 31) !== 0 ? 0xFFFFFFFF : 0;
  
  const addedX = subX + (mask & m);
  const finalQ = q + mask;
  
  return [finalQ >>> 0, addedX >>> 0];
}

export function i32DivmodU14(x: number, m: number): [number, number] {
  const px = V;
  const [mut_uq, ur] = u32DivmodU14((px + x) >>> 0, m);
  let mut_ur = ur;
  const [uq2, ur2] = u32DivmodU14(px, m);
  
  mut_ur = mut_ur - ur2;
  let uq = mut_uq - uq2;
  
  const mask = (mut_ur >>> 15) !== 0 ? 0xFFFFFFFF : 0;
  
  mut_ur = (mut_ur + (mask & m)) >>> 0;
  uq = (uq + mask) >>> 0;
  
  return [uq, mut_ur];
}

export function i32ModU14(x: number, m: number): number {
  return i32DivmodU14(x, m)[1];
}

export function u32ModU14(x: number, m: number): number {
  return u32DivmodU14(x, m)[1];
}

export function weightWMask(r: Int8Array, W: number): number {
  const weight = r.reduce((sum, x) => sum + (x & 1), 0);
  return i16NonzeroMask(weight - W);
}
