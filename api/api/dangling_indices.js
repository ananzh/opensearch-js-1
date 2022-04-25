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

'use strict';

/* eslint camelcase: 0 */
/* eslint no-unused-vars: 0 */

const { handleError, snakeCaseKeys, normalizeArguments, kConfigurationError } = require('../utils');
const acceptedQuerystring = [
  'accept_data_loss',
  'timeout',
  'cluster_manager_timeout',
  'master_timeout',
  'pretty',
  'human',
  'error_trace',
  'source',
  'filter_path',
];
const snakeCase = {
  acceptDataLoss: 'accept_data_loss',
  clusterManagerTimeout: 'cluster_manager_timeout',
  masterTimeout: 'master_timeout',
  errorTrace: 'error_trace',
  filterPath: 'filter_path',
};

function DanglingIndicesApi(transport, ConfigurationError) {
  this.transport = transport;
  this[kConfigurationError] = ConfigurationError;
}

DanglingIndicesApi.prototype.deleteDanglingIndex = function danglingIndicesDeleteDanglingIndexApi(
  params,
  options,
  callback
) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  // check required parameters
  if (params.index_uuid == null && params.indexUuid == null) {
    const err = new this[kConfigurationError](
      'Missing required parameter: index_uuid or indexUuid'
    );
    return handleError(err, callback);
  }

  let { method, body, indexUuid, index_uuid, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'DELETE';
  path = '/' + '_dangling' + '/' + encodeURIComponent(index_uuid || indexUuid);

  // build request object
  const request = {
    method,
    path,
    body: body || '',
    querystring,
  };

  return this.transport.request(request, options, callback);
};

DanglingIndicesApi.prototype.importDanglingIndex = function danglingIndicesImportDanglingIndexApi(
  params,
  options,
  callback
) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  // check required parameters
  if (params.index_uuid == null && params.indexUuid == null) {
    const err = new this[kConfigurationError](
      'Missing required parameter: index_uuid or indexUuid'
    );
    return handleError(err, callback);
  }

  let { method, body, indexUuid, index_uuid, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'POST';
  path = '/' + '_dangling' + '/' + encodeURIComponent(index_uuid || indexUuid);

  // build request object
  const request = {
    method,
    path,
    body: body || '',
    querystring,
  };

  return this.transport.request(request, options, callback);
};

DanglingIndicesApi.prototype.listDanglingIndices = function danglingIndicesListDanglingIndicesApi(
  params,
  options,
  callback
) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_dangling';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

Object.defineProperties(DanglingIndicesApi.prototype, {
  delete_dangling_index: {
    get() {
      return this.deleteDanglingIndex;
    },
  },
  import_dangling_index: {
    get() {
      return this.importDanglingIndex;
    },
  },
  list_dangling_indices: {
    get() {
      return this.listDanglingIndices;
    },
  },
});

module.exports = DanglingIndicesApi;
