'use strict';

const express = require('express');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const forge = require('node-forge');

const app = express();
app.use(express.json());

// Helper function to generate a public-private key pair
function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return { publicKey, privateKey };
}

// Load connection profile and wallet for Hyperledger Fabric
async function getContract() {
    const ccpPath = path.resolve(process.env.FABRIC_HOME, 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('appUser');
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel'); 
    const contract = network.getContract('mycontract'); 

    return contract;
}

// Check if user already exists
async function checkUserExists(contract, id) {
    let user = await contract.evaluateTransaction('queryUser', id)
    user = user.toString();
    console.log(user);
    return user !== '0'; // If user exists, it will return user data, otherwise '0'
}

function getDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
         month = '0'+month;
    }
    if(day.toString().length == 1) {
         day = '0'+day;
    }   
    if(hour.toString().length == 1) {
         hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
         minute = '0'+minute;
    }
    if(second.toString().length == 1) {
         second = '0'+second;
    }   
    var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;
}

// Verify digital signature
function verifySignature(message, publicKey, signature) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
}

// POST request for user registration
app.post('/register', async (req, res) => {
    const { id, name, age, gender } = req.body;

    if (!id || !name || !age || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Get the contract
        const contract = await getContract();

        // Check if the user already exists
        const userExists = await checkUserExists(contract, id);
        if (userExists) {
            return res.status(400).json({ error: `User with id ${id} already exists` });
        }

        // Generate public-private key pair
        const { publicKey, privateKey } = generateKeyPair();

        const registerDate = getDateTime();

        // Create user with status 'pending'
        await contract.submitTransaction(
            'createUser',
            id,
            name,
            age,
            gender,
            'pending', // Status set to pending
            publicKey,
            registerDate
        );

        // Return the user id, public key, and private key
        res.json({ id, publicKey, privateKey });

    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        res.status(500).json({ error: 'Failed to register user' });
    }
});


// POST request for updating user information
app.post('/update', async (req, res) => {
    const { id, publicKey, signature, updates } = req.body;
    
    if (!id || !publicKey || !signature || !updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'All fields (id, publicKey, signature, updates) are required' });
    }

    try {
        // Get the contract
        const contract = await getContract();

        // Check if the user exists by ID
        const userAsBytes = await contract.evaluateTransaction('queryUser', id);
        if (userAsBytes === '0') {
            return res.status(404).json({ error: `User with id ${id} does not exist` });
        }

        // Parse the user data from the blockchain
        const user = JSON.parse(userAsBytes.toString());

        // Verify that the provided public key matches the stored public key
        if (user.publicKey !== publicKey) {
            return res.status(403).json({ error: 'Public key does not match stored public key' });
        }

        // Create the message to verify (e.g., using the user ID or update details as the message)
        let message = updates;
        message['id'] = id;
        message = JSON.stringify(message);

        console.log(message);

        // Verify the digital signature
        const isSignatureValid = verifySignature(message, publicKey, signature);
        if (!isSignatureValid) {
            return res.status(403).json({ error: 'Signature verification failed' });
        }

        // Update the user's fields with the new values
        for (let key in updates) {
            if (user.hasOwnProperty(key)) {
                if (['registerDate', 'publicKey', 'status'].includes(key)) {
                    return res.status(403).json({ error: `Can't update Field: ${key}` });
                }
                user[key] = updates[key];
            }
        }

        // Save the updated user to the blockchain
        await contract.submitTransaction(
            'createUser',
            user.id,
            user.name,
            user.age,
            user.gender,
            user.status,
            user.publicKey,
            user.registerDate
        );

        res.json({ message: 'User information updated successfully', updatedUser: user });

    } catch (error) {
        console.error(`Failed to update user: ${error}`);
        res.status(500).json({ error: 'Failed to update user information' });
    }
});





