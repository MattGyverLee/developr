import { ForceGraph3D } from "react-force-graph";
import React, { Component } from "react";
import SpriteText from "three-spritetext";

const neo4j = require("neo4j-driver").v1;

export class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset: []
    };
  }

  componentDidMount() {
    var dataset = this.state.dataset;
    this.setState({ loading: true });

    // TODO: Offload this lookup to backend server.
    const driver = neo4j.driver(
      process.env.REACT_APP_NEO4J_URI || "bolt://localhost:7687",
      neo4j.auth.basic(
        process.env.REACT_APP_NEO4J_USER || "neo4j",
        process.env.REACT_APP_NEO4J_PASSWORD || "neo4j"
      )
    );

    const session = driver.session();
    const start = new Date();
    const planId = "1";
    session
      .run(
        `
        MATCH p=(s)-[r:IS_IN_GROUP {planId: "${planId}"}]->(t)
        RETURN { id: id(s), label:head(labels(s)), caption:s.label, level:s.currentLevel } as source, { id: id(t), label:head(labels(t)), caption:t.label, level:t.currentLevel } as target
        UNION
        MATCH p=(s)-[:COMPETENCY_PROGRESS]->(t)
        RETURN { id: id(s), label:head(labels(s)), caption:s.label, level:s.currentLevel } as source, { id: id(t), label:head(labels(t)), caption:t.label, level:t.currentLevel } as target 
        UNION
        MATCH p=(s)-[r:HAS_CATEGORY {planId: "${planId}"}]->(t)
        RETURN { id: id(s), label:head(labels(s)), caption:s.label, level:s.currentLevel } as source, { id: id(t), label:head(labels(t)), caption:t.label, level:t.currentLevel } as target
        LIMIT 2500
      `
      )
      .then(result => {
        const nodes = {};
        const links = result.records.map(r => {
          var source = r.get("source");
          source.id = source.id.toNumber();
          nodes[source.id] = source;
          var target = r.get("target");
          target.id = target.id.toNumber();
          nodes[target.id] = target;
          return { source: source.id, target: target.id };
        });
        session.close();
        console.log(
          links.length + " links loaded in " + (new Date() - start) + " ms."
        );
        const gData = { nodes: Object.values(nodes), links: links };
        this.setState({ graph: gData });
      });
  }

  render() {
    if (this.state.graph) {
      return (
        <div>
          <h2>Data</h2>
          <ForceGraph3D
            graphData={this.state.graph}
            nodeAutoColorBy="label"
            nodeThreeObject={node => {
              const sprite = new SpriteText(node.caption);
              sprite.color = node.color;
              sprite.textHeight = 8;
              return sprite;
            }}
          />
        </div>
      );
    } else return <h2>Loading...</h2>;
  }
}

export default Graph;
