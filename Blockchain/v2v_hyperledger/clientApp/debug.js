const fs = require('fs');
const path = require('path');
const crypto = require('crypto');



function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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

    return { publicKey, privateKey };
}

// Function to save keys to files
function saveKeysToFile() {
    const keys = generateKeyPair();

    // Define the file paths
    const publicKeyPath = path.join(__dirname, 'public_key.pem');
    const privateKeyPath = path.join(__dirname, 'private_key.pem');

    // Write the public and private keys to files
    fs.writeFileSync(publicKeyPath, keys.publicKey);
    fs.writeFileSync(privateKeyPath, keys.privateKey);

    console.log('Keys generated and saved successfully!');
}


saveKeysToFile();