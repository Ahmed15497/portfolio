const crypto = require('crypto');
const path = require('path');
const fs = require('fs');


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


const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDjDt+/8O3K6o3T\nN179AkEJQxuaQk7CuCaonin7vkzX4ODcpRrBiUK8uojV4ZHU4VhE61HNaPVCAVvf\nsV03bTLLcC8d0emeafK8A9MxddRHU+dpGYOUgH3mXnxXAP+IlHHBpXPp64Z22LSr\n9tIyO8Zwf5RblAjwXtaWIP9ixnHZINurlNFo5nGshNtYfd9gpvdkLc5wi/0lZJQm\n2eRRGir0qpOeyIZAplyC+UvMpgvP+38hWSjrIYjQ+T6oZKOaOhapD+UsHR73CdwR\nqd+aiUg2l1/bTd28Mzwvi6ozhdv5Rnj5bVjxXcoyMS/Hp8g6JqS1ljXH97eZPUHH\nPQ6p8M6zAgMBAAECggEBAKFMA676nDI2BaIyB4x8eW72+TjQOdshrnTCRtjLCxOg\ncJzNvQAXXg1sBaDKqSotGuN6t5XQJcpJ5NY3zRx+ukLC4vWwFOGwKfteTD0qky5I\ncG+87DgmP0nTfUjhMKX5rgX+XyWhZtgugcpXgGKnDAUG3IFh3CfFd3MW5dVpW579\n3ZDlaveKe6sgg7THIgzNDCuTgFIAT2AjTCBrrzUFBSyctXQOxZX35lYCUH0Kndss\nvuGJ2zuT/dDf+aVGFialZBsZcf1W0x9EuDakf/MXDQxQ/Z4dYPq0w42WsDRUwvrh\nbEq5GS3BOvLMijagx6/JHo1VHnsG1zKS2IA86rGKOAECgYEA/cqGeJJedMrWrfk2\nXUL1AdZUsPLKvp46DbHvwMG1lUv8D30YvEuzVWIXyjt5RxTp4fD+DPvZEg2nHiOT\n8oQl4sOQezuFnxPgnpJrlagp6n3UX5TYzbWc4NYVddQG82UO3hm121yAkZ/Ouu5I\nRPj47J41H5ugy3MYxKXR3RihM7MCgYEA5QjI3ZKaRSBX2mv/s3OAr11UMyuItaDo\nVzwlgWiz0hH7xfVdj/7y6oviEHNEPkPt8uQSuCKq7Y2ko3LCPoKa11EWu8o6XsBY\nBsbmLz9AJ4eMM2smhfwKyTk/q0iSVXpv1CuMRVi3bf9famJR0a+Ljxnjc708RjX3\nu+jLtrCgeQECgYEA+n/fUL0wTFk1osycE1uWl7SlLW7IHXPx2zipa/oHMBCq/+K6\n+ohBv2IuFyey4i1LWP9U0x32uTIOpNn7GuHCv1vGjUxH7KdjC0F8vWAZ12FRsPIr\nOIgtC2NkFUQthCpYjXKVJKreIF67X5j4blPM50iVKNik0ouNg/Qj+/Zmjq8CgYAD\nbMI0LgEIj5dAuOS19kAyXx7nNPtyW9mdlFSrPrmRppsxNp4TjShswXK79D1NAQ8J\n1sdA4aPUsY2ItCqbbLCMD7ZbUIbW6+FlGIxQoI2BCdHa4vtMfZxbrfN5yDgH9zC8\n53nNf6oehvcSTC4VCJ75oNV54ZaJJj1yHeUN8k40AQKBgQDKKvHeSptZpdi0mOnr\nnQ2L/KnzKslLDVQEqw/ANU65k94pSktlYQMlWRZ0Wys7+nA+qk0o/D4ucyAQiYxn\nZ9l7Pe2pT0Kc+WQq1UK9IHIp7NwJ/yqogfjxeUXyk6wiPcPaCOkoOkE9Sl9aiT06\ngtmsaUiZoxoWu0XaCUPN23R4Gg==\n-----END PRIVATE KEY-----\n"


const publicKey = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4w7fv/DtyuqN0zde/QJB\nCUMbmkJOwrgmqJ4p+75M1+Dg3KUawYlCvLqI1eGR1OFYROtRzWj1QgFb37FdN20y\ny3AvHdHpnmnyvAPTMXXUR1PnaRmDlIB95l58VwD/iJRxwaVz6euGdti0q/bSMjvG\ncH+UW5QI8F7WliD/YsZx2SDbq5TRaOZxrITbWH3fYKb3ZC3OcIv9JWSUJtnkURoq\n9KqTnsiGQKZcgvlLzKYLz/t/IVko6yGI0Pk+qGSjmjoWqQ/lLB0e9wncEanfmolI\nNpdf203dvDM8L4uqM4Xb+UZ4+W1Y8V3KMjEvx6fIOiaktZY1x/e3mT1Bxz0OqfDO\nswIDAQAB\n-----END PUBLIC KEY-----\n"


const jsonMessage = {"name":"Toyota ambulance","id":"AI246"};

// Step 1: Convert JSON to string
const message = JSON.stringify(jsonMessage);

const signature = signMessage(message, privateKey);

const isValid = verifySignature(message, signature, publicKey)

console.log(signature)
console.log(isValid)


// Function to load keys from files
function loadKeysFromFile() {
    // Define the file paths
    const publicKeyPath = path.join(__dirname, 'public_key.pem');
    const privateKeyPath = path.join(__dirname, 'private_key.pem');


    // Read the public and private keys from files
    const publicKeyAdmin = fs.readFileSync(publicKeyPath, 'utf8');

    const privateKeyAdmin = fs.readFileSync(privateKeyPath, 'utf8');

    return { publicKeyAdmin, privateKeyAdmin };
}


const { publicKeyAdmin, privateKeyAdmin } = loadKeysFromFile();





//const jsonMessageAdmin =   {"filterName": "status","filterValue": "pending","orderName": "registerDate","limitCount": 5};
// const jsonMessageAdmin =   {"id": "AI246","status": "active"};
const jsonMessageAdmin =   {"id": "AI246","emergancyFlag": "1"};


// Step 1: Convert JSON to string
const messageAdmin = JSON.stringify(jsonMessageAdmin);

const signatureAdmin = signMessage(messageAdmin, privateKeyAdmin);

const isValidAdmin = verifySignature(messageAdmin, signatureAdmin, publicKeyAdmin)

console.log(signatureAdmin)
console.log(isValidAdmin)
console.log(publicKeyAdmin.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\r?\n|\r/g, ''))




