import App from './App.vue'

describe('<App />', () => {
  it('renders', () => {
    cy.mount(App)
    cy.get('.active').contains('Tab #1')
    cy.contains('Content #1').should('exist')
    cy.contains('Content #2').should('not.exist')

    cy.contains('Tab #2').click()

    cy.contains('Content #1').should('not.exist')
    cy.contains('Content #2').should('exist')
  })
})