import { expect } from 'chai'
import { ethers } from 'hardhat'
import { AgentboardReputation } from '../typechain-types'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

describe('AgentboardReputation', () => {
  let contract: AgentboardReputation
  let usdc: any
  let owner: HardhatEthersSigner
  let operator: HardhatEthersSigner
  let treasury: HardhatEthersSigner
  let agent1: HardhatEthersSigner
  let agent2: HardhatEthersSigner
  let user1: HardhatEthersSigner
  let user2: HardhatEthersSigner

  const PREMIUM_FEE   = ethers.parseUnits('0.10', 6)
  const REVIEW_FEE    = ethers.parseUnits('0.02', 6)
  const ANALYTICS_FEE = ethers.parseUnits('0.05', 6)
  const COMPARE_FEE   = ethers.parseUnits('0.02', 6)

  beforeEach(async () => {
    ;[owner, operator, treasury, agent1, agent2, user1, user2] = await ethers.getSigners()

    // Deploy mock USDC
    const MockToken = await ethers.getContractFactory('MockERC20')
    usdc = await MockToken.deploy('USD Coin', 'USDC', 6)

    // Deploy main contract — no ERC-8004 registry dependency
    const Contract = await ethers.getContractFactory('AgentboardReputation')
    contract = await Contract.deploy(
      await usdc.getAddress(),
      operator.address,
      treasury.address,
      PREMIUM_FEE,
      REVIEW_FEE,
      ANALYTICS_FEE,
      COMPARE_FEE
    )

    // Mint USDC to users
    await usdc.mint(user1.address, ethers.parseUnits('100', 6))
    await usdc.mint(user2.address, ethers.parseUnits('100', 6))
    await usdc.mint(owner.address, ethers.parseUnits('100', 6))

    // Approve
    await usdc.connect(user1).approve(await contract.getAddress(), ethers.MaxUint256)
    await usdc.connect(user2).approve(await contract.getAddress(), ethers.MaxUint256)
    await usdc.connect(owner).approve(await contract.getAddress(), ethers.MaxUint256)
  })

  describe('payPremiumTier', () => {
    it('activates premium for agent address', async () => {
      await expect(contract.connect(user1).payPremiumTier(agent1.address))
        .to.emit(contract, 'PremiumActivated')

      const [active] = await contract.isPremium(agent1.address)
      expect(active).to.be.true
    })

    it('charges correct USDC fee', async () => {
      const balanceBefore = await usdc.balanceOf(user1.address)
      await contract.connect(user1).payPremiumTier(agent1.address)
      const balanceAfter = await usdc.balanceOf(user1.address)
      expect(balanceBefore - balanceAfter).to.equal(PREMIUM_FEE)
    })

    it('sets 30-day expiry', async () => {
      const tx = await contract.connect(user1).payPremiumTier(agent1.address)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)
      const [, expiresAt] = await contract.isPremium(agent1.address)
      expect(expiresAt).to.equal(BigInt(block!.timestamp) + BigInt(30 * 24 * 60 * 60))
    })

    it('reverts for zero address', async () => {
      await expect(contract.connect(user1).payPremiumTier(ethers.ZeroAddress))
        .to.be.revertedWith('Invalid agent address')
    })

    it('reverts when paused', async () => {
      await contract.connect(owner).pause()
      await expect(contract.connect(user1).payPremiumTier(agent1.address))
        .to.be.revertedWithCustomError(contract, 'EnforcedPause')
    })
  })

  describe('submitReview', () => {
    it('submits positive review', async () => {
      const commentHash = ethers.keccak256(ethers.toUtf8Bytes('great agent'))
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes('proof-tx'))
      await expect(contract.connect(user1).submitReview(agent1.address, true, commentHash, proofHash))
        .to.emit(contract, 'ReviewSubmitted')
        .withArgs(user1.address, agent1.address, true, commentHash, proofHash)
    })

    it('submits negative review', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('bad'))
      await contract.connect(user1).submitReview(agent1.address, false, hash, hash)
      const [pos, neg] = await contract.getReviewSummary(agent1.address)
      expect(pos).to.equal(0n)
      expect(neg).to.equal(1n)
    })

    it('prevents duplicate reviews', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('review'))
      await contract.connect(user1).submitReview(agent1.address, true, hash, hash)
      await expect(contract.connect(user1).submitReview(agent1.address, true, hash, hash))
        .to.be.revertedWith('Already reviewed this agent')
    })

    it('prevents self-review', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('review'))
      await expect(contract.connect(user1).submitReview(user1.address, true, hash, hash))
        .to.be.revertedWith('Cannot review yourself')
    })

    it('charges review fee', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('review'))
      const balanceBefore = await usdc.balanceOf(user1.address)
      await contract.connect(user1).submitReview(agent1.address, true, hash, hash)
      const balanceAfter = await usdc.balanceOf(user1.address)
      expect(balanceBefore - balanceAfter).to.equal(REVIEW_FEE)
    })
  })

  describe('recordTrustSnapshot', () => {
    it('operator can record snapshot', async () => {
      const components: [bigint, bigint, bigint, bigint, bigint] = [30n, 25n, 20n, 15n, 10n]
      await expect(contract.connect(operator).recordTrustSnapshot(agent1.address, 85, components))
        .to.emit(contract, 'TrustSnapshotRecorded')
    })

    it('owner can also record snapshot', async () => {
      const components: [bigint, bigint, bigint, bigint, bigint] = [30n, 25n, 20n, 15n, 10n]
      await expect(contract.connect(owner).recordTrustSnapshot(agent1.address, 85, components))
        .to.emit(contract, 'TrustSnapshotRecorded')
    })

    it('non-operator cannot record snapshot', async () => {
      const components: [bigint, bigint, bigint, bigint, bigint] = [30n, 25n, 20n, 15n, 10n]
      await expect(contract.connect(user1).recordTrustSnapshot(agent1.address, 85, components))
        .to.be.revertedWith('Not operator')
    })

    it('reverts if score > 100', async () => {
      const components: [bigint, bigint, bigint, bigint, bigint] = [30n, 25n, 20n, 15n, 10n]
      await expect(contract.connect(operator).recordTrustSnapshot(agent1.address, 101, components))
        .to.be.revertedWith('Score must be 0-100')
    })

    it('returns history in reverse chronological order', async () => {
      const components: [bigint, bigint, bigint, bigint, bigint] = [30n, 25n, 20n, 15n, 10n]
      await contract.connect(operator).recordTrustSnapshot(agent1.address, 70, components)
      await contract.connect(operator).recordTrustSnapshot(agent1.address, 80, components)
      await contract.connect(operator).recordTrustSnapshot(agent1.address, 90, components)
      const history = await contract.getTrustHistory(agent1.address, 2)
      expect(history.length).to.equal(2)
      expect(history[0].score).to.equal(90n)
      expect(history[1].score).to.equal(80n)
    })
  })

  describe('recordSkillVerification', () => {
    it('operator can record skill verification', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('skill-content'))
      await expect(contract.connect(operator).recordSkillVerification(agent1.address, hash, 4))
        .to.emit(contract, 'SkillVerified')
    })

    it('stores skill record correctly', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('skill-content'))
      await contract.connect(operator).recordSkillVerification(agent1.address, hash, 6)
      const record = await contract.getSkillRecord(agent1.address)
      expect(record.skillFileHash).to.equal(hash)
      expect(record.endpointCount).to.equal(6n)
    })

    it('non-operator cannot record', async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes('skill'))
      await expect(contract.connect(user1).recordSkillVerification(agent1.address, hash, 4))
        .to.be.revertedWith('Not operator')
    })
  })

  describe('queryAgentAnalytics', () => {
    it('charges analytics fee and records payment', async () => {
      const balanceBefore = await usdc.balanceOf(user1.address)
      await contract.connect(user1).queryAgentAnalytics(agent1.address)
      const balanceAfter = await usdc.balanceOf(user1.address)
      expect(balanceBefore - balanceAfter).to.equal(ANALYTICS_FEE)
      expect(await contract.hasPaidAnalytics(user1.address, agent1.address)).to.be.true
    })
  })

  describe('compareAgents', () => {
    it('charges compare fee', async () => {
      const balanceBefore = await usdc.balanceOf(user1.address)
      await contract.connect(user1).compareAgents(agent1.address, agent2.address)
      const balanceAfter = await usdc.balanceOf(user1.address)
      expect(balanceBefore - balanceAfter).to.equal(COMPARE_FEE)
    })

    it('reverts comparing agent with itself', async () => {
      await expect(contract.connect(user1).compareAgents(agent1.address, agent1.address))
        .to.be.revertedWith('Cannot compare agent with itself')
    })
  })

  describe('updateFee', () => {
    it('owner can update fees', async () => {
      const newFee = ethers.parseUnits('0.20', 6)
      await expect(contract.connect(owner).updateFee('premium', newFee))
        .to.emit(contract, 'FeeUpdated')
        .withArgs('premium', newFee)
      const fees = await contract.getFees()
      expect(fees.premiumFee).to.equal(newFee)
    })

    it('reverts for unknown fee type', async () => {
      await expect(contract.connect(owner).updateFee('unknown', 100n))
        .to.be.revertedWith('Unknown fee type')
    })

    it('non-owner cannot update fees', async () => {
      await expect(contract.connect(user1).updateFee('premium', 100n))
        .to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
    })
  })

  describe('withdrawTreasury', () => {
    it('withdraws accumulated USDC to treasury', async () => {
      await contract.connect(user1).payPremiumTier(agent1.address)
      const hash = ethers.keccak256(ethers.toUtf8Bytes('review'))
      await contract.connect(user1).submitReview(agent2.address, true, hash, hash)

      const treasuryBefore = await usdc.balanceOf(treasury.address)
      await contract.connect(owner).withdrawTreasury()
      const treasuryAfter = await usdc.balanceOf(treasury.address)
      expect(treasuryAfter - treasuryBefore).to.equal(PREMIUM_FEE + REVIEW_FEE)
    })

    it('reverts if nothing to withdraw', async () => {
      await expect(contract.connect(owner).withdrawTreasury())
        .to.be.revertedWith('Nothing to withdraw')
    })
  })

  describe('getReviews', () => {
    it('returns all reviews', async () => {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes('review1'))
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes('review2'))
      await contract.connect(user1).submitReview(agent1.address, true, hash1, hash1)
      await contract.connect(user2).submitReview(agent1.address, false, hash2, hash2)

      const reviews = await contract.getReviews(agent1.address)
      expect(reviews.length).to.equal(2)
      expect(reviews[0].positive).to.be.true
      expect(reviews[1].positive).to.be.false
    })
  })

  describe('pause/unpause', () => {
    it('pauses and unpauses correctly', async () => {
      await contract.connect(owner).pause()
      await expect(contract.connect(user1).payPremiumTier(agent1.address))
        .to.be.revertedWithCustomError(contract, 'EnforcedPause')

      await contract.connect(owner).unpause()
      await expect(contract.connect(user1).payPremiumTier(agent1.address))
        .to.emit(contract, 'PremiumActivated')
    })
  })
})
