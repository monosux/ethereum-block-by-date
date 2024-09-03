const assert = require('chai').assert;
const { Web3 } = require('web3');
const moment = require('moment');
const ethDater = require('../lib/ethereum-block-by-date');
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER));
const dater = new ethDater(web3);

const run = async () => {
    describe('Block By Date Specific Dates Tests', function () {
        this.timeout(0);

        it('Should make less then 15 requests for 2015-09-03T08:47:03.168Z', async function () {
            dater.requests = 0;
            await dater.getDate('2015-09-03T08:47:03.168Z');
            assert.isBelow(dater.requests, 15);
        });

        it('Should make less then 15 requests for 2017-09-09T16:33:13.236Z', async function () {
            dater.requests = 0;
            await dater.getDate('2017-09-09T16:33:13.236Z');
            assert.isBelow(dater.requests, 15);
        });

        it('Should make less then 15 requests for 2017-09-22T13:52:59.961Z', async function () {
            dater.requests = 0;
            await dater.getDate('2017-09-22T13:52:59.961Z');
            assert.isBelow(dater.requests, 15);
        });

        it('Should make less then 16 requests for 2016-11-14T14:46:06.107Z', async function () {
            dater.requests = 0;
            await dater.getDate('2016-11-14T14:46:06.107Z');
            assert.isBelow(dater.requests, 15);
        });

        it('Should make less then 15 requests for 2017-04-20T07:54:29.965Z', async function () {
            dater.requests = 0;
            await dater.getDate('2017-04-20T07:54:29.965Z');
            assert.isBelow(dater.requests, 15);
        });

        it('Should return right timestamp for a given date', async function () {
            let block = await dater.getDate(moment('2015-07-30T11:28:01-04:00'));
            assert.equal(block.block, 5);
        });

        it('Should return right timestamp for a given date', async function () {
            let block = await dater.getDate(moment('2015-07-30T11:28:02-04:00'));
            assert.equal(block.block, 5);
        });

        it('Should return right timestamp for a given date', async function () {
            let block = await dater.getDate(moment('2015-07-30T11:28:03-04:00'));
            assert.equal(block.block, 5);
        });
    });
};

module.exports = { run };
