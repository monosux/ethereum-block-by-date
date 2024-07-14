const moment = require('moment');

module.exports = class {
    constructor(web3) {
        this.web3 = this.isWeb3Provider(web3) ? web3.eth : web3;
        this.isViem = !this.isWeb3Provider(web3) && !this.isEthersProvider(web3);
        this.checkedBlocks = {};
        this.savedBlocks = {};
        this.requests = 0;
    }

    isEthersProvider(provider) {
        try {
            // Attempt to call a method unique to ethers.js providers
            provider.resolveName('vitalik.eth');
            return true;
        } catch (error) {
            // If the method call fails, it's not an ethers.js provider
            return false;
        }
    }

    isWeb3Provider(provider) {
        return typeof provider.eth != 'undefined';
    }

    async getBoundaries() {
        this.latestBlock = await this.getBlockWrapper('latest');
        this.firstBlock = await this.getBlockWrapper(1);
        this.blockTime = (parseInt(this.latestBlock.timestamp, 10) - parseInt(this.firstBlock.timestamp, 10)) / (parseInt(this.latestBlock.number, 10) - 1);
    }

    async getDate(date, after = true, refresh = false) {
        if (!moment.isMoment(date)) date = moment(date).utc();
        if (typeof this.firstBlock == 'undefined' || typeof this.latestBlock == 'undefined' || typeof this.blockTime == 'undefined' || refresh)
            await this.getBoundaries();
        if (date.isBefore(moment.unix(this.firstBlock.timestamp))) return this.returnWrapper(date.format(), 1);
        if (date.isSameOrAfter(moment.unix(this.latestBlock.timestamp))) return this.returnWrapper(date.format(), this.latestBlock.number);
        this.checkedBlocks[date.unix()] = [];
        let predictedBlock = await this.getBlockWrapper(Math.ceil(date.diff(moment.unix(this.firstBlock.timestamp), 'seconds') / this.blockTime));
        return this.returnWrapper(date.format(), await this.findBetter(date, predictedBlock, after));
    }

    async getEvery(duration, start, end, every = 1, after = true, refresh = false) {
        (start = moment(start)), (end = moment(end));
        let current = start,
            dates = [];
        while (current.isSameOrBefore(end)) {
            dates.push(current.format());
            current.add(every, duration);
        }
        if (typeof this.firstBlock == 'undefined' || typeof this.latestBlock == 'undefined' || typeof this.blockTime == 'undefined' || refresh)
            await this.getBoundaries();
        return await Promise.all(dates.map(date => this.getDate(date, after)));
    }

    async findBetter(date, predictedBlock, after, blockTime = this.blockTime) {
        if (await this.isBetterBlock(date, predictedBlock, after)) return predictedBlock.number;
        let difference = date.diff(moment.unix(predictedBlock.timestamp), 'seconds');
        let skip = Math.ceil(difference / (blockTime == 0 ? 1 : blockTime));
        if (skip == 0) skip = difference < 0 ? -1 : 1;
        let nextPredictedBlock = await this.getBlockWrapper(this.getNextBlock(date, predictedBlock.number, skip));
        blockTime = Math.abs(
            (parseInt(predictedBlock.timestamp, 10) - parseInt(nextPredictedBlock.timestamp, 10)) /
                (parseInt(predictedBlock.number, 10) - parseInt(nextPredictedBlock.number, 10))
        );
        return this.findBetter(date, nextPredictedBlock, after, blockTime);
    }

    async isBetterBlock(date, predictedBlock, after) {
        let blockTime = moment.unix(predictedBlock.timestamp);
        if (after) {
            if (blockTime.isBefore(date)) return false;
            let previousBlock = await this.getBlockWrapper(predictedBlock.number - 1);
            if (blockTime.isSameOrAfter(date) && moment.unix(previousBlock.timestamp).isBefore(date)) return true;
        } else {
            if (blockTime.isSameOrAfter(date)) return false;
            let nextBlock = await this.getBlockWrapper(predictedBlock.number + 1);
            if (blockTime.isBefore(date) && moment.unix(nextBlock.timestamp).isSameOrAfter(date)) return true;
        }
        return false;
    }

    getNextBlock(date, currentBlock, skip) {
        let nextBlock = currentBlock + skip;
        if (nextBlock > this.latestBlock.number) nextBlock = this.latestBlock.number;
        if (this.checkedBlocks[date.unix()].includes(nextBlock)) return this.getNextBlock(date, currentBlock, skip < 0 ? --skip : ++skip);
        this.checkedBlocks[date.unix()].push(nextBlock);
        return nextBlock < 1 ? 1 : nextBlock;
    }

    returnWrapper(date, block) {
        return { date: date, block: block, timestamp: this.savedBlocks[block].timestamp };
    }

    async getBlockWrapper(block) {
        if (this.savedBlocks[block]) return this.savedBlocks[block];
        const { number, timestamp } = await this.getBlock(block);
        this.savedBlocks[number] = {
            timestamp: Number(timestamp),
            number: Number(number)
        };
        this.requests++;
        return this.savedBlocks[number];
    }
    
    async getBlock(block) {
        if (typeof block == 'string' && block === 'latest') {
            block = this.isViem ? { blockTag: block } : block;
            const { number, timestamp } = await this.web3.getBlock(block);
            return { number, timestamp };
        } 
    
        block = this.isViem ? { blockNumber: block } : block;
        const { number, timestamp } = await this.web3.getBlock(block);
        return { number, timestamp };
    }
};
