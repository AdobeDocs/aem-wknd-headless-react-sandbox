import fetch from 'node-fetch';
import AEMHeadless from '@adobe/aem-headless-client-js';
import {
  getConfig,
  hasGQLSchema,
  hasCFs,
  fetchModels,
  runGQLQuery,
  fetchReferences,
  getAssetPaths,
  createAsset,
  hasAssets
} from './utils.js';
import fs from 'fs-extra';
import path from 'node:path';

const { AEM_SERVER, AEM_GQL_ENDPOINT, CFS_PATH, ASSETS_PATH } = getConfig();

(async () => {
  if (hasGQLSchema() && !hasCFs()) {
    const aemHeadlessClient = new AEMHeadless({
      serviceURL: AEM_SERVER,
      endpoint: AEM_GQL_ENDPOINT,
      fetch
    });

    const models = await fetchModels();

    if (models.length) {
      fs.emptyDirSync(CFS_PATH);

      const references = await fetchReferences();

      for (const modelName of models) {
        // Create content fragment
        console.log(`Pulling ${modelName} content fragments from ${AEM_SERVER} ...`);

        const fieldQuery = `{
        __type(name:"${modelName}") {
          fields {
            name
            type {
              name
              kind
              possibleTypes {
                name
              }
              fields {
                name
              }
            }
          }
        }
      }`;

        const fieldRes = await runGQLQuery(fieldQuery);
        const fields = fieldRes.data.__type.fields;

        const listName = modelName.toLowerCase().replace('model', 'List');
        let CFQuery = `${listName} { items {\n`;

        fields.forEach((field) => {
          if (field.name !== '_metadata') {
            if (field.type.fields) {
              CFQuery += `\t${field.name}{ ${field.type.fields.map(({ name }) => name).join(' ')} }\n`;
            } else if (field.type.possibleTypes) {
              CFQuery += `\t${field.name}{ ${field.type.possibleTypes
                .map(({ name }) => `... on ${name} { __typename _path }`)
                .join(' ')} }\n`;
            } else {
              CFQuery += `\t${field.name}\n`;
            }
          }
        });

        CFQuery += '\t}\n}';

        const data = await aemHeadlessClient.runQuery(`{
        ${CFQuery}
      }`);

        const filePath = path.join(CFS_PATH, `${listName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log(`Successfully created "${filePath}"`);

        // Create references
        if (!hasAssets()) {
          const assetPaths = getAssetPaths({ data, references });
          if (assetPaths.length) {
            fs.emptyDirSync(ASSETS_PATH);

            assetPaths.forEach(async (assetPath) => {
              await createAsset({
                from: path.join(AEM_SERVER, assetPath),
                to: assetPath
              });
            });
          }
        }
      }
    }
  }
})();
