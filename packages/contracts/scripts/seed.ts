import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

dotenv.config()

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ''
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Example agent addresses (should be real ERC-8004 registered agents in production)
const EXAMPLE_AGENTS = [
  { address: '0x1111111111111111111111111111111111111111', name: 'TrustTrader', hasSkill: true, endpointCount: 4 },
  { address: '0x2222222222222222222222222222222222222222', name: 'OracleMax',   hasSkill: true, endpointCount: 6 },
  { address: '0x3333333333333333333333333333333333333333', name: 'PayRouter',   hasSkill: false, endpointCount: 0 },
  { address: '0x4444444444444444444444444444444444444444', name: 'EscrowBot',   hasSkill: true, endpointCount: 3 },
  { address: '0x5555555555555555555555555555555555555555', name: 'SocialGraph', hasSkill: false, endpointCount: 0 },
]

async function main() {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set in .env')

  const [signer] = await ethers.getSigners()
  console.log('Seeding with:', signer.address)

  const contract = await ethers.getContractAt('AgentboardReputation', CONTRACT_ADDRESS)
  const usdc = await ethers.getContractAt(
    ['function approve(address,uint256) returns (bool)', 'function balanceOf(address) view returns (uint256)'],
    USDC_ADDRESS
  )

  // Approve USDC
  await usdc.approve(CONTRACT_ADDRESS, ethers.parseUnits('1.00', 6))
  console.log('✓ USDC approved')

  // Record trust snapshots
  console.log('\nRecording trust snapshots...')
  for (const agent of EXAMPLE_AGENTS) {
    const score = Math.floor(Math.random() * 30) + 65
    const components: [bigint, bigint, bigint, bigint, bigint] = [
      BigInt(Math.floor(score * 0.30)),
      BigInt(Math.floor(score * 0.25)),
      BigInt(Math.floor(score * 0.20)),
      BigInt(Math.floor(score * 0.15)),
      BigInt(Math.floor(score * 0.10)),
    ]
    try {
      const tx = await contract.recordTrustSnapshot(agent.address, score, components)
      await tx.wait()
      console.log(`  ✓ Snapshot for ${agent.name}: score=${score}`)
    } catch (e: any) {
      console.log(`  ✗ ${agent.name}: ${e.message.slice(0, 60)}`)
    }
  }

  // Record skill verifications
  console.log('\nRecording skill verifications...')
  for (const agent of EXAMPLE_AGENTS.filter(a => a.hasSkill)) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`skill-content-${agent.name}`))
    try {
      const tx = await contract.recordSkillVerification(agent.address, hash, agent.endpointCount)
      await tx.wait()
      console.log(`  ✓ Skill for ${agent.name}: ${agent.endpointCount} endpoints`)
    } catch (e: any) {
      console.log(`  ✗ ${agent.name}: ${e.message.slice(0, 60)}`)
    }
  }

  // Activate premium for first 2
  console.log('\nActivating premium tiers...')
  for (const agent of EXAMPLE_AGENTS.slice(0, 2)) {
    try {
      const tx = await contract.payPremiumTier(agent.address)
      const receipt = await tx.wait()
      console.log(`  ✓ Premium for ${agent.name} — tx: ${receipt?.hash}`)
    } catch (e: any) {
      console.log(`  ✗ ${agent.name}: ${e.message.slice(0, 60)}`)
    }
  }

  // Submit reviews
  console.log('\nSubmitting reviews...')
  for (const agent of EXAMPLE_AGENTS.slice(0, 3)) {
    const commentHash = ethers.keccak256(ethers.toUtf8Bytes(`great agent ${agent.name}`))
    const proofHash = ethers.keccak256(ethers.toUtf8Bytes(`proof-${agent.name}`))
    try {
      const tx = await contract.submitReview(agent.address, true, commentHash, proofHash)
      const receipt = await tx.wait()
      console.log(`  ✓ Review for ${agent.name} — tx: ${receipt?.hash}`)
    } catch (e: any) {
      console.log(`  ✗ ${agent.name}: ${e.message.slice(0, 60)}`)
    }
  }

  console.log('\n✓ Seed complete')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