// Function to load keys from files
function loadKeysFromFile() {

      /*   .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\r?\n|\r/g, ''); // Remove newlines for clean comparison*/

    // Define the file paths
    const publicKeyPath = path.join(__dirname, 'public_key.pem');
    //const privateKeyPath = path.join(__dirname, 'private_key.pem');

    // Read the public and private keys from files
    const storedPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
    //const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    return storedPublicKey;
}




// POST request for querying by attribute and max date with signature verification
app.post('/admin_update', async (req, res) => {

    const { publicKey, signature, updates } = req.body;

    // Check if all required fields are present
    if (!publicKey || !signature || !updates) {
        return res.status(400).json({ error: 'publicKey, signature, and updates are required' });
    }

    try {
        // Extract the public key from the admin.id certificate
        const storedPublicKey = loadKeysFromFile();

        // Compare the provided public key with the one from the admin.id file
        if (publicKey !== storedPublicKey.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\r?\n|\r/g, '')) {
            return res.status(403).json({ error: 'Public key does not match the admin' });
        }

        // Verify the digital signature
        const isSignatureValid = verifySignature(JSON.stringify(updates), storedPublicKey, signature);
        if (!isSignatureValid) {
            return res.status(403).json({ error: 'Signature verification failed' });
        }



        if (! updates.hasOwnProperty('id')) {
            return res.status(400).json({ error: 'Missing required fields in updates (id)' });
        }


        // Get the contract
        const contract = await getContract();
        const id = updates.id;

        // Check if the user exists by ID
        const userAsBytes = await contract.evaluateTransaction('queryUser', id);
        if (userAsBytes === '0') {
            return res.status(404).json({ error: `User with id ${id} does not exist` });
        }


        // Parse the user data from the blockchain
        const user = JSON.parse(userAsBytes.toString());

        // Update the user's fields with the new values
        for (let key in updates) {
            if (user.hasOwnProperty(key)) {
                user[key] = updates[key];
            }
        }

        // Save the updated user to the blockchain
        await contract.submitTransaction(
            'createUser',
            user.id,
            user.name,
            user.age,
            user.gender,
            user.status,
            user.publicKey,
            user.registerDate
        );

        res.json({ message: 'User information updated successfully', updatedUser: user });





    } catch (error) {
        console.error(`Failed to query: ${error}`);
        res.status(500).json({ error: 'Failed to admin update' });
    }
});


app.post('/admin_query', async (req, res) => {

    const { publicKey, signature, message } = req.body;

    // Check if all required fields are present
    if (!publicKey || !signature || !message) {
        return res.status(400).json({ error: 'publicKey, signature, and message are required' });
    }

    try {
        // Extract the public key from the admin.id certificate
        const storedPublicKey = loadKeysFromFile();

        // Compare the provided public key with the one from the admin.id file
        if (publicKey !== storedPublicKey.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\r?\n|\r/g, '')) {
            return res.status(403).json({ error: 'Public key does not match the admin' });
        }

        // Verify the digital signature
        const isSignatureValid = verifySignature(JSON.stringify(message), storedPublicKey, signature);
        if (!isSignatureValid) {
            return res.status(403).json({ error: 'Signature verification failed' });
        }





        const { filterName, filterValue, orderName, limitCount } = message;

        // Validate the input parameters
        if (!filterName || !filterValue || !orderName || !limitCount) {
            return res.status(400).json({ error: 'Missing required fields in message (filterName, filterValue, orderName, limitCount)' });
        }

        // Get the contract
        const contract = await getContract();

        // Call the queryByAttributeAndMaxDate function on the contract
        const result = await contract.evaluateTransaction(
            'queryByAttributeAndMaxDate',
            filterName,
            filterValue,
            orderName,
            limitCount
        );

        // Return the result
        res.json({ result: JSON.parse(result.toString()) });

    } catch (error) {
        console.error(`Failed to query: ${error}`);
        res.status(500).json({ error: 'Failed to query by attribute and max date' });
    }
});


app.listen(8080, 'localhost');
console.log('Running on http://localhost:8080');
