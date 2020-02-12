const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLString,
  GraphQLList
} = require("graphql");
const axios = require("axios");

const PlanType = new GraphQLObjectType({
  name: "Plan",
  fields: () => ({
    domain_id: { type: GraphQLInt },
    label: { type: GraphQLString }
  })
});

const CompetencyType = new GraphQLObjectType({
  name: "Competency",
  fields: () => ({
    domain_id: { type: GraphQLInt },
    label: { type: GraphQLString }
  })
});

const LaunchType = new GraphQLObjectType({
  name: "Launch",
  fields: () => ({
    flight_number: { type: GraphQLInt },
    mission_name: { type: GraphQLString }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    launches: {
      type: new GraphQLList(LaunchType),
      resolve(parent, args) {
        return axios
          .get("https://api.spacexdata.com/v3/launches")
          .then(res => res.data);
      }
    },
    compencies: {
      type: new GraphQLList(CompetencyType),
      resolve(parent, args) {
        return axios
          .get("https://api.spacexdata.com/v3/launches")
          .then(res => res.data);
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery
});
