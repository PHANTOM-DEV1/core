'use strict'

const phantom = require('phantomjscore')
const config = require('../config')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const transferCommand = require('./transfer')

module.exports = async (options) => {
  utils.applyConfigOptions(options)

  const wallets = utils.generateWallets(options.number)
  await transferCommand(options, wallets, 50, true)

  logger.info(`Sending ${options.number} second signature transactions`)

  const transactions = []
  wallets.forEach((wallet, i) => {
    wallet.secondPassphrase = config.secondPassphrase || wallet.passphrase

    const transaction = phantom.signature.createSignature(
      wallet.passphrase,
      wallet.secondPassphrase,
      utils.parseFee(options.signatureFee)
    )

    wallet.publicKey = transaction.senderPublicKey
    wallet.secondPublicKey = transaction.asset.signature.publicKey
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${transaction.fee})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    if (options.skipValidation) {
      return
    }

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply signature transactions`)
    await delay(delaySeconds * 1000)

    for (const walletObject of wallets) {
      const wallet = await utils.getWallet(walletObject.address)

      if (wallet.secondPublicKey !== walletObject.secondPublicKey || wallet.publicKey !== walletObject.publicKey) {
        logger.error(`Invalid second signature for ${walletObject.address}.`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
