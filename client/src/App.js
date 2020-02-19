import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import Plan from "./components/Plan";

const client = new ApolloClient({ uri: "http://localhost:4001/graphql" });

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="div mx-3" maxWidth="100%" minWidth="98%">
        <h1>Developer</h1>
        <Plan />
      </div>
    </ApolloProvider>
  );
}

export default App;
