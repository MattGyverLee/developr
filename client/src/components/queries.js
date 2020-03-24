// import queries from "./queries"
import gql from "graphql-tag";

// FIXME: Remove hardcoded user
export const SITREP2 = gql`
  query StatusUpdate {
    User(id: "1") {
      chosenPlan
      chosenMilestone
      chosenDomain
    }
  }
`;

export const SITREP = gql`
  query StatusUpdate {
    planId @client
    userId @client
    milestoneId @client
    domainId @client
  }
`;

export const GET_COMPETENCY = competencyId => gql`
    query EditCompetency {
      Competency(id: "${competencyId}") {
          id
          label
          default_weight
          default_expiration
          short_name {
            label
          }
          target_competency {
            label
          }
          assessment_criteria {
            label
          }
          lv1_activity {
            label
          }
          lv2_activity {
            label
          }
          lv3_activity {
            label
          }
          lv4_activity {
            label
          }
          lv5_activity {
            label
          }
        }
      }
    
  `;

export const GET_COMPETENCIES = domainId => gql`
  query listDomainCompetencies {
    Domain(id: "${domainId}") {
      primary_domain_of {
        id
        label
      }
    }
  }
`;

export const GET_DOMAINS = gql`
  query listDomains {
    Domain {
      id
      label
    }
  }
`;

export const DOMAIN_QUERY = (rootId, userId) => gql`
  query DomainQuery {
    PlanRoot(id: "${rootId}") {
      id
      label
      plan_class
      progressnames {
        order
        label
      }
      has_category {
        id
        label
        color
        target_competency {
          label
        }
        orders {
          order
          planId
        }
        category_has_competencies_of {
          id
          label
          orders {
            order
            planId
          }
          link
          default_weight
          default_expiration
          short_name {
            label
          }
          target_competency {
            label
          }
          assessment_criteria {
            label
          }
          lv1_activity {
            label
          }
          lv2_activity {
            label
          }
          lv3_activity {
            label
          }
          lv4_activity {
            label
          }
          lv5_activity {
            label
          }
        }
        has_group {
          id
          label
          orders {
            order
            planId
          }
          group_has_competencies_of {
            id
            label
            orders {
              order
              planId
            }
            link
            default_weight
            default_expiration
            short_name {
              label
            }
            target_competency {
              label
            }
            assessment_criteria {
              label
            }
            lv1_activity {
              label
            }
            lv2_activity {
              label
            }
            lv3_activity {
              label
            }
            lv4_activity {
              label
            }
            lv5_activity {
              label
            }
          }
          has_group {
            id
            label
            orders {
              order
              planId
            }
            group_has_competencies_of {
              id
              label
              orders {
                order
                planId
              }
              link
              default_weight
              default_expiration
              short_name {
                label
              }
              target_competency {
                label
              }
              assessment_criteria {
                label
              }
              lv1_activity {
                label
              }
              lv2_activity {
                label
              }
              lv3_activity {
                label
              }
              lv4_activity {
                label
              }
              lv5_activity {
                label
              }
            }
          }
        }
      }
    }
    User(id: "${userId}") {
      id
      has_progress_root {
        child_progress {
          currentLevel
          competency_progress {
            id
            label
          }
        }
      }
    }
  }
`;

export const LIST_PLANS = domainId => gql`
query listPlans  {
  Domain(id: "${domainId}") {childPlans {id label}}
}
`;

export const GET_MILESTONES = planId => gql`
query listMilestones {
  PlanRoot(id:"${planId}") {
    has_milestone {
      ms
      short_name {label}
    }
  }
}
`;

export const GET_MILESTONE_QUERY = (planId, userId, milestoneId) => gql`
  query MilestoneQuery {
    PlanRoot(id: "${planId}") {
      id
      label
      plan_class
      has_category {
        id
        label
        color
        orders {
          order
          planId
        }
        category_has_competencies_of {
          id
          label
          orders {
            order
            planId
          }
          link
          default_weight
          default_expiration
          short_name {
            label
          }
        }
        has_group {
          id
          label
          orders {
            order
            planId
          }
          group_has_competencies_of {
            id 
            label
            orders {
              order
              planId
            }
            link
            default_weight
            default_expiration
            short_name {
              label
            }
          }
          has_group {
            id
            label
            orders {
              order
              planId
            }
            group_has_competencies_of {
              id
              label
              orders {
                order
                planId
              }
              link
              default_weight
              default_expiration
              short_name {
                label
              }
            }
          }
        }
      }
    }
    User(id: "${userId}") {
      id
      has_progress_root {
        child_progress {
          currentLevel
          competency_progress {
            id
            label
          }
        }
      }
    }
    Milestone(ms: "${milestoneId}"){
      ms
      short_name {
        label
      }
      competencycategories {
        id
        TARGET_VALUE_IS_rel {
          min
          planId
          Milestone {ms}
        }
      }
      minValues   {
        id
        min
        planId
      }
    }
  }
`;

export const SET_DOMAIN = gql`
  mutation UpdateDomain(
    $user: String!
    $chosenDomain: String!
    $Name: String!
  ) {
    UpdateUser(
      id: $user
      chosenDomain: $chosenDomain
      chosenPlan: "-1"
      chosenMilestone: "-1"
      # Todo: Do I need to set selectedCompetency
      Name: $Name
    ) {
      id
      chosenDomain
      chosenPlan
      chosenMilestone
      Name
    }
  }
`;

export const SET_LOCAL_DOMAIN = gql`
  mutation SetDomain($domainId: String!) {
    setDomain(domainId: $domainId) @client {
      domainId
    }
    setPlan(planId: "-1") @client {
      planId
    }
    setMilestone(milestoneId: "-1") @client {
      milestoneId
    }
  }
`;

export const SET_PLAN = gql`
  mutation UpdatePlan($user: String!, $chosenPlan: String!, $Name: String!) {
    UpdateUser(
      id: $user
      chosenPlan: $chosenPlan
      chosenMilestone: "-1"
      Name: $Name
    ) {
      chosenPlan
    }
  }
`;

export const SET_LOCAL_PLAN = gql`
  mutation SetDomain($planId: String!) {
    setPlan(planId: $planId) @client {
      planId
    }
    setMilestone(milestoneId: "-1") @client {
      milestoneId
    }
  }
`;

export const SET_MILESTONE = gql`
  mutation UpdatePlan(
    $user: String!
    $chosenMilestone: String!
    $Name: String!
  ) {
    UpdateUser(id: $user, chosenMilestone: $chosenMilestone, Name: $Name) {
      chosenPlan
    }
  }
`;

export const SET_LOCAL_MILESTONE = gql`
  mutation SetMilestone($milestoneId: String!) {
    setMilestone(milestoneId: $milestoneId) @client {
      milestoneId
    }
  }
`;

export const GET_ANCESTOR_COMPS = gql`
  query AncestorComps {
    CompetencyCategory {
      id
      label
      childComps {
        id
        label
      }
      ancestorComps {
        id
        label
      }
    }
  }
`;
