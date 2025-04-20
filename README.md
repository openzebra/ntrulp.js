# ntrup.js

[![npm](https://img.shields.io/npm/v/@hicaru/ntrup.js)](https://www.npmjs.com/package/@hicaru/ntrup.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pure JavaScript implementation of the NTRU Prime post-quantum cryptography algorithm. This library is a TypeScript/JavaScript port of the [Rust NTRU Prime implementation](https://github.com/openzebra/ntrulp).

## What is NTRU Prime?

NTRU Prime is a lattice-based key encapsulation mechanism (KEM) that is believed to be secure against quantum computer attacks. It was designed to avoid potential security issues in other lattice-based cryptosystems while maintaining efficiency.

The NTRU Prime algorithm was proposed by Daniel J. Bernstein, Chitchanok Chuengsatiansup, Tanja Lange, and Christine van Vredendaal in their paper ["NTRU Prime: Reducing Attack Surface at Low Cost"](https://ntruprime.cr.yp.to/ntruprime-20170816.pdf).

## Features

- Pure JavaScript implementation with TypeScript typings
- Multiple parameter sets for different security levels (653, 761, 857, 953, 1013, 1277)
- Key generation, encryption, and decryption functionality
- No external dependencies apart from [@hicaru/chacharand.js](https://www.npmjs.com/package/@hicaru/chacharand.js) for randomness

## Installation

```bash
npm install @hicaru/ntrup.js
```

## Usage

### Basic Usage

```typescript
import { 
  generateKeyPair, 
  encrypt, 
  decrypt, 
  params1277 
} from '@hicaru/ntrup.js';

// Generate a key pair
const { publicKey, privateKey } = generateKeyPair(params1277);

// Encrypt a message
const message = new Uint8Array([1, 2, 3, 4, 5]); // Your message
const ciphertext = encrypt(message, publicKey, params1277);

// Decrypt the message
const decrypted = decrypt(ciphertext, privateKey, params1277);
```

### Specifying Parameter Sets

The library provides multiple parameter sets with different security levels:

```typescript
import { 
  generateKeyPair, 
  params653,  // Lower security, better performance
  params761,
  params857,
  params953,
  params1013,
  params1277  // Higher security, default
} from '@hicaru/ntrup.js';

// Generate key pair with specified parameters
const { publicKey, privateKey } = generateKeyPair(params761);
```

### Key Export/Import

```typescript
import { 
  generateKeyPair, 
  importPublicKey,
  importPrivateKey,
  params1277 
} from '@hicaru/ntrup.js';

// Generate a key pair
const { publicKey, privateKey } = generateKeyPair(params1277);

// Export keys to bytes
const publicKeyBytes = publicKey.toBytes(params1277);
const privateKeyBytes = privateKey.toBytes(params1277);

// Import keys from bytes
const importedPublicKey = importPublicKey(publicKeyBytes, params1277);
const importedPrivateKey = importPrivateKey(privateKeyBytes, params1277);
```

## API Reference

### Key Generation

#### `generateKeyPair(params: ParamsConfig): { publicKey: PubKey, privateKey: PrivKey }`

Generates a new NTRU Prime key pair.

- `params`: Parameter set configuration (e.g., `params1277`)
- Returns: Object containing public and private keys

### Encryption/Decryption

#### `encrypt(message: Uint8Array, publicKey: PubKey, params: ParamsConfig): Uint8Array`

Encrypts a message using the recipient's public key.

- `message`: The plaintext message as a Uint8Array
- `publicKey`: Recipient's public key
- `params`: Parameter set configuration
- Returns: Encrypted ciphertext as Uint8Array

#### `decrypt(ciphertext: Uint8Array, privateKey: PrivKey, params: ParamsConfig): Uint8Array`

Decrypts a message using the recipient's private key.

- `ciphertext`: The encrypted message as a Uint8Array
- `privateKey`: Recipient's private key
- `params`: Parameter set configuration
- Returns: Decrypted plaintext as Uint8Array

### Key Import/Export

#### `importPublicKey(bytes: Uint8Array, params: ParamsConfig): PubKey`

Imports a public key from its byte representation.

- `bytes`: Byte representation of the public key
- `params`: Parameter set configuration
- Returns: PubKey object

#### `importPrivateKey(bytes: Uint8Array, params: ParamsConfig): PrivKey`

Imports a private key from its byte representation.

- `bytes`: Byte representation of the private key
- `params`: Parameter set configuration
- Returns: PrivKey object

### Parameter Sets

The library provides the following parameter sets, each offering different security levels and performance trade-offs:

| Parameter Set | Polynomial Degree | Prime Modulus | Weight | Security Level |
|---------------|------------------|--------------|--------|---------------|
| params653     | 653              | 4621         | 288    | 4 (lowest)    |
| params761     | 761              | 4591         | 286    | 6             |
| params857     | 857              | 5167         | 322    | 8             |
| params953     | 953              | 6343         | 396    | 10            |
| params1013    | 1013             | 7177         | 448    | 12            |
| params1277    | 1277             | 7879         | 492    | 14 (highest)  |

## Advanced Usage

### Using Custom Random Number Generator

```typescript
import { 
  generateKeyPairWithRng, 
  params1277 
} from '@hicaru/ntrup.js';

// Custom RNG function
const customRng = () => Math.random(); // Example, use a cryptographically secure RNG in practice

// Generate key pair with custom RNG
const { publicKey, privateKey } = generateKeyPairWithRng(customRng, params1277);
```

### Low-Level Polynomial Operations

For advanced users who need access to the underlying polynomial operations:

```typescript
import { 
  R3, 
  Rq, 
  params1277 
} from '@hicaru/ntrup.js';

// Create polynomials
const r3Poly = new R3(params1277);
const rqPoly = new Rq(params1277);

// Perform operations
const product = rqPoly.multR3(r3Poly, params1277);
```

## Error Handling

The library throws specific error types from the `ErrorType` enum:

```typescript
import { 
  encrypt, 
  ErrorType,
  params1277 
} from '@hicaru/ntrup.js';

try {
  // Attempt encryption
  const ciphertext = encrypt(message, publicKey, params1277);
} catch (error) {
  if (error === ErrorType.ByteslengthError) {
    console.error('Invalid byte length');
  } else if (error === ErrorType.KemError) {
    console.error('General KEM error');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Security Considerations

- This library is provided as-is without any security guarantees
- For production use, consider using audited implementations or standard libraries
- The security of the implementation depends on the quality of randomness provided
- Always use cryptographically secure random number generators for key generation

## Performance

NTRU Prime operations can be computationally intensive. The different parameter sets provide a trade-off between security and performance:

- Lower parameter sets (e.g., params653) offer better performance with lower security
- Higher parameter sets (e.g., params1277) offer stronger security at the cost of performance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Based on the [Rust NTRU Prime implementation](https://github.com/openzebra/ntrulp)
- NTRU Prime algorithm by Daniel J. Bernstein, Chitchanok Chuengsatiansup, Tanja Lange, and Christine van Vredendaal
