import { assert } from 'chai';
import moment from 'moment';
import ethDater from '../src/ethereum-block-by-date';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import 'dotenv/config';

const client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.PROVIDER || '')
});

const dater = new ethDater(client);

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
        assert.equal(block.block, parseInt(last.toString()));
    });
});
