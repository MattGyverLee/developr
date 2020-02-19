import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";

import MyPlan from "./myPlan";
import MyMilestones from "./myMilestones";
import Home from "./home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const client = new ApolloClient({ uri: "http://localhost:4001/graphql" });

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div>
          {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/myMilestones">
              <MyMilestones />
            </Route>
            <Route path="/myPlan">
              <MyPlan />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
