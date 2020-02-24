import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import VisPage from "./pages/visPage";
import MyPlan from "./pages/myPlan";
import MyMilestones from "./pages/myMilestones";
import Home from "./pages/home";
import EditCompetency from "./pages/editCompetency";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const client = new ApolloClient({ uri: "http://localhost:4001/graphql" });

function App() {
  return (
    <ApolloProvider client={client}>
      {/* Appolo provides a GraphQL communication layer between 
      server (Apollo_Server) and client (Apollo_Client) */}
      <Router>
        {/* React-Router makes a single-page react app modular. */}
        <div>
          {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/myMilestones">
              {/* This Shows a progress table for a specific Milestone */}
              <MyMilestones />
            </Route>
            <Route path="/myPlan">
              {/* This is the main growth plan workspace. */}
              <MyPlan />
            </Route>
            <Route path="/graph">
              {/* This is the graph vis page. */}
              <VisPage />
            </Route>
            <Route path="/edcomp">
              {/* This is the graph vis page. */}
              <EditCompetency />
            </Route>
            <Route path="/">
              {/* This is the home page. */}
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
