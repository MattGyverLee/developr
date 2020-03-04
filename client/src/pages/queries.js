// import queries from "./queries"
import gql from "graphql-tag";

export const SITREP = gql`
  query StatusUpdate {
    isLoggedIn @client
    planId @client
    userId @client
    milestoneId @client
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
      has_category {
        id
        label
        category_has_competencies_of {
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
        has_group {
          id
          label
          group_has_competencies_of {
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
          has_group {
            id
            label
            group_has_competencies_of {
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
        category_has_competencies_of {
          id
          label
          default_weight
          default_expiration
          short_name {
            label
          }
        }
        has_group {
          id
          group_has_competencies_of {
            id 
            label
            default_weight
            default_expiration
            short_name {
              label
            }
          }
          has_group {
            id
            group_has_competencies_of {
              id
              label
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
      short_name {label}
      competencycategories {
        id
        TARGET_VALUE_IS_rel {
          min
          planId
          Milestone {ms}
        }
      }
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
