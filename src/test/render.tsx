import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

type RenderWithRouterOptions = {
  route?: string
  path?: string
} & Omit<RenderOptions, 'wrapper'>

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', path = '/', ...options }: RenderWithRouterOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}
