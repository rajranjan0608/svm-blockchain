# SVM Training secured with Consortium Blockchain

In this project we have used consortium blockchain as a shared database between multiple organizations. This creates a trustless system for data access and sharing and eliminates the need for any third-party centralized service.

## Steps to run this project

Follow the stepts shown below to run the project

Start network and deploy chaincode (smart contracts)

```bash
./startFabric.sh
```

Move to `server` folder and start servers. We have 2 servers, 1 for each organization.

```bash
cd server
```

Start server for org B.

```bash
node serverA.js
```

Start other server in a new terminal window or tab

```bash
node serverB.js
```

Each org has an MSP (Membership Service Provider) that gives access to the blockchain network by giving client or admin certificate to the users. We first enroll `admin` ID on each server and then using this `admin` we can register other users.

```bash
node enrollAdminA.js && node enrollAdminB.js
```

Client registerations are handled by the REST APIs created. Now you can interact with the servers at port 3000 and 3001, by making API calls. Example Postmant collections is given in the root folder that you can import make the required calls.
