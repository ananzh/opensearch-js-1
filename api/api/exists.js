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

/* eslint camelcase: 0 */
/* eslint no-unused-vars: 0 */

const { handleError, snakeCaseKeys, normalizeArguments, kConfigurationError } = require('../utils')
const acceptedQuerystring = ['stored_fields', 'preference', 'realtime', 'refresh', 'routing', '_source', '_source_excludes', '_source_exclude', '_source_includes', '_source_include', 'version', 'version_type', 'pretty', 'human', 'error_trace', 'source', 'filter_path']
const snakeCase = { storedFields: 'stored_fields', _sourceExcludes: '_source_excludes', _sourceExclude: '_source_exclude', _sourceIncludes: '_source_includes', _sourceInclude: '_source_include', versionType: 'version_type', errorTrace: 'error_trace', filterPath: 'filter_path' }

function existsApi (params, options, callback) {
  ;[params, options, callback] = normalizeArguments(params, options, callback)

  // check required parameters
  if (params.id == null) {
    const err = new this[kConfigurationError]('Missing required parameter: id')
    return handleError(err, callback)
  }
  if (params.index == null) {
    const err = new this[kConfigurationError]('Missing required parameter: index')
    return handleError(err, callback)
  }

  let { method, body, id, index, type, ...querystring } = params
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring)

  let path = ''
  if ((index) != null && (type) != null && (id) != null) {
    if (method == null) method = 'HEAD'
    path = '/' + encodeURIComponent(index) + '/' + encodeURIComponent(type) + '/' + encodeURIComponent(id)
  } else {
    if (method == null) method = 'HEAD'
    path = '/' + encodeURIComponent(index) + '/' + '_doc' + '/' + encodeURIComponent(id)
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring
  }

  return this.transport.request(request, options, callback)
}

module.exports = existsApi
