'use strict'

const { crypto } = require('@phantomcore/crypto')

module.exports = (actual, expected) => {
  return {
    message: () => 'Expected value to have a valid second signature',
    pass: crypto.verifySecondSignature(actual, expected.publicKey, expected.network)
  }
}
