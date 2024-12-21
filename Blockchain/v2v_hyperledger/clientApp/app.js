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

// Check if car already exists
async function checkCarExists(contract, id) {
    let car = await contract.evaluateTransaction('queryCar', id)
    car = car.toString();
    console.log(car);
    return car !== '0'; // If car exists, it will return car data, otherwise '0'
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

function publicKeyCleaning(publicKey){
    return publicKey.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\r?\n|\r/g, '')
}

 

// POST request for car registration
app.post('/register', async (req, res) => {
    const { id, userId, name, year } = req.body;

    if (!id || !userId || !name || !year) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Get the contract
        const contract = await getContract();

        // Check if the car already exists
        const carExists = await checkCarExists(contract, id);
        if (carExists) {
            return res.status(400).json({ error: `Car with id ${id} already exists` });
        }

        // Generate public-private key pair
        const { publicKey, privateKey } = generateKeyPair();

        const registerDate = getDateTime();

        // Create car with status 'pending'
        await contract.submitTransaction(
            'createCar',
            id,
            userId,
            name,
            year,
            'pending', // Status set to pending
            publicKeyCleaning(publicKey),
            registerDate,
            '0',
            registerDate
        );

        // Return the car id, public key, and private key
        res.json({ id, userId, publicKey, privateKey });

    } catch (error) {
        console.error(`Failed to register car: ${error}`);
        res.status(500).json({ error: 'Failed to register car' });
    }
});


// POST request for updating car information
app.post('/update', async (req, res) => {
    const { id, publicKey, signature, updates } = req.body;
    
    if (!id || !publicKey || !signature || !updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'All fields (id, publicKey, signature, updates) are required' });
    }

    try {
        // Get the contract
        const contract = await getContract();

        // Check if the car exists by ID
        const carAsBytes = await contract.evaluateTransaction('queryCar', id);
        // Parse the car data from the blockchain
        const car = JSON.parse(carAsBytes.toString());
        if (car == '0') {
            return res.status(404).json({ error: `Car with id ${id} does not exist` });
        }



        // Verify that the provided public key matches the stored public key
        if (publicKeyCleaning(car.publicKey) !== publicKeyCleaning(publicKey)) {
            return res.status(403).json({ error: 'Public key does not match stored public key' });
        }

        // Create the message to verify (e.g., using the car ID or update details as the message)
        let message = updates;
        message['id'] = id;
        message = JSON.stringify(message);

        console.log(message);

        // Verify the digital signature
        const isSignatureValid = verifySignature(message, publicKey, signature);
        if (!isSignatureValid) {
            return res.status(403).json({ error: 'Signature verification failed' });
        }

        // Update the car's fields with the new values
        for (let key in updates) {
            if (car.hasOwnProperty(key)) {
                if (['registerDate', 'publicKey', 'status', 'messageDate'].includes(key)) {
                    return res.status(403).json({ error: `Can't update Field: ${key}` });
                }
                if ((key == 'emergancyFlag') && (car.status !== 'active')){
                    return res.status(403).json({ error: `Can't update Field: ${key}, the status should be active` });
                }
                car[key] = updates[key];
            }
        }

        if (updates.hasOwnProperty('emergancyFlag')) {
            car.messageDate = getDateTime();
        }




        // Save the updated car to the blockchain
        await contract.submitTransaction(
            'createCar',
            car.id,
            car.userId,
            car.name,
            car.year,
            car.status,
            publicKeyCleaning(car.publicKey),
            car.registerDate,
            car.emergancyFlag,
            car.messageDate
        );

        res.json({ message: 'Car information updated successfully', updatedCar: car });

    } catch (error) {
        console.error(`Failed to update car: ${error}`);
        res.status(500).json({ error: 'Failed to update car information' });
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
        if (publicKeyCleaning(publicKey) !== publicKeyCleaning(storedPublicKey)) {
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

        // Check if the car exists by ID
        const carAsBytes = await contract.evaluateTransaction('queryCar', id);
        // Parse the car data from the blockchain
        const car = JSON.parse(carAsBytes.toString());
        if (car == '0') {
            return res.status(404).json({ error: `Car with id ${id} does not exist` });
        }




        // Update the car's fields with the new values
        for (let key in updates) {
            if (car.hasOwnProperty(key)) {
                car[key] = updates[key];
            }
        }




        // Save the updated car to the blockchain
        await contract.submitTransaction(
            'createCar',
            car.id,
            car.userId,
            car.name,
            car.year,
            car.status,
            publicKeyCleaning(car.publicKey),
            car.registerDate,
            car.emergancyFlag,
            car.messageDate
        );

        res.json({ message: 'Car information updated successfully', updatedCar: car });





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
        if (publicKeyCleaning(publicKey) !== publicKeyCleaning(storedPublicKey)) {
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



// Route to handle GET request with an id as input
app.get('/get_info/:id', async (req, res) => {
    const id = req.params.id;


    try {

        // Get the contract
        const contract = await getContract();

        // Check if the car exists by ID
        const carAsBytes = await contract.evaluateTransaction('queryCar', id);
        const car = JSON.parse(carAsBytes.toString());
        if (car == '0') {
            return res.status(404).json({ error: `Car with id ${id} does not exist` });
        }


        // Parse the car data from the blockchain
        

        // Return the result
        res.status(200).json({ emergancyFlag: car['emergancyFlag']});        

    } catch (error) {
        console.error(`Failed to query car: ${error}`);
        res.status(500).json({ error: 'Failed to query car' });
    }

});


app.listen(8080, 'localhost');
console.log('Running on http://localhost:8080');
