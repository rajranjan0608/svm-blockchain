/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const mergeData = (dataA, dataB) => {
    const map = {};

    dataA.forEach(d => {
        map[d.vehicleNo] = { drinkDrive: d.drinkDrive, overSpeeding: d.overSpeeding, trafficLight: d.trafficLight, accident: d.accident };
    });

    dataB.forEach(d => {
        map[d.vehicleNo] = { ...map[d.vehicleNo], vehicleAge: d.vehicleAge, vehicleType: d.vehicleType, driverAge: d.driverAge };
    });

    return Object.values(map);
}

const areAllAttributesPresent = (map) => {
    if (Object.values(map).includes(undefined))
        return false;
    return true;
}
const prepareDataset = (dataset) => {
    const map = {
        drinkDrive: [],
        overSpeeding: [],
        trafficLight: [],
        vehicleAge: [],
        vehicleType: [],
        driverAge: [],
        accident: []
    }

    dataset.forEach(d => {
        //if all attributes are present for a vehicle, ignore otherwise
        if (areAllAttributesPresent(d)) {
            map.drinkDrive.push(d.drinkDrive);
            map.overSpeeding.push(d.overSpeeding);
            map.trafficLight.push(d.trafficLight);
            map.vehicleAge.push(d.vehicleAge);
            map.vehicleType.push(d.vehicleType);
            map.driverAge.push(d.driverAge);
            map.accident.push(d.accident);
        }
    });

    return map;
}

async function main({ organisationNumber = 1, organisationName = "A", userId }) {
    if (!userId)
        return Promise.reject("UserId can't be null");
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org' + organisationNumber + '.example.com', 'connection-org' + organisationNumber + '.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet' + organisationName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userId);
        if (!identity) {
            console.log('An identity for the user "' + userId + '" does not exist in the wallet');
            console.log('Register user on the application before retrying');
            return Promise.reject('An identity for the user "' + userId + '" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userId, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('svmblockchain');

        // addRow - org, data
        const resultA = await contract.evaluateTransaction('fetchOrgData', "A");
        // console.log(`Transaction has been evaluated, result is: ${resultA.toString()}`);

        const resultB = await contract.evaluateTransaction('fetchOrgData', "B");
        // console.log(`Transaction has been evaluated, result is: ${resultB.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        const dataA = JSON.parse(resultA.toString());
        const dataB = JSON.parse(resultB.toString());

        const dataset = prepareDataset(mergeData(dataA, dataB));

        console.log("Sending training dataset")
        await sendTrainingData(dataset);

        console.log("Training model")
        let trainingResponse = await trainModel();
        trainingResponse = await trainingResponse.json();

        return Promise.resolve({ trainingResponse, dataset });

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return Promise.reject(`Failed to evaluate transaction: ${error}`);
    }
}


async function sendTrainingData(dataset) {
    return fetch("https://svm-model-trainer--hyp3r5pace.repl.co/dataset", {
        method: 'post',
        body: JSON.stringify(dataset),
        headers: {
            'content-type': "application/json"
        }
    });
}

async function trainModel() {
    return fetch("https://svm-model-trainer--hyp3r5pace.repl.co/train");
}


module.exports = main;
