import { render } from '@testing-library/vue'
import RenderFunctionsApp from './RenderFunctionsApp.vue'
import { expect } from 'vitest'

// describe('<RenderFunctionsApp />', () => {
//   it('renders', () => {
//     const { container } = render(RenderFunctionsApp)
//     expect(container.querySelector('.active')).toContain('Tab #1')
//     expect(container.querySelector('Content #1').should('exist')
//     cy.contains('Content #2').should('not.exist')

//     cy.contains('Tab #2').click()

//     cy.contains('Content #1').should('not.exist')
//     cy.contains('Content #2').should('exist')
//   })
// })