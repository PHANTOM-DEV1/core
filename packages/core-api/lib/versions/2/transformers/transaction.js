'use strict'

const container = require('@phantomcore/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const { crypto } = require('@phantomcore/crypto')
const { Transaction } = require('@phantomcore/crypto').models

const formatTimestamp = require('./utils/format-timestamp')

/**
 * Turns a "transaction" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const data = Transaction.deserialize(model.serialized.toString('hex'))
  const lastBlock = blockchain.getLastBlock()

  return {
    id: data.id,
    blockId: model.blockId,
    type: data.type,
    amount: data.amount,
    fee: data.fee,
    sender: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    recipient: data.recipientId,
    signature: data.signature,
    vendorField: data.vendorField,
    asset: data.asset,
    confirmations: model.block ? lastBlock.data.height - model.block.height : 0,
    timestamp: formatTimestamp(data.timestamp)
  }
}
