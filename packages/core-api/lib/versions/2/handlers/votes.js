'use strict'

const { TRANSACTION_TYPES } = require('@phantomcore/crypto').constants
const database = require('@phantomcore/core-container').resolvePlugin('database')
const utils = require('../utils')
const schema = require('../schema/votes')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactions = await database.transactions.findAllByType(TRANSACTION_TYPES.VOTE, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.index
  }
}

/**
 * @type {Object}
 */
exports.show = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transaction = await database.transactions.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
  }
}
