/* eslint-disable */
import bigInt from "big-integer";
import { DH_PRIME } from "@env";



function nextPrime(n: bigInt.BigInteger): bigInt.BigInteger {
    if (n.equals(0) || n.equals(1)) return bigInt(2);
    if (n.mod(2).equals(0)) n = n.add(1);

    while (!n.isPrime()) {
        n = n.add(2);
    }
    return n;
}

export function generateKeys() {
    // Step 1: Choose a large prime number 'p'
    const prime = bigInt(DH_PRIME);

    // Step 2: Choose a generator 'g'
    const gen = bigInt(2); // For simplicity, we'll use 2 as the generator

    // Step 3: Choose a private key 'a' for Alice
    const privateKey = bigInt.randBetween(bigInt(2), prime.minus(2));

    // Step 4: Calculate the public key 'A' for Alice
    const publicKey = gen.modPow(privateKey, prime);

    return { prime, privateKey, publicKey };
}

export function generateSharedSecret(privateKey: bigInt.BigInteger, publicKey: bigInt.BigInteger, prime: bigInt.BigInteger): string {
    return publicKey.modPow(privateKey, prime).toString();
}