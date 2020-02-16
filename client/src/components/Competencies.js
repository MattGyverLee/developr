import React, { Component } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";

const DOMAIN_QUERY = gql`
  query DomainQuery {
    Domain(id: "1") {
      label
      id
      primary_domain_of {
        label
      }
    }
  }
`;

export class Competencies extends Component {
  render() {
    return (
      <div>
        <h1 className="display-4 my-3">Competencies</h1>
        <Query query={DOMAIN_QUERY}>
          {({ loading, error, data }) => {
            if (loading) return <h4>Loading...</h4>;
            if (error) console.log(error);
            console.log(data);
            return <h1>Test</h1>;
          }}
        </Query>
      </div>
    );
  }
}

export default Competencies;
