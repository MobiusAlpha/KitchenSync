import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { ROUTES } from '../routes.js';

interface AppShellProps {
  readonly children: ReactNode;
}

/**
 * Bootstrap 5 app shell with a fixed top navbar and a mobile bottom nav.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Navbar bg="success" variant="dark" fixed="top">
        <Container>
          <Navbar.Brand href="#">
            <strong>KitchenSync</strong>
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link as={NavLink} to={ROUTES.SETTINGS} aria-label="Settings">
              ⚙️
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <main style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Container>{children}</Container>
      </main>

      {/* Bottom navigation for mobile */}
      <nav
        className="navbar fixed-bottom bg-light border-top d-flex justify-content-around py-2"
        aria-label="Main navigation"
      >
        <NavLink
          to={ROUTES.PLANNER}
          className={({ isActive }) =>
            `btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}`
          }
          end
        >
          🕐 Planner
        </NavLink>
        <NavLink
          to={ROUTES.RECIPES}
          className={({ isActive }) =>
            `btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}`
          }
        >
          📖 Recipes
        </NavLink>
        <NavLink
          to={ROUTES.MEAL}
          className={({ isActive }) =>
            `btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}`
          }
        >
          🍽 Meal Plan
        </NavLink>
        <NavLink
          to={ROUTES.TIMER}
          className={({ isActive }) =>
            `btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}`
          }
        >
          ⏱ Timer
        </NavLink>
      </nav>
    </>
  );
}
