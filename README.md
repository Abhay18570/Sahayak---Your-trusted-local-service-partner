# Sahayak – Smart Local Services Marketplace

A modern, responsive React + Bootstrap frontend for a local services
marketplace (electricians, plumbers, carpenters, tutors, mechanics,
cleaners, AC repair, and more).

## What's included

- **Landing page** — hero with search, category "toolbelt", featured
  providers, how-it-works, testimonials, footer.
- **Authentication** — Login page, Customer registration, Service
  Provider registration (all with mock/local state, no backend).
- **Customer dashboard** — search with category/rating/price filters,
  sortable provider list, recommended providers, booking history.

This is a frontend-only prototype. All data lives in
`src/data/mockData.js` and auth state is kept in memory via
`src/context/AuthContext.jsx` — nothing is persisted or sent to a
server, so refreshing the page resets the session.

## Getting started

```bash
npm install
npm start
```

The app runs at `http://localhost:3000`.

To create a production build:

```bash
npm run build
```

## Project structure

```
src/
  components/      Navbar, Footer, ToolIcon (custom icon set)
  context/          AuthContext (mock auth state)
  data/              mockData.js (categories, providers, testimonials, bookings)
  pages/             LandingPage, LoginPage, RegisterCustomerPage,
                       RegisterProviderPage, CustomerDashboard, ProviderDashboard
  styles/             tokens.css, layout.css, landing.css, auth.css, dashboard.css
```

## Notes for wiring up a real backend

- Replace the contents of `src/data/mockData.js` with API calls
  (e.g. `fetch`/`axios`) and feed the same shapes into the existing
  components.
- `AuthContext.jsx` is where you'd swap in real login/register calls
  and persist a token (e.g. via httpOnly cookies or a auth library).
- Routes are defined in `src/App.js` using `react-router-dom`.
