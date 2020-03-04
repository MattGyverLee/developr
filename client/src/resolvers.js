import gql from "graphql-tag";

export const typeDefs = gql`
  extend type Query {
    isLoggedIn: Boolean!
    userId: Int!
    planId: String
    domainId: String
    milestoneID: String
  }

  type Session {
    userId: Int!
    planId: String
    domainId: String
    milestoneID: String
  }

  extend type Mutation {
    setPlan(id: ID!): String!
    setDomain(id: ID!): String!
    setMilestone(id: ID!): String!
    setMilestone(id: ID!): String!
  }
`;

export const resolvers = {};
