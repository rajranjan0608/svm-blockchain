/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const jsonData = require('./initData.json')

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        await ctx.stub.putState("A", Buffer.from(JSON.stringify(jsonData.A)));
        await ctx.stub.putState("B", Buffer.from(JSON.stringify(jsonData.B)));
        console.info('============= END : Initialize Ledger ===========');
    }

    async fetchOrgData(ctx, orgName) {
        const dataBytes = await ctx.stub.getState(orgName);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`${orgName} does not exist`);
        }
        const stringData = dataBytes.toString()
        const orgData = JSON.parse(stringData);
        return orgData;
    }

    async addRow(ctx, orgName, data) {
        let newRow;
        console.info("data: ", data)
        data = JSON.parse(data)
        if(orgName == "A") {
            console.info("org a")
            newRow = {
                vehicleNo: data.vehicleNo,
                drinkDrive: data.drinkDrive,
                overSpeeding: data.overSpeeding,
                trafficLight: data.trafficLight,
                accident: data.accident
            }
            console.info("newRow: ", newRow)
        } else if(orgName == "B") {
            newRow = {
                vehicleNo: data.vehicleNo,
                vehicleAge: data.vehicleAge,
                vehicleType: data.vehicleType,
                driverAge: data.driverAge
            }
        } else {
            console.info("no org")
            throw new Error(`${orgName} does not exist`);
        }

        const dataBytes = await ctx.stub.getState(orgName);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`${orgName} does not exist`);
        }
        const stringData = dataBytes.toString()
        const orgData = JSON.parse(stringData);

        orgData.forEach((row) => {
            if(row.vehicleNo == newRow.vehicleNo) {
                throw new Error(`Vehicle already exist`);
            }
        })

        orgData.push(newRow);

        await ctx.stub.putState(orgName, Buffer.from(JSON.stringify(orgData)))
    }
}

module.exports = FabCar;
