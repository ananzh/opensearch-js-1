/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

'use strict'

const { test } = require('tap')
const FakeTimers = require('@sinonjs/fake-timers')
const { Transport } = require('../../index')
const {
  Client,
  connection: { MockConnection, MockConnectionSniff }
} = require('../utils')
const noop = () => { }

test('Request id', t => {
  t.test('Default generateRequestId', t => {
    const { generateRequestId } = Transport.internals
    t.type(generateRequestId, 'function')

    const genReqId = generateRequestId()
    t.type(genReqId, 'function')

    for (let i = 1; i <= 10; i++) {
      t.equal(genReqId(), i)
    }

    t.end()
  })

  t.test('Custom generateRequestId', t => {
    t.plan(7)

    const options = { context: { winter: 'is coming' } }

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      generateRequestId: function (requestParams, requestOptions) {
        t.match(requestParams, { method: 'GET', path: '/' })
        t.match(requestOptions, options)
        return 'custom-id'
      }
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.equal(meta.request.id, 'custom-id')
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.equal(meta.request.id, 'custom-id')
    })

    client.info({}, options, t.error)
  })

  t.test('Custom request id in method options', t => {
    t.plan(5)

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.equal(meta.request.id, 'custom-id')
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.equal(meta.request.id, 'custom-id')
    })

    client.info({}, { id: 'custom-id' }, t.error)
  })

  t.test('Sniff and correlation id', t => {
    t.test('sniffOnStart - should autogenerate the id', t => {
      t.plan(2)

      const client = new Client({
        node: 'http://localhost:9200',
        Connection: MockConnectionSniff,
        sniffOnStart: true
      })

      client.on('sniff', (err, { meta }) => {
        t.error(err)
        t.equal(meta.request.id, 1)
      })
    })

    t.test('sniffOnConnectionFault - should use the request id', t => {
      t.plan(5)

      const client = new Client({
        nodes: ['http://localhost:9200', 'http://localhost:9201'],
        Connection: MockConnectionSniff,
        sniffOnConnectionFault: true,
        maxRetries: 0
      })

      client.on('request', (e, { meta }) => {
        t.equal(meta.request.id, 'custom')
      })

      client.on('response', (e, { meta }) => {
        t.equal(meta.request.id, 'custom')
      })

      client.on('sniff', (e, { meta }) => {
        t.equal(meta.request.id, 'custom')
      })

      client.transport.request({
        path: '/500',
        method: 'GET'
      }, {
        id: 'custom',
        headers: { timeout: 'true' }
      }, noop)
    })

    t.end()
  })

  t.test('Resurrect should use the same request id of the request that starts it', t => {
    t.plan(2)

    const clock = FakeTimers.install({ toFake: ['Date'] })
    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      sniffOnConnectionFault: true,
      maxRetries: 0
    })

    const conn = client.connectionPool.getConnection()
    client.connectionPool.markDead(conn)
    clock.tick(1000 * 61)

    client.on('resurrect', (err, meta) => {
      t.error(err)
      t.equal(meta.request.id, 'custom')
      clock.uninstall()
    })

    client.info({}, { id: 'custom' }, noop)
  })

  t.end()
})

test('Request context', t => {
  t.test('no value', t => {
    t.plan(5)

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.equal(meta.context, null)
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.equal(meta.context, null)
    })

    client.info(t.error)
  })

  t.test('custom value', t => {
    t.plan(5)

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'is coming' })
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'is coming' })
    })

    client.info({}, { context: { winter: 'is coming' } }, t.error)
  })

  t.test('global value', t => {
    t.plan(5)

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      context: { winter: 'is coming' }
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'is coming' })
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'is coming' })
    })

    client.info(t.error)
  })

  t.test('override global', t => {
    t.plan(5)

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      context: { winter: 'is coming' }
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'has come' })
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.same(meta.context, { winter: 'has come' })
    })

    client.info({}, { context: { winter: 'has come' } }, t.error)
  })

  t.end()
})

test('Client name', t => {
  t.test('Property of the client instance', t => {
    const client = new Client({
      node: 'http://localhost:9200',
      name: 'cluster'
    })
    t.equal(client.name, 'cluster')
    t.end()
  })

  t.test('Is present in the event metadata (as string)', t => {
    t.plan(6)
    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      name: 'cluster'
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.equal(meta.name, 'cluster')
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.equal(meta.name, 'cluster')
    })

    client.info((err, { meta }) => {
      t.error(err)
      t.equal(meta.name, 'cluster')
    })
  })

  t.test('Is present in the event metadata (as symbol)', t => {
    t.plan(6)
    const symbol = Symbol('cluster')
    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      name: symbol
    })

    client.on('request', (err, { meta }) => {
      t.error(err)
      t.equal(meta.name, symbol)
    })

    client.on('response', (err, { meta }) => {
      t.error(err)
      t.equal(meta.name, symbol)
    })

    client.info((err, { meta }) => {
      t.error(err)
      t.equal(meta.name, symbol)
    })
  })

  t.test('Sniff and client name', t => {
    t.test('sniffOnStart', t => {
      t.plan(2)

      const client = new Client({
        node: 'http://localhost:9200',
        Connection: MockConnectionSniff,
        sniffOnStart: true
      })

      client.on('sniff', (err, { meta }) => {
        t.error(err)
        t.equal(meta.name, 'opensearch-js')
      })
    })

    t.test('sniffOnConnectionFault', t => {
      t.plan(5)

      const client = new Client({
        nodes: ['http://localhost:9200', 'http://localhost:9201'],
        Connection: MockConnectionSniff,
        sniffOnConnectionFault: true,
        maxRetries: 0
      })

      client.on('request', (e, { meta }) => {
        t.equal(meta.name, 'opensearch-js')
      })

      client.on('response', (e, { meta }) => {
        t.equal(meta.name, 'opensearch-js')
      })

      client.on('sniff', (e, { meta }) => {
        t.equal(meta.name, 'opensearch-js')
      })

      client.transport.request({
        path: '/500',
        method: 'GET'
      }, {
        headers: { timeout: 'true' }
      }, noop)
    })

    t.end()
  })

  t.test('Resurrect should have the client name configured', t => {
    t.plan(2)

    const clock = FakeTimers.install({ toFake: ['Date'] })
    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      sniffOnConnectionFault: true,
      maxRetries: 0
    })

    const conn = client.connectionPool.getConnection()
    client.connectionPool.markDead(conn)
    clock.tick(1000 * 61)

    client.on('resurrect', (err, meta) => {
      t.error(err)
      t.equal(meta.name, 'opensearch-js')
      clock.uninstall()
    })

    client.info({}, { id: 'custom' }, noop)
  })

  t.test('Resurrect should have the client name configured (child client)', t => {
    t.plan(2)

    const clock = FakeTimers.install({ toFake: ['Date'] })
    const client = new Client({
      node: 'http://localhost:9200',
      Connection: MockConnection,
      sniffOnConnectionFault: true,
      maxRetries: 0
    })

    const child = client.child({
      name: 'child-client'
    })

    const conn = client.connectionPool.getConnection()
    client.connectionPool.markDead(conn)
    clock.tick(1000 * 61)

    client.on('resurrect', (err, meta) => {
      t.error(err)
      t.equal(meta.name, 'child-client')
      clock.uninstall()
    })

    child.info({}, { id: 'custom' }, noop)
  })

  t.end()
})
