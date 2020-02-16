//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver").v1;
const makeAugmentedSchema = require("neo4j-graphql-js").makeAugmentedSchema;
const dotenv = require("dotenv");
const ApolloServer = require("apollo-server-express");
const fs = require("fs");
const express = require("express");
const path = require("path");
// set environment variables from ../.env
dotenv.config();

const app = express();

/* Create an executable GraphQL schema object from GraphQL type definitions including autogenerated queries and mutations. Optionally a config object can be included to specify which types to include in generated queries and/or mutations. Read more in the docs: https://grandstack.io/docs/neo4j-graphql-js-api.html#makeaugmentedschemaoptions-graphqlschema */
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

/* Create a new ApolloServer instance, serving the GraphQL schema created using makeAugmentedSchema above and injecting the Neo4j driver instance into the context object so it is available in the generated resolvers to connect to the database. */
const server = new ApolloServer({
  context: {
    driver
  },
  schema: schema,
  introspection: true,
  playground: true
});

// Specify port and path for GraphQL endpoint
const port = process.env.GRAPHQL_LISTEN_PORT || 4001;
const linkPath = "/graphql";

/* Optionally, apply Express middleware for authentication, etc This also also allows us to specify a path for the GraphQL endpoint */
server.applyMiddleware({ app, linkPath });

app.listen(
  {
    port,
    path
  },
  () => {
    console.log(`GraphQL server ready at http://localhost:${port}${path}`);
  }
);