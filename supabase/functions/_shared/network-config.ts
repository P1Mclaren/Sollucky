/**
 * Network Configuration and Security Validation
 * Ensures proper environment separation between mainnet and devnet
 */

export type SolanaNetwork = 'mainnet-beta' | 'devnet';

export interface NetworkConfig {
  rpcEndpoint: string;
  network: SolanaNetwork;
  isTestMode: boolean;
}

/**
 * Get network configuration based on test mode
 * CRITICAL: Prevents mixing mainnet/devnet keys
 */
export function getNetworkConfig(isTestMode: boolean): NetworkConfig {
  const network: SolanaNetwork = isTestMode ? 'devnet' : 'mainnet-beta';
  
  const rpcEndpoint = isTestMode
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com';

  return {
    rpcEndpoint,
    network,
    isTestMode
  };
}

/**
 * Validate that we have the correct private keys for the current network
 * Prevents accidentally using mainnet keys on devnet or vice versa
 */
export function validateNetworkKeys(
  network: SolanaNetwork,
  privateKeys: Record<string, string | undefined>
): void {
  const requiredKeys = [
    'MONTHLY_LOTTERY_PRIVATE_KEY',
    'WEEKLY_LOTTERY_PRIVATE_KEY',
    'DAILY_LOTTERY_PRIVATE_KEY',
  ];

  const missingKeys = requiredKeys.filter(key => !privateKeys[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required private keys for ${network}: ${missingKeys.join(', ')}`
    );
  }

  console.log(`✅ Network validation passed for ${network}`);
}

/**
 * Get lottery wallet configuration based on type and network
 */
export interface LotteryWalletConfig {
  privateKeyEnvVar: string;
  publicKey: string;
}

export function getLotteryWalletConfig(
  lotteryType: 'monthly' | 'weekly' | 'daily',
  network: SolanaNetwork
): LotteryWalletConfig {
  // Same private keys work for both mainnet and devnet
  const configs = {
    monthly: {
      privateKeyEnvVar: 'MONTHLY_LOTTERY_PRIVATE_KEY',
      publicKey: network === 'mainnet-beta'
        ? 'TgtoboRzo2uzz9yF7NsaCmJrC7uDt664TMgCDMxoLYvvSJgBmuiovzms3cLnctT8ws9N4R2sLE5W3w4rnQCtrws'
        : 'TgtoboRzo2uzz9yF7NsaCmJrC7uDt664TMgCDMxoLYvvSJgBmuiovzms3cLnctT8ws9N4R2sLE5W3w4rnQCtrws'
    },
    weekly: {
      privateKeyEnvVar: 'WEEKLY_LOTTERY_PRIVATE_KEY',
      publicKey: network === 'mainnet-beta'
        ? '412KtEEM5PrTW2hubE3x3n7vTqkH6kQ4Wgp6FBTjjr1jiC9QvqdvKrZrr4cViawiNWx6Qpie6EmfP5irvRKo76Na'
        : '412KtEEM5PrTW2hubE3x3n7vTqkH6kQ4Wgp6FBTjjr1jiC9QvqdvKrZrr4cViawiNWx6Qpie6EmfP5irvRKo76Na'
    },
    daily: {
      privateKeyEnvVar: 'DAILY_LOTTERY_PRIVATE_KEY',
      publicKey: network === 'mainnet-beta'
        ? '5E1Jdmn3WpLXy4wrG1b4zBv3dCxTis9tmSMZDLTeL5v6edb7SrRamRhGynouwPXBTC93Rtap6kDomr7cMezLAxq7'
        : '5E1Jdmn3WpLXy4wrG1b4zBv3dCxTis9tmSMZDLTeL5v6edb7SrRamRhGynouwPXBTC93Rtap6kDomr7cMezLAxq7'
    }
  };

  return configs[lotteryType];
}
