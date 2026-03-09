import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const [signer] = await ethers.getSigners()
  console.log('Registering with wallet:', signer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'ETH')

  const registry = new ethers.Contract(
    '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    [
      'function register(string agentURI) returns (uint256)',
      'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
    ],
    signer
  )

  const agentURI = process.env.AGENT_URI || 'https://agen-board-web.vercel.app/.well-known/agent-registration.json'
  console.log('\nRegistering with URI:', agentURI)

  const tx = await registry.register(agentURI)
  console.log('Tx:', tx.hash)
  const receipt = await tx.wait()

  let agentId = '?'
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog(log)
      if (parsed?.name === 'Registered') agentId = parsed.args.agentId.toString()
    } catch {}
  }

  console.log(`✓ Registered as agentId #${agentId} in block ${receipt.blockNumber}`)
  console.log('View on Basescan: https://basescan.org/tx/' + receipt.hash)
}

main().catch(e => { console.error(e); process.exit(1) })
