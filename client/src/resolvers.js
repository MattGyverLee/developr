import gql from "graphql-tag";

export const typeDefs = gql`
  extend type Query {
    isLoggedIn: Boolean!
    userId: Int!
    planId: String
    domainId: String
    milestoneId: String
  }

  type Session {
    userId: Int
    planId: String
    domainId: String
    milestoneId: String
  }

  extend type Mutation {
    setPlan(planId: String!): String!
    setDomain(domainId: String!): String!
    setMilestone(milestoneId: String!): String!
  }
`;

export const resolvers = {};
