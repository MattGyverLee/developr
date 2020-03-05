import React, { useState } from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import VisPage from "./pages/visPage";
import MyPlan from "./pages/myPlan";
import MyMilestones from "./pages/myMilestones";
import Home from "./pages/home";
import EditCompetency from "./pages/editCompetency";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { SelectionContext } from "./pages/components/SelectionContext";
import NavBar from "./pages/components/NavBar";
import { resolvers, typeDefs } from "./resolvers";
import { useQuery } from "@apollo/react-hooks";
import { InMemoryCache } from "apollo-cache-inmemory";
import { SITREP } from "./pages/queries";

const cache = new InMemoryCache();

const client = new ApolloClient({
  cache,
  uri: "http://localhost:4001/graphql",
  typeDefs,
  resolvers
});

cache.writeData({
  data: {
    planId: localStorage.getItem("SelectedPlan") || "-1",
    userId: localStorage.getItem("SelectedDomain") || "1",
    domainId: localStorage.getItem("SelectedDomain") || "-1",
    milestoneId: localStorage.getItem("SelectedMilestone") || "-1"
  }
});

function App() {
  const [state, setLocalState] = useState({
    domainId: localStorage.getItem("SelectedDomain") || "-1",
    userId: "1",
    planId: localStorage.getItem("SelectedPlan") || "-1",
    milestoneId: localStorage.getItem("SelectedMilestone") || "-1"
  });

  const DebugInfo = () => {
    const { data, loading, error } = useQuery(SITREP);
    return (
      <div>
        <div>
          Cache: Plan: {data.planId} milestone: {data.milestoneId} domain:
          {data.domainId}{" "}
        </div>
        <div>
          LocS: Plan: {localStorage.getItem("SelectedPlan")} milestone:{" "}
          {localStorage.getItem("SelectedMilestone")} domain:
          {localStorage.getItem("SelectedDomain")}
        </div>
        <div>
          State - Plan: {state.planId}, milestone: {state.milestoneId}, domain:{" "}
          {state.domainId} userId: {state.userId}
        </div>
      </div>
    );
  };

  return (
    <ApolloProvider client={client}>
      {/* Appolo provides a GraphQL communication layer between 
      server (Apollo_Server) and client (Apollo_Client) */}
      <SelectionContext.Provider value={{ state, setLocalState }}>
        <NavBar />
        <DebugInfo />
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
      </SelectionContext.Provider>
    </ApolloProvider>
  );
}

export default App;
