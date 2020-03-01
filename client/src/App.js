import React, { useState, useContext } from "react";
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
const client = new ApolloClient({ uri: "http://localhost:4001/graphql" });

function App() {
  const [state, setLocalState] = useState({
    domainId: localStorage.getItem("SelectedDomain") || "-1",
    userId: "1",
    planId: localStorage.getItem("SelectedPlan") || "-1"
  });

  return (
    <ApolloProvider client={client}>
      {/* Appolo provides a GraphQL communication layer between 
      server (Apollo_Server) and client (Apollo_Client) */}
      <SelectionContext.Provider value={{ state, setLocalState }}>
        <NavBar />
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
