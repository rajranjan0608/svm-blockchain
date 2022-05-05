/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main({ organisationNumber = 1, organisationName = "A", userId }) {
    if (!userId)
        return Promise.reject("UserId can't be null!")

    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org' + organisationNumber + '.example.com', 'connection-org' + organisationNumber + '.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org' + organisationNumber + '.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet'+organisationName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log('An identity for the user "' + userId + '" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin'+organisationName);
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin'+organisationName+'" does not exist in the wallet');
            console.log('Run the enrollAdmin'+organisationName+'.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin'+organisationName);

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org' + organisationNumber + '.department1',
            enrollmentID: userId,
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org' + organisationNumber + 'MSP',
            type: 'X.509',
        };
        await wallet.put(userId, x509Identity);
        console.log('Successfully registered and enrolled user "' + userId + '" and imported it into the wallet');
        return Promise.resolve('Successfully registered and enrolled user "' + userId + '" and imported it into the wallet')

    } catch (error) {
        console.error(`Failed to register user "${userId}": ${error}`);
        return Promise.reject(`Failed to register user "${userId}": ${error}`);
    }
}

module.exports = main;
