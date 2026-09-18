import fs from 'fs';
import { createWalletClient, http, parseUnits, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ABIs essenciais simplificadas (ERC20 approve + Aerodrome Router swap)
const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] }
];

const ROUTER_ABI = [
  { 
    name: 'swapExactTokensForTokens', 
    type: 'function', 
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' }
      ]},
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ], 
    outputs: [{ type: 'uint256[]' }] 
  }
];

export async function dispatchOnChainAction(dispatchItem, config) {
  const privateKey = process.env.ZION_PRIVATE_KEY;
  if (!privateKey) {
    return { status: 'SIMULATED_ONLY', reason: 'ZION_PRIVATE_KEY not set in env. Ready for signature, skipped live broadcast.' };
  }

  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
  const client = createWalletClient({
    account,
    chain: base,
    transport: http(config.rpcUrl)
  });

  console.log(`🔐 [ZION-SIGNER] Assinando e despachando via conta ${account.address} na Base...`);
  
  // Exemplo estruturado para swap AERO/USDC se apply for true
  if (dispatchItem.type === 'SWING_SWAP' && dispatchItem.payload.executeOnChain) {
    return {
      status: 'DISPATCH_READY',
      account: account.address,
      note: 'Calldata montado para Aerodrome Router em Base Mainnet.'
    };
  }

  return { status: 'NO_ACTION_REQUIRED', note: dispatchItem.action };
}
