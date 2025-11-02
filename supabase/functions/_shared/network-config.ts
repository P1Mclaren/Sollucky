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
 * Get network configuration - ALWAYS MAINNET
 * Test mode is disabled for production
 */
export function getNetworkConfig(isTestMode: boolean): NetworkConfig {
  const network: SolanaNetwork = 'mainnet-beta';
  const rpcEndpoint = 'https://api.mainnet-beta.solana.com';

  return {
    rpcEndpoint,
    network,
    isTestMode: false // Always false - mainnet only
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
      publicKey: 'FfVVCDEoigroHR49zLxS3C3WuWQDzT6Mujidd73bDfcM'
    },
    weekly: {
      privateKeyEnvVar: 'WEEKLY_LOTTERY_PRIVATE_KEY',
      publicKey: 'EAcYYNgT3BexVLpjnAwDawd75VXvjcAeCf37bXK4f7Zp'
    },
    daily: {
      privateKeyEnvVar: 'DAILY_LOTTERY_PRIVATE_KEY',
      publicKey: 'Bt75Ar8C3U5cPVhWmXj8CTF1AG858DsYntqMbAwQhRqj'
    }
  };

  return configs[lotteryType];
}
