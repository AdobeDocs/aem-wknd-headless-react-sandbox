/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import fetch from 'node-fetch';
import { getIntrospectionQuery } from 'graphql';
import { getConfig, hasGQLSchema, createGQLSchema } from './utils.js';

(async () => {
  if (!hasGQLSchema()) {
    const { AEM_SERVER, AEM_GQL_ENDPOINT } = getConfig();

    const url = `${AEM_SERVER}${AEM_GQL_ENDPOINT}`;
    console.log(`Pulling the GraphQL schema from ${url} ...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: getIntrospectionQuery() })
      });

      const schema = (await response.json()).data;

      createGQLSchema(schema);
    } catch (e) {
      console.error('Something went wrong...');
      console.error(e);
    }
  }
})();
