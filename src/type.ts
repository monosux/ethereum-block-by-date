import { type JsonRpcProvider as JsonRpcProviderEthersV6, type InfuraProvider as InfuraProviderV6 } from 'ethers';

import { type ExternalProvider, JsonRpcProvider, InfuraProvider } from '@ethersproject/providers';

import { type PublicClient } from 'viem';
import { Web3 as Web3V4 } from 'web3';
import Web3 from 'web3-v1';

/**
 * Unified type for all supported providers.
 * This ensures compatibility across various Web3 libraries and tools.
 */
export type ProviderSupport =
    | JsonRpcProviderEthersV6 // ethers v6 JsonRpcProvider
    | InfuraProviderV6 // ethers v6 InfuraProvider
    | JsonRpcProvider // ethersproject JsonRpcProvider
    | InfuraProvider // ethersproject InfuraProvider
    | ExternalProvider // EIP-1193 ExternalProvider
    | PublicClient // viem PublicClient
    | Web3V4 // web3 v4 instance
    | Web3; // web3 v1 instance
