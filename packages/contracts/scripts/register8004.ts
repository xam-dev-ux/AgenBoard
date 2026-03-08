import { ethers, run } from 'hardhat'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const [signer] = await ethers.getSigners()
  console.log('Registering with wallet:', signer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'ETH')

  const registry = new ethers.Contract(
    '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    [
      'function safeMint(address to, string memory agentURI) returns (uint256)',
      'function totalSupply() view returns (uint256)',
    ],
    signer
  )

  const before = await registry.totalSupply()
  console.log('Total agents in ERC-8004 registry before:', before.toString())

  const agentURI = 'https://agen-board-web.vercel.app/.well-known/agent-registration.json'
  console.log('\nMinting AGENTBOARD registration...')
  console.log('URI:', agentURI)

  const tx = await registry.safeMint(signer.address, agentURI)
  console.log('Tx:', tx.hash)
  const receipt = await tx.wait()
  console.log('✓ Confirmed in block:', receipt.blockNumber)

  const after = await registry.totalSupply()
  console.log('✓ AGENTBOARD registered as token #' + after.toString())
  console.log('View on Basescan: https://basescan.org/tx/' + receipt.hash)
}

main().catch(e => { console.error(e); process.exit(1) })
