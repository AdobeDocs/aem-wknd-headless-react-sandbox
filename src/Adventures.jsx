import './Adventures.css';
import { useQuery } from 'react-query';
import AEMHeadless from '@adobe/aem-headless-client-js';

const serviceURL = `http://${import.meta.env.VITE_GQL_DEV_SERVER_HOSTNAME}:${import.meta.env.VITE_GQL_DEV_SERVER_PORT}`;
const endpoint = import.meta.env.VITE_GQL_DEV_ENDPOINT;
const aemHeadlessClient = new AEMHeadless({
  serviceURL,
  endpoint
});

async function fetchAdventures() {
  const query = `{
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
  }`;

  return await aemHeadlessClient.runQuery(query);
}

function Adventures() {
  const {
    isLoading,
    isError,
    data: adventures
  } = useQuery('adventures', fetchAdventures, {
    refetchInterval: 1000
  });

  if (isLoading) {
    return <span>Loading adventures ...</span>;
  }

  if (isError) {
    return <span>Error: something went wrong</span>;
  }

  if (!adventures?.data?.adventureList?.items?.length) {
    return <span>No adventures</span>;
  }

  return (
    <section className="adventures">
      {adventures.data.adventureList.items.map((item) => {
        return (
          <div key={item._path}>
            <img alt={item.adventureTitle} src={`${serviceURL}${item.adventurePrimaryImage._path}`} />
            <h2>{item.adventureTitle}</h2>
            <p>{item.adventureDescription.plaintext}</p>
          </div>
        );
      })}
    </section>
  );
}

export default Adventures;
