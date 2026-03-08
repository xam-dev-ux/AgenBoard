import { ethers, run } from 'hardhat'
import * as dotenv from 'dotenv'

dotenv.config()

// Base mainnet USDC
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Fees in USDC (6 decimals)
const PREMIUM_FEE    = ethers.parseUnits('0.10', 6)
const REVIEW_FEE     = ethers.parseUnits('0.02', 6)
const ANALYTICS_FEE  = ethers.parseUnits('0.05', 6)
const COMPARE_FEE    = ethers.parseUnits('0.02', 6)

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH')

  const operator = process.env.OPERATOR_ADDRESS || deployer.address
  const treasury = process.env.TREASURY_ADDRESS || deployer.address

  console.log('\nDeploying AgentboardReputation...')
  const Contract = await ethers.getContractFactory('AgentboardReputation')
  const contract = await Contract.deploy(
    USDC_ADDRESS,
    operator,
    treasury,
    PREMIUM_FEE,
    REVIEW_FEE,
    ANALYTICS_FEE,
    COMPARE_FEE
  )

  await contract.waitForDeployment()
  const address = await contract.getAddress()

  console.log('\n✓ AgentboardReputation deployed to:', address)
  console.log('  USDC:', USDC_ADDRESS)
  console.log('  Operator:', operator)
  console.log('  Treasury:', treasury)
  console.log('  Premium fee:   0.10 USDC')
  console.log('  Review fee:    0.02 USDC')
  console.log('  Analytics fee: 0.05 USDC')
  console.log('  Compare fee:   0.02 USDC')

  console.log('\nWaiting 10s for Basescan propagation...')
  await new Promise(r => setTimeout(r, 10000))

  try {
    await run('verify:verify', {
      address,
      constructorArguments: [
        USDC_ADDRESS,
        operator,
        treasury,
        PREMIUM_FEE,
        REVIEW_FEE,
        ANALYTICS_FEE,
        COMPARE_FEE,
      ],
    })
    console.log('✓ Verified on Basescan')
  } catch (e: any) {
    console.log('Verification failed (may already be verified):', e.message)
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('CONTRACT_ADDRESS=' + address)
  console.log('─────────────────────────────────────────────')
  console.log('View: https://basescan.org/address/' + address)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
