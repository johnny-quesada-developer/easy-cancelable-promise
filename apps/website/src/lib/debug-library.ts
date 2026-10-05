/**
 * The state library with its DevTools integration loaded first.
 *
 * This site is a showcase, so it ships the integration on purpose: with the react-global-state-hooks
 * Chrome extension a visitor can inspect and edit the stores of the site (preferences, dialogs, toast,
 * motion). An application should keep this import in its development builds only.
 *
 * Nothing imports this file directly: astro.config.mjs resolves `react-global-state-hooks` to it in the
 * browser build, so the integration is in place before any store is created.
 */
import 'react-global-state-hooks/debug';

export * from 'react-global-state-hooks';
