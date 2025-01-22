import { assert } from 'chai';
import { ethers } from 'ethers';
import moment from 'moment';
import ethDater from '../src/ethereum-block-by-date';

type BlockByDateResult = {
    block: number;
    timestamp: number;
};

const provider = new ethers.InfuraProvider('mainnet', process.env.INFURA_API_KEY);

const dater = new ethDater(provider);

describe('Block By Date Ethers V.6 Tests', function () {
    this.timeout(0);

    it('Should get right block for a given string', async function () {
        const block: BlockByDateResult = await dater.getDate('2016-07-20T13:20:40Z');
        assert.equal(block.block, 1920000);
    });

    it('Should return 1 as block number if given time is before first block time', async function () {
        const block: BlockByDateResult = await dater.getDate(new Date('1961-04-12T06:07:00Z'));
        assert.equal(block.block, 1);
    });

    it('Should return last block number if given time is in the future', async function () {
        const last: number = await provider.getBlockNumber();
        const block: BlockByDateResult = await dater.getDate(moment().add(100, 'years').toDate(), true, true);
        assert.equal(block.block, last);
    });
});
