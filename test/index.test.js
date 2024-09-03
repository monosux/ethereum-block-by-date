const ethersV5Test = require('./ethers-v5.test');
const ethersTest = require('./ethers.test');
const generalTest = require('./general.test');
const specificTest = require('./specific.test');
const viemTest = require('./viem.test');
const web3v1Test = require('./web3-v1.test');

describe('Test Suite', async function () {
    ethersV5Test.run();
    ethersTest.run();
    generalTest.run();
    specificTest.run();
    viemTest.run();
    web3v1Test.run();
});
