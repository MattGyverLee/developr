//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver");
const inferSchema = require("neo4j-graphql-js").inferSchema;
const dotenv = require("dotenv");

dotenv.config();

/* const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

const session = driver.session(); */

var q = [];
var dom = "";
var plan = "";
var comp = "";
var planrt = "";
//Parameters

const Cypher = require("cypher-tagged-templates").default;
const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);
const cypher = new Cypher({ driver }).query;

//Domain
q.push(cypher`
CALL apoc.export.cypher.all("baseDB.cypher")
      `);

q.push(cypher`
CALL apoc.export.csv.all("baseDB.csv", {})
      `);

console.log(q.length);

function doSafeQuery(inQuery, indexy) {
  const Cypher = require("cypher-tagged-templates").default;
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "neo4j"
    )
  );
  const cypher = new Cypher({ driver }).query;
  const result = inQuery[indexy].run().then(result => {
    console.log(result);
    if (indexy < inQuery.length - 1) {
      doSafeQuery(inQuery, indexy + 1);
    }
  });
}

doSafeQuery(q, 0);

//driver.close();
