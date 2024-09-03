const assert = require('chai').assert;
const { createPublicClient, http } = require('viem');
const { mainnet } = require('viem/chains');
const moment = require('moment');
const ethDater = require('../lib/ethereum-block-by-date');

const client = createPublicClient({
    chain: mainnet,
    transport: http()
});
const dater = new ethDater(client);

const run = async () => {
    describe('Block By Date Viem Tests', function () {
        this.timeout(0);

        it('Should get right block for a given string', async function () {
            let block = await dater.getDate('2016-07-20T13:20:40Z');
            assert.equal(block.block, 1920000);
        });

        it('Should return 1 as block number if given time is before first block time', async function () {
            let block = await dater.getDate(new Date('1961-04-12T06:07:00Z'));
            assert.equal(block.block, 1);
        });

        it('Should return last block number if given time is in the future', async function () {
            let last = await client.getBlockNumber();
            let block = await dater.getDate(moment().add(100, 'years'), true, true);
            assert.equal(block.block, last);
        });
    });
};

module.exports = { run };
