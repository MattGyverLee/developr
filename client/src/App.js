import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import Competencies from "./components/Competencies";

const client = new ApolloClient({ uri: "http://localhost:4001/graphql" });

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="container">
        <h1>Developer</h1>
        <Competencies />
      </div>
    </ApolloProvider>
  );
}

export default App;
