This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

**Next.js App Flow**

- **Entry point & routing**: This project uses the Next.js App Router under `src/app/` (not the legacy `pages/` router). The root redirects are defined in `next.config.ts` to enforce a default locale (`/` → `/en/dashboards/crm`) and to prefix paths with a locale when missing.

- **Internationalization (i18n)**: Locales are defined in `src/configs/i18n.ts` (`en`, `id`, `ar`). The app uses a dynamic language segment `src/app/[lang]/layout.tsx` to set the HTML `lang` and `dir` attributes and wraps pages with `TranslationWrapper` which validates the locale.

- **Layouts & route groups**: There are multiple top-level layouts:
  - `src/app/[lang]/layout.tsx` — root locale-aware layout for the main app.
  - `src/app/front-pages/layout.tsx` — public/front-facing pages layout (landing, pricing, help, etc.).
  - Route groups are used (e.g. `(blank-layout-pages)`) to organize pages that share layouts.

- **Providers & global wrappers**: `src/components/Providers.tsx` composes the main context providers (server component): `NextAuthProvider`, `VerticalNavProvider`, `SettingsProvider`, `ThemeProvider`, `ReduxProvider`, and `AppReactToastify`. `Providers` reads cookie/settings and system mode via server helpers.

- **Authentication**: NextAuth is configured in `src/libs/auth.ts` (Credential + Google providers) and exposed via the API route `src/app/api/auth/[...nextauth]/route.ts`. The client-side session provider is `src/contexts/nextAuthProvider.tsx` (wraps NextAuth `SessionProvider`).

- **Server data & API**: Server actions for static/demo data live in `src/app/server/actions.ts` (they read the fake DB under `src/fake-db/`). API routes exist under `src/app/api/*` (e.g. `login`, `pages/*`, `apps/*`) to simulate backend endpoints.

- **Theming & UI**: MUI is used for theming. `InitColorSchemeScript` is included in layouts to initialize color mode. Global styles are in `src/app/globals.css` and generated icon CSS is imported (`@assets/iconify-icons/generated-icons.css`).

- **Utilities & helpers**: Server helpers like `getSystemMode`, `getMode`, and cookie-based settings live in `src/@core/utils/serverHelpers` (used by layouts and `Providers`).

- **Where to look next (quick map)**:
  - Routing & layouts: `src/app/`, `src/app/[lang]/layout.tsx`, `src/app/front-pages/layout.tsx`
  - Providers & context: `src/components/Providers.tsx`, `src/contexts/`
  - Auth: `src/libs/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/contexts/nextAuthProvider.tsx`
  - Data & server actions: `src/app/server/actions.ts`, `src/fake-db/`
  - i18n config: `src/configs/i18n.ts`

If you want, I can expand this section with a diagram, sequence flow, or examples of how a request flows from a browser to the layout → providers → page → API call. Mau saya tambahkan yang mana selanjutnya?
