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
