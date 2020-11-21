import { store } from './store.js'
import { render, fireEvent, screen } from '@testing-library/vue'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import App from './app.vue'

let postedData = []
const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
    postedData.push(req.body)
    return res(
      ctx.json({
        name: 'Lachlan'
      })
    )
  })
)

describe('login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('successfully authenticates', async () => {
    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText('Hello, Lachlan')
  })

  it('handles incorrect credentials', async () => {
    const error = 'Error: please check the details and try again' 
    server.use(
      rest.post('/login', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({ error })
        )
      })
    )

    render(App, { store })
    await fireEvent.update(
      screen.getByRole('username'), 'Lachlan')
    await fireEvent.update(
      screen.getByRole('password'), 'secret-password')
    await fireEvent.click(screen.getByText('Click here to sign in'))

    await screen.findByText(error)
  })
})

