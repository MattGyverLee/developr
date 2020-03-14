describe("Basic Loading", function() {
  beforeEach(() => {
    /* cy.mockGraphQL(operationName => {
      switch (operationName) {
        case "GET_DOMAIN":
          return {
            test(variables) {
              expect(variables.faction).toEqual("Rebels");
            },
            mockResult: {
              data: {
                Domain: [
                  {
                    id: "0",
                    label: "General Core"
                  },
                  {
                    id: "2",
                    label: "Translation (Orlando)"
                  },
                  {
                    id: "1",
                    label: "Language Technology"
                  }
                ]
              }
            }
          };
        default:
          return {};
      }
    }); */
  });
  it("Opens the page.", function() {
    cy.visit("localhost:3000");
    cy.wait(6000);
  });
  it("Opens myPlan.", function() {
    cy.visit("localhost:3000/myPlan");
    cy.wait(6000);
  });
  it("Opens myMilestones.", function() {
    cy.visit("localhost:3000/myMilestones");
    cy.wait(6000);
  });
  it("Opens graph.", function() {
    cy.visit("localhost:3000/graph");
    cy.wait(6000);
  });
});
