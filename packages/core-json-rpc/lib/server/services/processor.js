const Joi = require('joi')
const get = require('lodash/get')
const network = require('./network')

class Processor {
  async resource (server, payload) {
    const { error } = Joi.validate(payload || {}, {
      jsonrpc: Joi.string().valid('2.0').required(),
      method: Joi.string().required(),
      id: Joi.required(),
      params: Joi.object()
    })

    if (error) {
      return this.__createErrorResponse(payload ? payload.id : null, -32600, error.message)
    }

    const { method, params, id } = payload

    try {
      const targetMethod = get(server.methods, method)

      if (!targetMethod) {
        return this.__createErrorResponse(id, -32601, 'The method does not exist / is not available.')
      }

      let schema = server.app.schemas[method]

      if (schema) {
        schema = Joi.object(Object.assign(schema, {
            network: Joi.string().valid('mainnet', 'devnet').required()
        }))

        const { error } = Joi.validate(params, schema)

        if (error) {
          return this.__createErrorResponse(id, -32602, error.message)
        }
      }

      await network.connect(params.network)

      const result = await targetMethod(params)

      return this.__createSuccessResponse(id, result)
    } catch (error) {
      return this.__createErrorResponse(id, -32603, error.message)
    }
  }

  async collection (server, payload) {
    let results = []

    for (let i = 0; i < payload.length; i++) {
      const result = await this.resource(server, payload[i])

      results.push(result)
    }

    return results
  }

  __createSuccessResponse (id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    }
  }

  __createErrorResponse (id, code, message) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    }
  }
}

module.exports = new Processor()
