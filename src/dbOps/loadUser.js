const neo4j = require("neo4j-driver").v1;
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

var q = [],
  p = [];
var dom = "";
var plan = "";
var comp = "";
var planrt = "";
//Parameters

console.log;

const Cypher = require("cypher-tagged-templates").default;
const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);
const cypher = new Cypher({ driver }).query;

//Clear Database, only funs first time.

var dateobj = new Date();
var myNow = dateobj.toISOString();

//Domain
q.push(cypher`
    MERGE (n:User {id: "1"})
    SET n.Name = "Matthew"
      n.PrimaryOrg = "SIL"
      n.primaryDomain = "LT"
      n.activePlan = "1"
    MERGE (pr:ProgressRoot {n.userId: "1"})
    MERGE (p)-[:HAS_PROGRESS_ROOT]->(pr)

    MERGE (pkb:Progress {competency_ref: "LT-5028854683199364"})
    SET pkb.currentLevel = 3
    MERGE (pkb)-[:IS_PROGRESS_OF]->(pr)
    
    MERGE (pcomp:Progress {competency_ref: "LT-5028854683199364"})
    SET pcomp.currentLevel = 4
    MERGE (pcomp)-[:IS_PROGRESS_OF]->(pr)

    MERGE (pfon:Progress {competency_ref: "LT-525255055828868"})
    SET pfon.currentLevel = 4
    MERGE (pfon)-[:IS_PROGRESS_OF]->(pr)

    MERGE (pmal:Progress {competency_ref: "LT-2777054869514116"})
    SET pmal.currentLevel = 3
    MERGE (pmal)-[:IS_PROGRESS_OF]->(pr)

    MERGE (pos:Progress {competency_ref: "LT-8688029380437892"})
    SET pos.currentLevel = 4
    MERGE (pos)-[:IS_PROGRESS_OF]->(pr)
    
    MERGE (plang:Progress {competency_ref: "LT-6436229566752644"})
    SET plang.currentLevel = 4
    MERGE (plang)-[:IS_PROGRESS_OF]->(pr)
      
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
    //sleep(100);
    if (indexy < inQuery.length - 1) {
      doSafeQuery(inQuery, indexy + 1);
    }
  });
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

doSafeQuery(q, 0);

//.then(console.log("Database updated, Connection Closed"));

//driver.close();
