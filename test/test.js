const assert = require('chai').assert;
const Web3 = require('web3');
const moment = require('moment');
const ethDater = require('../lib/ethereum-block-by-date');
const infura = require('../config').infura;

const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + infura));
const dater = new ethDater(web3);

describe('Block By Date Tests', function() {
    this.timeout(0);

    it('Should get right block for a given string', async function() {
        let block = await dater.getDate('2016-07-20T13:20:40Z');
        assert.equal(block.block, 1920000);
    });

    it('Should get right block for Date object', async function() {
        let block = await dater.getDate(new Date('2016-07-20T13:20:40Z'));
        assert.equal(block.block, 1920000);
    });

    it('Should get right block for Moment object', async function() {
        let block = await dater.getDate(moment(new Date('2016-07-20T13:20:40Z')).utc());
        assert.equal(block.block, 1920000);
    });

    it('Should get right block for miliseconds', async function() {
        let block = await dater.getDate(1469020840000);
        assert.equal(block.block, 1920000);
    });

    it('Should get previous block for a given string', async function() {
        let block = await dater.getDate('2016-07-20T13:20:40Z', false);
        assert.equal(block.block, 1919999);
    });

    it('Should get first blocks of the years', async function() {
        let blocks = await dater.getEvery('years', '2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z');
        let numbers = blocks.map(block => block.block);
        let expected = [2912407, 4832686, 6988615];
        assert.deepEqual(expected, numbers);
    });

    it('Should get last blocks of the years', async function() {
        let blocks = await dater.getEvery('years', '2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z', 1, false);
        let numbers = blocks.map(block => block.block);
        let expected = [2912406, 4832685, 6988614];
        assert.deepEqual(expected, numbers);
    });

    it('Should return 1 as block number if given time is before first block time', async function() {
        let block = await dater.getDate(new Date('1961-04-06:07:00Z'));
        assert.equal(block.block, 1);
    });

    it('Should return last block number if given time is in the future', async function() {
        let last = await web3.eth.getBlockNumber();
        let block = await dater.getDate(moment().add(100, 'years'));
        assert.equal(block.block, last);
    });

    it('Should return last block number if given time is bigger than last block timestamp', async function() {
        let last = await web3.eth.getBlockNumber();
        let {timestamp} = await web3.eth.getBlock(last);
        let block = await dater.getDate((timestamp + 1) * 1000);
        assert.equal(block.block, last);
    });

    it('Should make less then 15 requests for 2015-09-03T08:47:03.168Z', async function() {
        dater.requests = 0;
        await dater.getDate('2015-09-03T08:47:03.168Z');
        assert.isBelow(dater.requests, 15);
    });

    it('Should make less then 15 requests for 2017-09-09T16:33:13.236Z', async function() {
        dater.requests = 0;
        await dater.getDate('2017-09-09T16:33:13.236Z');
        assert.isBelow(dater.requests, 15);
    });

    it('Should make less then 15 requests for 2017-09-22T13:52:59.961Z', async function() {
        dater.requests = 0;
        await dater.getDate('2017-09-22T13:52:59.961Z');
        assert.isBelow(dater.requests, 15);
    });

    it('Should return unique blocks for hourly request', async function() {
        let time = moment(),results = [];
        for (let i = 0; i < 10; i++) {
            let request = await dater.getDate(time);
            time.subtract(1, 'hours');
            results.push(request.block);
        }
        let unique = results.filter((v, i, a) => a.indexOf(v) === i);
        assert.deepEqual(results, unique);
    });

    it('Should return right timestamp for a given date', async function() {
        let block = await dater.getDate(new Date('2016-07-20T13:20:40Z'));
        assert.equal(block.timestamp, 1469020840);
    });

    it('Should return right timestamp if given time is before first block time', async function() {
        let block = await dater.getDate(new Date('1961-04-06:07:00Z'));
        assert.equal(block.timestamp, 1438269988);
    });

    it('Should return right timestamp if given time is in the future', async function() {
        let last = await web3.eth.getBlockNumber();
        let { timestamp } = await web3.eth.getBlock(last);
        let block = await dater.getDate(moment().add(100, 'years'));
        assert.equal(block.timestamp, timestamp);
    });
});