import fs from 'fs-extra';
import fetch from 'node-fetch';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';
import { getConfig, hasGQLSchema } from './utils.js';

(async () => {
  if (!hasGQLSchema()) {
    const { AEM_SERVER, AEM_GQL_ENDPOINT, SCHEMA_PATH } = getConfig();

    const url = `${AEM_SERVER}${AEM_GQL_ENDPOINT}`;
    console.log(`Pulling the GraphQL schema from ${url} ...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: getIntrospectionQuery() })
      });

      const schema = (await response.json()).data;

      const graphqlSchemaObj = buildClientSchema(schema);
      const sdlString = printSchema(graphqlSchemaObj);
      fs.ensureFileSync(SCHEMA_PATH);
      fs.writeFileSync(SCHEMA_PATH, sdlString);

      console.log(`Successfully created "${SCHEMA_PATH}"`);
    } catch (e) {
      console.error('Something went wrong...');
      console.error(e);
    }
  }
})();
