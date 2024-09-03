const assert = require('chai').assert;
const { Web3 } = require('web3');
const moment = require('moment');
const ethDater = require('../lib/ethereum-block-by-date');
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER));
const dater = new ethDater(web3);

const run = async () => {
    describe('Block By Date General Tests', function () {
        this.timeout(0);

        it('Should get right block for a given string', async function () {
            let block = await dater.getDate('2016-07-20T13:20:40Z');
            assert.equal(block.block, 1920000);
        });

        it('Should get right block for Date object', async function () {
            let block = await dater.getDate(new Date('2016-07-20T13:20:40Z'));
            assert.equal(block.block, 1920000);
        });

        it('Should get right block for Moment object', async function () {
            let block = await dater.getDate(moment(new Date('2016-07-20T13:20:40Z')).utc());
            assert.equal(block.block, 1920000);
        });

        it('Should get right block for miliseconds', async function () {
            let block = await dater.getDate(1469020840000);
            assert.equal(block.block, 1920000);
        });

        it('Should get previous block for a given string', async function () {
            let block = await dater.getDate('2016-07-20T13:20:40Z', false);
            assert.equal(block.block, 1919999);
        });

        it('Should get first blocks of the years', async function () {
            let blocks = await dater.getEvery('years', '2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z');
            let numbers = blocks.map(block => block.block);
            let expected = [2912407, 4832686, 6988615];
            assert.deepEqual(expected, numbers);
        });

        it('Should get last blocks of the years', async function () {
            let blocks = await dater.getEvery('years', '2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z', 1, false);
            let numbers = blocks.map(block => block.block);
            let expected = [2912406, 4832685, 6988614];
            assert.deepEqual(expected, numbers);
        });

        it('Should return 1 as block number if given time is before first block time', async function () {
            let block = await dater.getDate(new Date('1961-04-12T06:07:00Z'));
            assert.equal(block.block, 1);
        });

        it('Should return last block number if given time is in the future', async function () {
            let last = await web3.eth.getBlockNumber();
            let block = await dater.getDate(moment().add(100, 'years'), true, true);
            assert.equal(block.block, last);
        });

        it('Should return last block number if given time is bigger than last block timestamp', async function () {
            let last = await web3.eth.getBlockNumber();
            let { timestamp } = await web3.eth.getBlock(last);
            let block = await dater.getDate((Number(timestamp) + 1) * 1000, true, true);
            assert.equal(block.block, last);
        });

        it('Should return unique blocks for hourly request', async function () {
            let time = moment(),
                results = [];
            for (let i = 0; i < 10; i++) {
                let request = await dater.getDate(time);
                time.subtract(1, 'hours');
                results.push(request.block);
            }
            let unique = results.filter((v, i, a) => a.indexOf(v) === i);
            assert.deepEqual(results, unique);
        });

        it('Should return right timestamp for a given date', async function () {
            let block = await dater.getDate(new Date('2016-07-20T13:20:40Z'));
            assert.equal(block.timestamp, 1469020840);
        });

        it('Should return right timestamp if given time is before first block time', async function () {
            let block = await dater.getDate(new Date('1961-04-12T06:07:00Z'));
            assert.equal(block.timestamp, 1438269988);
        });

        it('Should return right timestamp if given time is in the future', async function () {
            let { timestamp } = await web3.eth.getBlock('latest');
            let block = await dater.getDate(moment().add(100, 'years'), true, true);
            assert.equal(block.timestamp, timestamp);
        });

        it('Should return right estimate timestamp if given block is in the future', async function () {
            const { number } = await web3.eth.getBlock('latest');
            const block = parseInt(number) + 2;
            const estimatedDate = moment(await dater.getEstimateDate(block).date);
            let futureBlock;
            while (!futureBlock) {
                try {
                    futureBlock = await web3.eth.getBlock(block);
                } catch (error) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            const actualDate = moment.unix(parseInt(futureBlock.timestamp)).utc();
            const diffDate = Math.abs(estimatedDate.diff(actualDate, 'seconds'));
            // current estimate are not perfect. should be low 15
            assert.isBelow(diffDate, 20);
        });
    });
};

module.exports = { run };
