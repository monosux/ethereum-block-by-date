# Ethereum Block By Date

Get Ethereum block number by a given date. Or blocks by a given period duration.

Works with any Ethereum based mainnet or testnet networks.

Works with [web3.js](https://web3js.readthedocs.io/) and [ethers.js](https://docs.ethers.io/)

## Installation

Use npm:

```
npm i ethereum-block-by-date
```

Or yarn:

```
yarn add ethereum-block-by-date
```

## Usage

### Using with Web3.js

```javascript
const EthDater = require('ethereum-block-by-date');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER));

const dater = new EthDater(
    web3 // Web3 object, required.
);
```

### Using with Ethers.js

```javascript
const EthDater = require('ethereum-block-by-date');
const { ethers } = require('ethers');
const provider = new ethers.providers.CloudflareProvider();

const dater = new EthDater(
    provider // Ethers provider, required.
);
```

### Requests

```javascript
// Getting block by date:
let block = await dater.getDate(
    '2016-07-20T13:20:40Z', // Date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    true // Block after, optional. Search for the nearest block before or after the given date. By default true.
);

/* Returns an object: {
    date: '2016-07-20T13:20:40Z', // searched date
    block: 1920000, // found block number
    timestamp: 1469020840 // found block timestamp
} */

// Getting block by period duration. For example: every first block of Monday's noons of October 2019.
let blocks = await dater.getEvery(
    'weeks', // Period, required. Valid value: years, quarters, months, weeks, days, hours, minutes
    '2019-09-02T12:00:00Z', // Start date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    '2019-09-30T12:00:00Z', // End date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    1, // Duration, optional, integer. By default 1.
    true // Block after, optional. Search for the nearest block before or after the given date. By default true.
);

/* Returns an array of objects: [
    { date: '2019-09-02T12:00:00Z', block: 8470641, timestamp: 1567425601 },
    { date: '2019-09-09T12:00:00Z', block: 8515536, timestamp: 1568030405 },
    { date: '2019-09-16T12:00:00Z', block: 8560371, timestamp: 1568635207 },
    { date: '2019-09-23T12:00:00Z', block: 8605314, timestamp: 1569240009 },
    { date: '2019-09-30T12:00:00Z', block: 8649923, timestamp: 1569844804 }
] */

let requests = dater.requests;

/* Returns a count of made requests */
```

Note: if the given date is before the first block date in the blockchain, the script will return 1 as block number. If the given date is in the future, the script will return the last block number in the blockchain.

## Moment.js

The package uses moment.js plugin to parse dates. Read more about valid dates and time zones in the plugin's documentation: [Moment.js](https://momentjs.com/docs/)

## Examples

Every first block of the year:
```javascript
let blocks = await dater.getEvery('years', '2016-01-01T00:00:00Z', '2019-01-01T00:00:00Z');

/* Returns [
    { date: '2016-01-01T00:00:00Z', block: 778483, timestamp: 1451606404 },
    { date: '2017-01-01T00:00:00Z', block: 2912407, timestamp: 1483228803 },
    { date: '2018-01-01T00:00:00Z', block: 4832686, timestamp: 1514764802 },
    { date: '2019-01-01T00:00:00Z', block: 6988615, timestamp: 1546300801 }
] */
```

Every last block of the year:
```javascript
let blocks = await dater.getEvery('years', '2016-01-01T00:00:00Z', '2019-01-01T00:00:00Z', 1, false);

/* Returns [
    { date: '2016-01-01T00:00:00Z', block: 778482, timestamp: 1451606392 },
    { date: '2017-01-01T00:00:00Z', block: 2912406, timestamp: 1483228771 },
    { date: '2018-01-01T00:00:00Z', block: 4832685, timestamp: 1514764787 },
    { date: '2019-01-01T00:00:00Z', block: 6988614, timestamp: 1546300782 }
] */
```

Every first block of every 4 hours of October 10, 2019:
```javascript
let blocks = await dater.getEvery('hours', '2019-10-10T00:00:00Z', '2019-10-11T00:00:00Z', 4);

/* Returns [
    { date: '2019-10-10T00:00:00Z', block: 8710742, timestamp: 1570665639 },
    { date: '2019-10-10T04:00:00Z', block: 8711802, timestamp: 1570680002 },
    { date: '2019-10-10T08:00:00Z', block: 8712836, timestamp: 1570694401 },
    { date: '2019-10-10T12:00:00Z', block: 8713926, timestamp: 1570708806 },
    { date: '2019-10-10T16:00:00Z', block: 8715001, timestamp: 1570723236 },
    { date: '2019-10-10T20:00:00Z', block: 8716033, timestamp: 1570737614 },
    { date: '2019-10-11T00:00:00Z', block: 8717086, timestamp: 1570752000 }
] */
```

## Need Help

If you need any help, please contact me via GitHub issues page: [GitHub](https://github.com/monosux/ethereum-block-by-date/issues)