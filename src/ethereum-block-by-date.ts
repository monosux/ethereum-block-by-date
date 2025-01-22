import moment, { Moment } from 'moment';
import { ProviderSupport } from './type';

interface SavedBlock {
    timestamp: number;
    number: number;
}

interface ReturnWrapper {
    date: string;
    block: number;
    timestamp: number;
}

export default class BlockDateMapper {
    private provider: any;
    private isViem: boolean;
    private checkedBlocks: Record<number, number[]>;
    private savedBlocks: Record<number, SavedBlock>;
    private latestBlock!: SavedBlock;
    private firstBlock!: SavedBlock;
    private blockTime!: number;

    public requests: number;

    constructor(setting: ProviderSupport) {
        this.provider = typeof (setting as any).eth !== 'undefined' ? setting : { eth: setting };
        this.isViem = !!(setting && 'request' in setting && 'chain' in setting && 'transport' in setting);
        this.checkedBlocks = {};
        this.savedBlocks = {};
        this.requests = 0;
    }

    async getBoundaries(): Promise<void> {
        const [latestBlock, firstBlock] = await Promise.all([this.getBlockWrapper('latest'), this.getBlockWrapper(1)]);
        this.latestBlock = latestBlock;
        this.firstBlock = firstBlock;
        this.blockTime =
            (parseInt(this.latestBlock.timestamp.toString(), 10) - parseInt(this.firstBlock.timestamp.toString(), 10)) / (this.latestBlock.number - 1);
    }

    async getDate(date: Moment | Date | number | string, after = true, refresh = false): Promise<ReturnWrapper> {
        if (!moment.isMoment(date)) date = moment(date).utc();

        if (!this.firstBlock || !this.latestBlock || this.blockTime === undefined || refresh) {
            await this.getBoundaries();
        }

        if (date.isBefore(moment.unix(this.firstBlock.timestamp))) {
            return this.returnWrapper(date.format(), 1);
        }

        if (date.isSameOrAfter(moment.unix(this.latestBlock.timestamp))) {
            return this.returnWrapper(date.format(), this.latestBlock.number);
        }

        this.checkedBlocks[date.unix()] = [];
        const predictedBlock = await this.getBlockWrapper(Math.ceil(date.diff(moment.unix(this.firstBlock.timestamp), 'seconds') / this.blockTime));

        return this.returnWrapper(date.format(), await this.findBetter(date, predictedBlock, after));
    }

    async getEvery(
        duration: moment.unitOfTime.DurationConstructor,
        start: Moment | string,
        end: Moment | string,
        every = 1,
        after = true,
        refresh = false
    ): Promise<ReturnWrapper[]> {
        start = moment(start);
        end = moment(end);

        let current = start.clone();
        const dates: string[] = [];

        while (current.isSameOrBefore(end)) {
            dates.push(current.format());
            current.add(every, duration);
        }

        if (!this.firstBlock || !this.latestBlock || this.blockTime === undefined || refresh) {
            await this.getBoundaries();
        }

        return Promise.all(dates.map(date => this.getDate(date, after)));
    }

    private async findBetter(date: Moment, predictedBlock: SavedBlock, after: boolean, blockTime = this.blockTime): Promise<number> {
        if (await this.isBetterBlock(date, predictedBlock, after)) {
            return predictedBlock.number;
        }

        const difference = date.diff(moment.unix(predictedBlock.timestamp), 'seconds');
        let skip = Math.ceil(difference / (blockTime || 1));
        if (skip === 0) skip = difference < 0 ? -1 : 1;

        const nextPredictedBlock = await this.getBlockWrapper(this.getNextBlock(date, predictedBlock.number, skip));

        blockTime = Math.abs(
            (parseInt(predictedBlock.timestamp.toString(), 10) - parseInt(nextPredictedBlock.timestamp.toString(), 10)) /
                (predictedBlock.number - nextPredictedBlock.number)
        );

        return this.findBetter(date, nextPredictedBlock, after, blockTime);
    }

    private async isBetterBlock(date: Moment, predictedBlock: SavedBlock, after: boolean): Promise<boolean> {
        const blockTime = moment.unix(predictedBlock.timestamp);

        if (after) {
            if (blockTime.isBefore(date)) return false;

            const previousBlock = await this.getBlockWrapper(predictedBlock.number - 1);
            if (blockTime.isSameOrAfter(date) && moment.unix(previousBlock.timestamp).isBefore(date)) {
                return true;
            }
        } else {
            if (blockTime.isSameOrAfter(date)) return false;

            const nextBlock = await this.getBlockWrapper(predictedBlock.number + 1);
            if (blockTime.isBefore(date) && moment.unix(nextBlock.timestamp).isSameOrAfter(date)) {
                return true;
            }
        }

        return false;
    }

    private getNextBlock(date: Moment, currentBlock: number, skip: number): number {
        let nextBlock = currentBlock + skip;

        if (nextBlock > this.latestBlock.number) nextBlock = this.latestBlock.number;
        if (this.checkedBlocks[date.unix()]?.includes(nextBlock)) {
            return this.getNextBlock(date, currentBlock, skip < 0 ? --skip : ++skip);
        }

        this.checkedBlocks[date.unix()].push(nextBlock);
        return nextBlock < 1 ? 1 : nextBlock;
    }

    private returnWrapper(date: string, block: number): ReturnWrapper {
        return {
            date,
            block,
            timestamp: this.savedBlocks[block].timestamp
        };
    }

    private async getBlockWrapper(block: number | string): Promise<SavedBlock> {
        if (this.savedBlocks[block as number]) return this.savedBlocks[block as number];

        const resp = await this.provider.eth.getBlock(this.isViem ? (block == 'latest' ? { blockTag: 'latest' } : { blockNumber: block }) : block);

        this.savedBlocks[parseInt(resp.number.toString())] = {
            timestamp: Number(parseInt(resp.timestamp.toString())),
            number: Number(parseInt(resp.number.toString()))
        };

        this.requests++;
        return this.savedBlocks[parseInt(resp.number.toString())];
    }

    async getEstimateDate(block: number): Promise<ReturnWrapper> {
        if (!this.firstBlock || !this.latestBlock || this.blockTime === undefined) {
            await this.getBoundaries();
        }

        if (block <= this.latestBlock.number) {
            const savedBlock: SavedBlock = await this.getBlockWrapper(block);
            return {
                date: moment.unix(savedBlock.timestamp).utc().format(),
                block: savedBlock.number,
                timestamp: savedBlock.timestamp
            };
        } else {
            const estimatedTime = this.latestBlock.timestamp + (block - this.latestBlock.number) * this.blockTime;
            return {
                date: moment.unix(estimatedTime).utc().format(),
                block,
                timestamp: estimatedTime
            };
        }
    }
}
