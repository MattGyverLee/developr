import { typeDefs } from "./graphql-schema";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { makeAugmentedSchema } from "neo4j-graphql-js";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";

const neo4j = require("neo4j-driver");

// set environment variables from ../.env

dotenv.config(__dirname, `.env`);
const app = express();

// Allow Cross-Origin
app.use(cors());

/* Create an executable GraphQL schema object from GraphQL type definitions including autogenerated queries and mutations. Optionally a config object can be included to specify which types to include in generated queries and/or mutations. Read more in the docs: https://grandstack.io/docs/neo4j-graphql-js-api.html#makeaugmentedschemaoptions-graphqlschema */

const schema = makeAugmentedSchema({ typeDefs });

/* Create a Neo4j driver instance to connect to the database using credentials specified as environment variables with fallback to defaults */
const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

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
const path = "/graphql";

/* Optionally, apply Express middleware for authentication, etc This also also allows us to specify a path for the GraphQL endpoint */
server.applyMiddleware({ app, path });

app.listen(
  {
    port,
    path
  },
  () => {
    console.log(`GraphQL server ready at http://localhost:${port}${path}`);
  }
);