//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver").v1;
const inferSchema = require("neo4j-graphql-js").inferSchema;
const makeAugmentedSchema = require("neo4j-graphql-js").makeAugmentedSchema;
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
//const typeDefs = require("./graphql-schema").typeDefs;

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

const typeDefs = fs
  .readFileSync(
    process.env.GRAPHQL_SCHEMA ||
      path.join("./generatedSchemas/inferredTypes.graphql")
  )
  .toString("utf-8");
console.log(typeDefs);
const schema = makeAugmentedSchema({ typeDefs });

var tempvar = schema;
console.log(tempvar);

// const schema = makeAugmentedSchema({typeDefs}.toString("UTF-8"));

//console.log(schema);
