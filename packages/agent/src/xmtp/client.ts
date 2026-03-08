import { ethers } from 'ethers'
import { config } from '../config'
import { handleMessage } from './handler'

const firstMessageSet = new Set<string>()

export async function startXmtpAgent() {
  let client: any

  try {
    // Dynamic import since @xmtp/node-sdk may not be fully typed
    const { Client } = await import('@xmtp/node-sdk' as any)

    const wallet = new ethers.Wallet(config.xmtp.walletKey)
    console.log('[XMTP] Agent wallet:', wallet.address)

    const dbEncKey = Buffer.from(config.xmtp.dbEncryptionKey, 'hex')

    client = await Client.create(wallet, {
      env: config.xmtp.env,
      dbEncryptionKey: dbEncKey,
    })

    console.log('[XMTP] Agent started, listening on:', config.xmtp.env)

    // Process incoming messages
    const stream = await client.conversations.streamAllMessages()

    for await (const msg of stream) {
      // Skip own messages
      if (msg.senderInboxId === client.inboxId) continue

      const senderAddress = msg.senderAddress || msg.senderInboxId || 'unknown'
      const text = msg.content?.toString?.() || ''
      if (!text.trim()) continue

      const isFirst = !firstMessageSet.has(senderAddress)
      if (isFirst) firstMessageSet.add(senderAddress)

      console.log(`[XMTP] Message from ${senderAddress}: ${text.slice(0, 80)}`)

      try {
        const reply = await handleMessage(text, {
          senderAddress,
          isFirstMessage: isFirst,
        })

        const conversation = await client.conversations.getConversationById(
          msg.conversationId
        )
        if (conversation) {
          await conversation.send(reply)
        }
      } catch (e) {
        console.error('[XMTP] Error handling message:', e)
      }
    }
  } catch (e: any) {
    if (e?.message?.includes('module')) {
      console.warn('[XMTP] @xmtp/node-sdk not installed, skipping XMTP agent')
      console.warn('[XMTP] Install with: npm install @xmtp/node-sdk')
    } else {
      console.error('[XMTP] Fatal error:', e)
    }
  }
}
