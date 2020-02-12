//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver");
const inferSchema = require("neo4j-graphql-js").inferSchema;
const makeAugmentedSchema = require("neo4j-graphql-js").makeAugmentedSchema;
const dotenv = require("dotenv");
const ApolloServer = require("apollo-server");

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

const inferAugmentedSchema = driver => {
  return inferSchema(driver).then(result => {
    return makeAugmentedSchema({
      typeDefs: result.typeDefs
    });
  });
};

// Spin up GraphQL server using auto-generated GraphQL schema object
const createServer = schema =>
  new ApolloServer({
    context: { driver },
    schema: schema,
    playground: true
  });

inferAugmentedSchema(driver)
  .then(createServer)
  .then(server => server.listen(3000, "0.0.0.0"))
  .then(({ url }) => {
    console.log(`GraphQL API ready at ${url}`);
  })
  .catch(err => console.error(err));
