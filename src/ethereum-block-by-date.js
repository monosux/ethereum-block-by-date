const moment = require('moment');

module.exports = class {
    constructor(web3, save = true) {
        this.web3 = web3;
        this.checkedBlocks = {};
        this.saveBlocks = save;
        if (save) this.savedBlocks = {};
        this.requests = 0;
    }

    async getBlockTime() {
        let latest = await this.getBlockWrapper('latest');
        let first = await this.getBlockWrapper(1);
        this.blockTime = (parseInt(latest.timestamp, 10) - parseInt(first.timestamp, 10)) / (parseInt(latest.number, 10) - 1);
        this.firstTimestamp = moment.unix(first.timestamp);
    }

    async getDate(date, after = true) {
        if (!moment.isMoment(date)) date = moment(date).utc();
        if (typeof this.firstTimestamp == 'undefined' || this.blockTime == 'undefined') await this.getBlockTime();
        if (date.isBefore(this.firstTimestamp)) return { date: date.format(), block: 1 };
        if (date.isSameOrAfter(moment()) || date.isSameOrAfter(this.savedBlocks.latest)) return { date: date.format(), block: await this.web3.eth.getBlockNumber() };
        this.checkedBlocks[date.unix()] = [];
        let predictedBlock = await this.getBlockWrapper(Math.ceil(date.diff(this.firstTimestamp, 'seconds') / this.blockTime));
        return {
            date: date.format(),
            block: await this.findBetter(date, predictedBlock, after)
        };
    }

    async getEvery(duration, start, end, every = 1, after = true) {
        start = moment(start), end = moment(end);
        let current = start, dates = [];
        while (current.isSameOrBefore(end)) {
            dates.push(current.format());
            current.add(every, duration);
        }
        if (typeof this.firstTimestamp == 'undefined' || this.blockTime == 'undefined') await this.getBlockTime();
        return await Promise.all(dates.map((date) => this.getDate(date, after)));
    }

    async findBetter(date, predictedBlock, after, blockTime = this.blockTime) {
        if (await this.isBetterBlock(date, predictedBlock, after)) return predictedBlock.number;
        let difference = date.diff(moment.unix(predictedBlock.timestamp), 'seconds');
        let skip = Math.ceil(difference / blockTime);
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
        if (this.checkedBlocks[date.unix()].includes(nextBlock)) return this.getNextBlock(date, currentBlock, (skip < 0 ? ++skip : --skip));
        this.checkedBlocks[date.unix()].push(nextBlock);
        return nextBlock;
    }

    async getBlockWrapper(block) {
        if (!this.saveBlocks) return await this.web3.eth.getBlock(block);
        if (this.savedBlocks[block]) return this.savedBlocks[block];
        let {timestamp} = await this.web3.eth.getBlock(block);
        this.savedBlocks[block] = {
            timestamp: timestamp,
            number: block == 'latest' ? await this.web3.eth.getBlockNumber() : block
        };
        this.requests++;
        return this.savedBlocks[block];
    }
};