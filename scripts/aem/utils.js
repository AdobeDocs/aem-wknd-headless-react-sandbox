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

import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs-extra';
import path from 'node:path';
import fetch from 'node-fetch';
import objectScan from 'object-scan';
import { execute, Source, parse, buildClientSchema, printSchema } from 'graphql';
import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';

const AEM_SERVER = process.env.AEM_SERVER;
const AEM_GQL_ENDPOINT = process.env.AEM_GQL_ENDPOINT;
const GQL_DEV_SERVER_HOSTNAME = process.env.VITE_GQL_DEV_SERVER_HOSTNAME;
const GQL_DEV_SERVER_PORT = process.env.VITE_GQL_DEV_SERVER_PORT;
const GQL_DEV_ENDPOINT = process.env.VITE_GQL_DEV_ENDPOINT;

const ROOT_DIR = 'aem-local';
const SCHEMA_PATH = path.join(ROOT_DIR, 'schema.graphql');
const CFS_PATH = path.join(ROOT_DIR, 'content-fragments');
const ASSETS_PATH = path.join(ROOT_DIR, 'assets');

function getConfig() {
  return {
    AEM_SERVER,
    AEM_GQL_ENDPOINT,
    GQL_DEV_SERVER_HOSTNAME,
    GQL_DEV_SERVER_PORT,
    GQL_DEV_ENDPOINT,
    SCHEMA_PATH,
    CFS_PATH,
    ASSETS_PATH
  };
}

async function runGQLQuery(query) {
  const typeDefs = await loadGQLSchema();

  const schema = makeExecutableSchema({
    typeDefs
  });

  const source = new Source(query);
  const document = parse(source);

  return await execute({ schema, document });
}

function hasGQLSchema() {
  return fs.existsSync(SCHEMA_PATH);
}

function hasAssets() {
  return fs.existsSync(ASSETS_PATH);
}

async function loadGQLSchema() {
  return await loadSchema(SCHEMA_PATH, {
    loaders: [new GraphQLFileLoader()]
  });
}

function createGQLSchema(schema) {
  const graphqlSchemaObj = buildClientSchema(schema);
  const sdlString = printSchema(graphqlSchemaObj);
  fs.ensureFileSync(SCHEMA_PATH);
  fs.writeFileSync(SCHEMA_PATH, sdlString);

  console.log(`Successfully created "${SCHEMA_PATH}"`);
}

function cleanCFs() {
  fs.emptyDirSync(CFS_PATH);
}

function hasCFs() {
  return fs.existsSync(CFS_PATH);
}

function loadAllCFs(callback) {
  if (fs.existsSync(CFS_PATH)) {
    fs.readdirSync(CFS_PATH).forEach((filename) => {
      const resolverList = filename.replace('.json', '');
      const name = resolverList.slice(0, -4);
      const resolverByPath = `${name}ByPath`;
      const { data } = fs.readJsonSync(path.join(CFS_PATH, filename));

      callback({ name, resolverList, resolverByPath, data });
    });
  }
}

function createCFs({ name, data }) {
  const filePath = path.join(CFS_PATH, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`Successfully created "${filePath}"`);
}

function cleanAssets() {
  fs.emptyDirSync(ASSETS_PATH);
}

function getAssetsDir() {
  return ASSETS_PATH;
}

function getAssetPaths({ data, references }) {
  return objectScan(['**'], {
    rtn: 'value',
    filterFn: ({ property, value, parent }) => {
      return property === '_path' && value.startsWith('/content/dam/') && references.includes(parent.__typename);
    }
  })(data);
}

async function createAsset({ from, to }) {
  console.log(`Pulling ${from} ...`);
  const res = await fetch(from);
  const finalTo = path.join(ASSETS_PATH, to);
  fs.ensureDirSync(path.dirname(finalTo));

  const fileStream = fs.createWriteStream(finalTo);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', (e) => {
      console.error(e);
      reject();
    });
    fileStream.on('finish', () => {
      console.log(`Successfully created "${to}"`);
      resolve();
    });
  });
}

async function fetchModels() {
  const modelQuery = `{
    __schema {
      types {
        name
      }
    }
  }`;

  const modelRes = await runGQLQuery(modelQuery);
  return modelRes.data.__schema.types.filter(({ name }) => name.endsWith('Model')).map(({ name }) => name);
}

async function fetchReferences() {
  const modelQuery = `{
    __schema {
      types {
        name
      }
    }
  }`;

  const modelRes = await runGQLQuery(modelQuery);
  return modelRes.data.__schema.types.filter(({ name }) => name.endsWith('Ref')).map(({ name }) => name);
}

export {
  getConfig,
  hasGQLSchema,
  loadGQLSchema,
  createGQLSchema,
  hasAssets,
  hasCFs,
  cleanCFs,
  loadAllCFs,
  createCFs,
  getAssetsDir,
  cleanAssets,
  createAsset,
  getAssetPaths,
  runGQLQuery,
  fetchModels,
  fetchReferences
};
