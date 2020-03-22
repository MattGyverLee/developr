import React, { useState } from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import VisPage from "./pages/visPage";
import MyPlan from "./pages/myPlan";
import MyMilestones from "./pages/myMilestones";
import MyOverview from "./pages/myOverview";
import MyTable from "./pages/myTable";
import Home from "./pages/home";
import MyRadar from "./pages/radar";
import EditCompetency from "./pages/editCompetency";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { SelectionContext } from "./components/utilities/SelectionContext";
import NavBar from "./components/nav/NavBar";
import { resolvers, typeDefs } from "./resolvers";
import { useQuery } from "@apollo/react-hooks";
import { InMemoryCache } from "apollo-cache-inmemory";
import { SITREP } from "./components/queries";

const cache = new InMemoryCache();

const client = new ApolloClient({
  cache,
  uri: process.env.REACT_APP_GRAPHQL_URI,
  typeDefs,
  resolvers
});

const provisionStorage = () => {
  if (!localStorage.getItem("SelectedDomain")) {
    localStorage.setItem("SelectedDomain", "-1");
  }
  if (!localStorage.getItem("SelectedPlan")) {
    localStorage.setItem("SelectedPlan", "-1");
  }
  if (!localStorage.getItem("SelectedMilestone")) {
    localStorage.setItem("SelectedMilestone", "-1");
  }
  if (!localStorage.getItem("SelectedUser")) {
    localStorage.setItem("SelectedUser", "1");
  }
  cache.writeData({
    data: {
      userId: localStorage.getItem("SelectedUser") || "1",
      planId: localStorage.getItem("SelectedPlan") || "-1",
      domainId: localStorage.getItem("SelectedDomain") || "-1",
      milestoneId: localStorage.getItem("SelectedMilestone") || "-1"
    }
  });
};

function App() {
  provisionStorage();
  const [state, setLocalState] = useState({
    domainId: localStorage.getItem("SelectedDomain"),
    userId: localStorage.getItem("SelectedUser"),
    planId: localStorage.getItem("SelectedPlan"),
    milestoneId: localStorage.getItem("SelectedMilestone")
  });
  const showDebug = false;
  const DebugInfo = () => {
    const { data } = useQuery(SITREP);
    return (
      <div>
        <div>
          Cache: Plan: {data.planId} milestone: {data.milestoneId} domain:{" "}
          {data.domainId}
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
        {showDebug && <DebugInfo />}
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
              <Route path="/myOverview">
                {/* This Shows a progress table for a specific Milestone */}
                <MyOverview />
              </Route>
              <Route path="/myPlan">
                {/* This is the main growth plan workspace. */}
                <MyPlan />
              </Route>
              <Route path="/graph">
                {/* This is the graph vis page. */}
                <VisPage />
              </Route>
              <Route path="/radar">
                {/* This is the radar page. */}
                <MyRadar />
              </Route>
              <Route path="/table">
                {/* This is the table page. */}
                <MyTable />
              </Route>
              <Route path="/edcomp">
                {/* This is the competency editor page. */}
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
