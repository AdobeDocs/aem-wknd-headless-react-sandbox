# AEM WKND Headless React Sandbox

A [React](https://reactjs.org/) sandbox application to play with [Adobe Experience Manager's GraphQL APIs](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/headless-journey/developer/overview.html) and [WKND](https://wknd.site/) content.

This project was bootstrapped with [Vite](https://vitejs.dev/guide/).

## Get started

<a href="https://stackblitz.com/fork/github/AdobeDocs/aem-wknd-headless-react-sandbox?title=AEM WKND Headless React Sandbox&terminal=dev">
  <img
    alt="Open in StackBlitz"
    src="https://developer.stackblitz.com/img/open_in_stackblitz.svg"
  />
</a>

### Commands

First, install the dependencies e.g. with `npm i`

- `npm run aem:pull` - pulls the AEM WKND GraphQL schema and content fragments into the `aem-local` folder. To pull fresh content, delete the folder and re-run the command. **This command fails if executed from StackBlitz for CORS reasons. You can either [allow CORS for the AEM instance](https://experienceleague.adobe.com/docs/experience-manager-learn/foundation/security/understand-cross-origin-resource-sharing.html) or modify your browser CORS behavior e.g. by installing an extension like [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en)**
- `npm run gql` - runs the GraphQL development server.
- `npm run dev` - runs the GraphQL and the Vite development server.

## How does it work ?

After having installed npm dependencies, several scripts in `scripts/aem` are being executed to pull WKND's GraphQL schema and [Content Fragments](https://experienceleague.adobe.com/docs/experience-manager-learn/sites/content-fragments/content-fragments-console.html?lang=en) including asset references.
The content is stored under the `aem-local` folder:

- `aem-local/schema.graphql` - contains the whole WKND GraphQL schema including Adventure models and queries etc.
- `aem-local/content-fragments` - for every content fragment model found, the corresponding content fragments are being retrieved and stored as a single JSON file e.g. `adventureList.json`.
- `aem-local/assets` - for every content fragment, each asset reference is retrieved and stored by replicating the same folder structure e.g `/assets/content/dam/wknd/end/adventures/bali-surf-camp/AdobeStock_175749320.jpg`.

Once the `aem-local` folder is populated with content fragments, a local [Express](https://expressjs.com/) web server is started `gql-server.js` to serve the content fragments and assets by exposing a GraphQL client on `http://localhost:3000/gql`.
Custom Content Fragment Model properties defined in the GraphQL schema have auto-generated values for types like strings or numbers.  
A local [GraphiQL](https://github.com/graphql/graphiql) IDE is also available by default at `http://localhost:3000/gql`.

In parallel, the Vite development server is started to serve the React application on `http://localhost:5173` with Hot Module Reload enabled by default.

[AEM Headless Client JS](https://github.com/adobe/aem-headless-client-js) is used together with [React Query](https://react-query-v3.tanstack.com/) to handle the content fragment data fetching from the GraphQL development server in the React application.

## Supported queries

For the sake of the demo, only the simplest resolvers were implemented namely, listing items and querying by path. 

Sor for example, you can list adventures and retrieve assets with the following query (which is used in the React application): 

```gql
{
  adventureList {
    items {
      _path
      adventureTitle
      adventureDescription {
        plaintext
      }
      adventurePrimaryImage {
        ... on ImageRef {
          _path
        }
      }
    }
  }
} 
```

You can also query an adventure by path: 

```gql 
query getAdventure($path: String!){
  adventureByPath(_path: $path) {
    item {
      adventureTitle
    }
  }
}
```

Query variables: 

```json
{"path": "/content/dam/wknd/en/adventures/bali-surf-camp/bali-surf-camp"}
```

GraphQL directives, filters and variation selection implementations are missing but it should be technically straight forward to add them to `gql-server.js`. 
Persisted queries are not supported neither. 

Feel free to submit a Pull Request if you'll like to add these features. 

## Environment Variables

Several [environment variables](https://vitejs.dev/guide/env-and-mode.html) are to connect to an AEM environment and the GraphQL development server.
Environment variables prefixed with `VITE_` are accessible client-side by default.

If you wish to change environment variables update the `.env` file accordingly:

- `VITE_GQL_DEV_SERVER_HOSTNAME = localhost` - GraphQL development server hostname
- `VITE_GQL_DEV_SERVER_PORT = 3000` - GraphQL development server port
- `VITE_GQL_DEV_ENDPOINT = /gql` - GraphQL development server endpoint

- `AEM_SERVER = https://wknd.site` - AEM production server
- `AEM_GQL_ENDPOINT = /content/_cq_graphql/global/endpoint.json` - AEM production GraphQL endpoint from where to retrieve GraphQL schema and Content Fragments


## Issue tracker

Use the [GitHub issue tracker](https://github.com/AdobeDocs/aem-wknd-headless-react-sandbox/issues) to report issues or ask questions.
Any feedback is welcome !

Please check existing issues before filing anything new.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.
