const crypto = require('crypto');

// Generate a pair of RSA keys (public and private)
function generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // Key size in bits
        publicKeyEncoding: {
            type: 'spki', // Recommended public key encoding
            format: 'pem', // Output format
        },
        privateKeyEncoding: {
            type: 'pkcs8', // Recommended private key encoding
            format: 'pem',
        },
    });
}

// Sign a message using the private key
function signMessage(message, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();

    // Generate the signature in base64 format
    const signature = sign.sign(privateKey, 'base64');
    return signature;
}

// Verify the signature using the public key
function verifySignature(message, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();

    // Verify the signature
    return verify.verify(publicKey, signature, 'base64');
}

// Main process
const { publicKey, privateKey } = generateKeyPair();

// JSON message to be signed
const jsonMessage = {
    name: "Alice",
    vehicle: {
        model: "Tesla Model S",
        VIN: "5YJSA1E26JF123456",
    },
    timestamp: new Date().toISOString(),
};

// Step 1: Convert JSON to string
const message = JSON.stringify(jsonMessage);

// Step 1: Sign the message with the private key
const signature = signMessage(message, privateKey);

console.log("Original Message: ", message);
console.log("Signature: ", signature);

// Step 2: Verify the message using the public key
const isVerified = verifySignature(message, signature, publicKey);

console.log("Is the signature valid? ", isVerified);
