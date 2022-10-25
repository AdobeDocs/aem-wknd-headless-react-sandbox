import './App.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import Adventures from './Adventures';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <h1>AEM WKND Headless React Sandbox</h1>
      <p>
        <strong>
          A React sandbox application to play with Adobe Experience Manager's GraphQL APIs and WKND content.
        </strong>
      </p>
      <Adventures />
    </QueryClientProvider>
  );
}

export default App;
