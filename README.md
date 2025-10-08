# E-Commerce storefront

A React + TypeScript storefront scaffolded with Vite and Tailwind CSS. It includes a themed layout, authentication flows wired
into context, a product catalogue, cart management, and informational pages so you can focus on integrating your own backend.

## Getting started

```bash
npm install
npm run dev
```

The app runs on [http://localhost:5173](http://localhost:5173) by default.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

- `VITE_API_BASE_URL` – set this to your backend origin (e.g. `https://api.example.com`). When omitted, the front-end falls back to
  the built-in mock data layer.
- `VITE_USE_MOCKS` – defaults to `true`. Set to `false` to force live API calls when `VITE_API_BASE_URL` is configured.

## Available scripts

- `npm run dev` – start the Vite dev server.
- `npm run build` – type-check and build for production.
- `npm run preview` – preview the production build locally.

## Features

- **Design system tokens** for colors, typography, spacing, and layout applied through a `ThemeProvider`.
- **Auth context** with login, signup, and profile flows. State is persisted in `localStorage` and ready to swap to your own API.
- **Cart context** backed by a mock/localStorage service with add, update, remove, and clear actions.
- **Product catalogue** pages powered by a catalog service that can point to your backend.
- **Marketing pages** including shipping, returns, privacy, terms, and contact to match the navigation links.
- **Promo ticker** with dismiss persistence and theme-aware styling.

## Connecting a backend

1. Implement REST endpoints that match the following routes (or update the services accordingly):
   - `POST /auth/login`, `POST /auth/signup`, `GET /auth/me`, `POST /auth/logout`
   - `GET /products`, `GET /products/:id`
   - `GET /cart`, `POST /cart`, `PATCH /cart/:productId/:variantId`, `DELETE /cart/:productId/:variantId`, `POST /cart/clear`
2. Set `VITE_API_BASE_URL` to the backend base URL and `VITE_USE_MOCKS=false`.
3. Deploy the React app or continue iterating locally. The services in `src/services/` centralize API calls so you can customise
   headers, authentication, or data transformation in one place.

## Testing

Run the production build (includes type-checking) before committing:

```bash
npm run build
```
