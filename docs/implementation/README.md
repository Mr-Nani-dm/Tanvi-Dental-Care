# Frontend implementation guide

## Architecture

`app` owns routes and page composition. `components` owns reusable UI. `lib` and `config` own application data and utilities. `content` is reserved for reviewed page content. `styles` owns design tokens and global presentation.

## Content governance

Business facts must originate from verified data. Clinical claims require medical review. Never create services, credentials, prices, reviews, patient stories or contact details from assumptions.

## Component rule

Prefer small composable components over page-specific copies. Components should express a single visual or semantic responsibility.

## UX rule

Every patient-facing route should answer a real patient need and provide a clear, non-manipulative next action.

## Accessibility rule

Use semantic landmarks, logical heading hierarchy, visible focus, keyboard access, sufficient contrast, meaningful labels and reduced-motion behavior.

## Performance rule

Prefer server-rendered content, optimized local assets, minimal client JavaScript and lazy loading for below-the-fold media. Third-party scripts must justify their cost.
