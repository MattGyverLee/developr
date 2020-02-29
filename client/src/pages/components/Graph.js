import { ForceGraph3D } from "react-force-graph";
import React, { Component } from "react";
import SpriteText from "three-spritetext";

const neo4j = require("neo4j-driver").v1;

export class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
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
    const userId = this.props.userId || "1";
    const planId = this.props.planId || "1";
    // TODO: Un-hardcode the planID
    session
      .run(
        `
        MATCH p=(s)-[r:IS_IN_GROUP {planId: "${planId}"}]->(t)
        RETURN { id: id(s), label:head(labels(s)), caption:s.label, level:s.currentLevel } as source, { id: id(t), label:head(labels(t)), caption:t.label } as target
        UNION
        MATCH p=(s:Progress)-[:COMPETENCY_PROGRESS {userId: "${userId}"} ]->(t:Competency)-[r:IS_IN_GROUP {planId: "${planId}"}]->(u)
        WHERE exists(t.label) and NOT t.label = ""
        RETURN { id: id(s), label:head(labels(s)), caption:s.label, level:s.currentLevel } as source, { id: id(t), label:head(labels(t)), caption:t.label } as target 
        UNION
        MATCH p=(s:PlanRoot)-[r:HAS_CATEGORY {planId: "${planId}"}]->(t:CompetencyCategory)
        RETURN { id: id(s), label:head(labels(s)), caption:s.label} as source, { id: id(t), label:head(labels(t)), caption:t.label } as target
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
          {/* <h2>Data</h2> */}
          <ForceGraph3D
            graphData={this.state.graph}
            nodeAutoColorBy="label"
            onNodeDragEnd={node => {
              node.fx = node.x;
              node.fy = node.y;
              node.fz = node.z;
            }}
            linkColor={link => (link.color ? "red" : "green")}
            linkOpacity={1}
            nodeThreeObject={node => {
              if (parseInt(node.level) > 0) node.caption = node.level;
              const sprite = new SpriteText(node.caption);
              sprite.color = node.color;
              sprite.textHeight = 8;
              sprite.textWeight = 800;
              return sprite;
            }}
          />
        </div>
      );
    } else return <h2>Loading...</h2>;
  }
}

export default Graph;
