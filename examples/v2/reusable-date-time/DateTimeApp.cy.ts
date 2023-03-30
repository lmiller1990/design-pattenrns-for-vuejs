import DateTimeApp from "./DateTimeApp.vue";

describe("<DateTimeApp />", () => {
  it("renders", () => {
    cy.mount(DateTimeApp);
    function fillDate() {
      cy.get("#year").clear().type("2020");
      cy.get("#month").clear().type("2");
      cy.get("#day").clear().type("28");
    }
    cy.get("#luxon").within(() => {
      fillDate();
      cy.contains("2020-02-28T00:00:00.000");
    });

    cy.get("#moment").within(() => {
      fillDate();
      cy.contains("2020-02-28");
    });
  });
});
