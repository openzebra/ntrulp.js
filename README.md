# NTRU Prime (ntrup.js)

[![npm version](https://img.shields.io/npm/v/@hicaru/ntrup.js.svg)](https://www.npmjs.com/package/@hicaru/ntrup.js)
[![license](https://img.shields.io/npm/l/@hicaru/ntrup.js.svg)](https://github.com/openzebra/ntrulp.js/blob/master/LICENSE)

A pure JavaScript implementation of the NTRU Prime post-quantum cryptography algorithm. This library is a JavaScript port of the [Rust NTRU Prime implementation](https://github.com/openzebra/ntrulp).

## Overview

NTRU Prime is a quantum-resistant public-key encryption algorithm and key encapsulation mechanism (KEM) based on the NTRU cryptosystem. This library provides a JavaScript implementation that can be used in both Node.js and browser environments.

## Features

- Pure JavaScript implementation with TypeScript type definitions
- Multiple parameter sets for different security levels
- Key generation, encryption, and decryption functions
- No native dependencies
- Compatible with browser and Node.js environments

## Installation

```bash
npm install @hicaru/ntrup.js
```

or using yarn:

```bash
yarn add @hicaru/ntrup.js
```

## Usage

### Basic Example

```typescript
import { generateKeyPair, staticBytesEncrypt, staticBytesDecrypt, params } from '@hicaru/ntrup.js';

// Generate a key pair
const rng = () => Math.random();
const { sk, pk } = generateKeyPair(rng, params);

// Convert keys to bytes for storage/transmission
const privateKeyBytes = sk.toBytes(params);
const publicKeyBytes = pk.toBytes(params);

// Example message (must be exactly the size of params.R3_BYTES)
const message = new Uint8Array(params.R3_BYTES).fill(42);

// Encrypt the message
const ciphertext = staticBytesEncrypt(message, pk, params);

// Decrypt the message
const decrypted = staticBytesDecrypt(ciphertext, sk, params);

// Verify the decryption was successful
console.log(
  'Decryption successful:',
  Array.from(message).toString() === Array.from(decrypted).toString()
);
```

### Choosing Parameter Sets

The library includes several parameter sets with different security levels:

```typescript
import { 
  params653,   // Level 1 - 128-bit classical/64-bit quantum security
  params761,   // Level 2 - 142-bit classical/71-bit quantum security
  params857,   // Level 3 - 161-bit classical/80-bit quantum security
  params953,   // Level 4 - 178-bit classical/89-bit quantum security
  params1013,  // Level 5 - 190-bit classical/95-bit quantum security
  params1277   // Level 6 - 240-bit classical/120-bit quantum security
} from '@hicaru/ntrup.js';

// Generate keys with a specific parameter set
const { sk, pk } = generateKeyPair(rng, params761);
```

By default, `params` is set to `params1277` for maximum security.

## Advanced Features

### Polynomial Operations

The library provides low-level access to polynomial operations in the R3 and Rq rings:

```typescript
import { R3, Rq, params } from '@hicaru/ntrup.js';

// Create polynomials
const f = R3.from(new Int8Array(params.P).fill(1), params);
const g = R3.from(new Int8Array(params.P).fill(-1), params);

// Perform polynomial multiplication
const h = f.mult(g, params);

// Convert between rings
const fRq = f.rqFromR3(params);
const hR3 = fRq.r3FromRq(params);
```

### Custom Random Number Generator

You can provide your own cryptographically secure random number generator:

```typescript
import { generateKeyPair, params } from '@hicaru/ntrup.js';
import { randomBytes } from 'crypto';

// Custom RNG using Node.js crypto
const secureRng = () => randomBytes(4).readUInt32LE(0) / 0xFFFFFFFF;

const { sk, pk } = generateKeyPair(secureRng, params);
```

## Parameter Details

| Parameter Set | P    | Q    | W   | Security Level               |
|--------------|------|------|-----|------------------------------|
| params653    | 653  | 4621 | 288 | 128-bit classical/64-bit quantum  |
| params761    | 761  | 4591 | 286 | 142-bit classical/71-bit quantum  |
| params857    | 857  | 5167 | 322 | 161-bit classical/80-bit quantum  |
| params953    | 953  | 6343 | 396 | 178-bit classical/89-bit quantum  |
| params1013   | 1013 | 7177 | 448 | 190-bit classical/95-bit quantum  |
| params1277   | 1277 | 7879 | 492 | 240-bit classical/120-bit quantum |

Where:
- P: Polynomial degree
- Q: Modulus for coefficients
- W: Hamming weight for small polynomials

## API Reference

### Configuration

```typescript
interface ParamsConfig {
  P: number;              // Polynomial degree
  Q: number;              // Modulus for coefficients
  W: number;              // Hamming weight for small polynomials
  Q12: number;            // (Q-1)/2
  R3_BYTES: number;       // Byte size for R3 polynomials
  RQ_BYTES: number;       // Byte size for Rq polynomials
  PUBLICKEYS_BYTES: number; // Byte size for public keys
  SECRETKEYS_BYTES: number; // Byte size for secret keys
  DIFFICULT: number;      // Difficulty parameter for weight challenges
}
```

### Key Management

```typescript
// Generate a key pair
function generateKeyPair(
  rng: () => number,
  params: ParamsConfig,
  maxAttempts?: number
): { sk: PrivKey, pk: PubKey };

// PrivKey class methods
class PrivKey {
  static compute(f: Rq, g: R3, params: ParamsConfig): PrivKey;
  static import(skBytes: Uint8Array, params: ParamsConfig): PrivKey;
  toBytes(params: ParamsConfig): Uint8Array;
}

// PubKey class methods
class PubKey extends Rq {
  static compute(f: Rq, g: R3, params: ParamsConfig): PubKey;
  static fromSk(privKey: PrivKey, params: ParamsConfig): PubKey;
  static import(bytes: Uint8Array, params: ParamsConfig): PubKey;
}
```

### Encryption/Decryption

```typescript
// Encrypt a message with a public key
function staticBytesEncrypt(
  bytes: Uint8Array,
  pubKey: PubKey,
  params: ParamsConfig
): Uint8Array;

// Decrypt a ciphertext with a private key
function staticBytesDecrypt(
  cipherBytes: Uint8Array,
  privKey: PrivKey,
  params: ParamsConfig
): Uint8Array;

// Lower-level functions
function r3Encrypt(r: R3, pubKey: PubKey, params: ParamsConfig): Rq;
function rqDecrypt(c: Rq, privKey: PrivKey, params: ParamsConfig): R3;
```

### Polynomial Rings

```typescript
// R3 class for polynomials modulo 3
class R3 {
  static from(coeffs: Int8Array | number[], params: ParamsConfig): R3;
  eqZero(): boolean;
  eqOne(): boolean;
  mult(g3: R3, params: ParamsConfig): R3;
  recip(params: ParamsConfig): R3;
  rqFromR3(params: ParamsConfig): Rq;
  toBytes(params: ParamsConfig): Uint8Array;
}

// Rq class for polynomials modulo q
class Rq {
  static from(coeffs: Int16Array | Int8Array | number[], params: ParamsConfig): Rq;
  eqZero(): boolean;
  eqOne(): boolean;
  multR3(gq: R3, params: ParamsConfig): Rq;
  recip<T extends number>(ratio: T, params: ParamsConfig): Rq;
  multInt(num: number, params: ParamsConfig): Rq;
  r3FromRq(params: ParamsConfig): R3;
  toBytes(params: ParamsConfig): Uint8Array;
}
```

## Security Considerations

- Always use a cryptographically secure random number generator for key generation
- The default parameter set (params1277) offers the highest security level
- This library has not undergone formal security audits

## Limitations

- Pure JavaScript implementation may be slower than native implementations
- Large parameter sets may impact performance, especially in browser environments

## License

MIT

## Credits

This library is a JavaScript port of the [Rust NTRU Prime implementation](https://github.com/openzebra/ntrulp) by OpenZebra.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
