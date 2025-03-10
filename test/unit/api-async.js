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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict'

const { errors } = require('../../index')
const { Client, buildServer } = require('../utils')

function runAsyncTest (test) {
  test('async await (search)', t => {
    t.plan(1)

    function handler (req, res) {
      res.setHeader('Content-Type', 'application/json;utf=8')
      res.end(JSON.stringify({ hello: 'world' }))
    }

    buildServer(handler, async ({ port }, server) => {
      const client = new Client({
        node: `http://localhost:${port}`
      })

      try {
        const { body } = await client.search({
          index: 'test',
          type: 'doc',
          q: 'foo:bar'
        })
        t.same(body, { hello: 'world' })
      } catch (err) {
        t.fail(err)
      }
      server.stop()
    })
  })

  test('async await (index)', t => {
    t.plan(1)

    function handler (req, res) {
      res.setHeader('Content-Type', 'application/json;utf=8')
      res.end(JSON.stringify({ hello: 'world' }))
    }

    buildServer(handler, async ({ port }, server) => {
      const client = new Client({
        node: `http://localhost:${port}`
      })

      try {
        await client.index({
          index: 'test',
          body: { foo: 'bar' }
        })
        t.pass('ok')
      } catch (err) {
        t.fail(err)
      }
      server.stop()
    })
  })

  test('async await (ConfigurationError)', async t => {
    t.plan(1)

    const client = new Client({
      node: 'http://localhost:9200'
    })

    try {
      await client.index({ body: { foo: 'bar' } })
      t.fail('Should throw')
    } catch (err) {
      t.ok(err instanceof errors.ConfigurationError)
    }
  })
}

module.exports = runAsyncTest
