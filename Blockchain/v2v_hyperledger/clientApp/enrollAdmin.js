'use strict';
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
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

 
async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(process.env.FABRIC_HOME, 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
 
        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
 
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
 
        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }
 
        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');


        // Generate a pair of RSA keys (public and private)
        saveKeysToFile();
 
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}
 
main();