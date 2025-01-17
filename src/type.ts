import { type JsonRpcProvider as JsonRpcProviderEthersV6, type InfuraProvider as InfuraProviderV6 } from 'ethers';

import { type ExternalProvider, JsonRpcProvider, InfuraProvider } from '@ethersproject/providers';

import { type PublicClient } from 'viem';

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
    | PublicClient; // viem PublicClient
