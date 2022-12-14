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

import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import { addMocksToSchema } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';
import casual from 'casual';
import { getConfig, hasGQLSchema, loadGQLSchema, getAssetsDir, loadAllCFs } from './scripts/aem/utils.js';

(async () => {
  if (hasGQLSchema()) {
    const { GQL_DEV_SERVER_HOSTNAME, GQL_DEV_SERVER_PORT } = getConfig();

    const app = express();
    app.use(cors());
    app.use(express.static(getAssetsDir()));

    const GQLPath = '/gql';

    const typeDefs = await loadGQLSchema();
    const QueryType = {};

    loadAllCFs(({ name, resolverList, resolverByPath, data }) => {
      QueryType[resolverList] = () => {
        return {
          items: data[resolverList].items
        };
      };

      QueryType[resolverByPath] = (_, { _path }) => {
        const item = data[resolverList].items.find((item) => item._path === _path);

        if (!item) {
          throw new Error(`Couldn't find ${name} with _path ${_path}`);
        }

        return {
          item
        };
      };
    });

    const schema = addMocksToSchema({
      schema: makeExecutableSchema({
        typeDefs,
        resolvers: {
          Reference: {
            __resolveType(obj) {
              return obj.__typename;
            }
          },
          QueryType
        }
      }),
      mocks: {
        Int: () => casual.integer(),
        Float: () => casual.double(),
        String: () => casual.string,
        Calendar: () => casual.date(`yyyy-MM-dd'T'HH:mm:ss.SSSXXX`)
      },
      preserveResolvers: true
    });

    app.use(
      GQLPath,
      graphqlHTTP({
        schema,
        graphiql: true
      })
    );

    app.listen(GQL_DEV_SERVER_PORT, GQL_DEV_SERVER_HOSTNAME, (err) => {
      if (err) {
        console.error('GraphQL server error');
        process.exit(1);
      }
      console.log(`GraphQL server running at http://${GQL_DEV_SERVER_HOSTNAME}:${GQL_DEV_SERVER_PORT}${GQLPath}`);
    });
  } else {
    console.log('Please run "npm run aem:pull-gql-schema"');
    process.exit(1);
  }
})();
