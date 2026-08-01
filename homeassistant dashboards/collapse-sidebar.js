/**
 * collapse-sidebar.js v5
 *
 * Uses customElements.whenDefined to guarantee ha-drawer is registered
 * before traversing shadow DOM. Directly appends <style> into
 * ha-drawer's shadow root to pierce the closed shadow boundary.
 *
 * Deployed via extra_module_url in configuration.yaml.
 */
(function () {
  'use strict';

  function applyStyles() {
    const ha = document.querySelector('home-assistant');
    if (!ha?.shadowRoot) return false;

    const haMain = ha.shadowRoot.querySelector('home-assistant-main');
    if (!haMain?.shadowRoot) return false;

    const haDrawer = haMain.shadowRoot.querySelector('ha-drawer');
    if (!haDrawer?.shadowRoot) return false;

    // Check if already applied
    if (haDrawer.shadowRoot.querySelector('style[collapse-sidebar]')) {
      return true;
    }

    const style = document.createElement('style');
    style.setAttribute('collapse-sidebar', '');
    style.textContent = `
      aside {
        display: none !important;
        width: 0 !important;
        flex-basis: 0 !important;
        min-width: 0 !important;
      }
      div:not(.mdc-drawer__content) {
        flex: 1 1 auto !important;
        width: 100% !important;
        margin-left: 0 !important;
      }
    `;
    haDrawer.shadowRoot.appendChild(style);
    console.log('[collapse-sidebar] v5 applied to ha-drawer shadow root');
    return true;
  }

  // Wait for ha-drawer custom element to be defined, then apply
  customElements.whenDefined('ha-drawer').then(() => {
    // Poll until shadow DOM is populated (element defined ≠ shadow root ready)
    const poll = () => {
      if (applyStyles()) return;
      setTimeout(poll, 100);
    };
    poll();
  }).catch(err => {
    console.warn('[collapse-sidebar] ha-drawer not available:', err);
    // Fallback: try on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(poll, 500));
    } else {
      setTimeout(poll, 500);
    }
  });

  function poll() {
    if (!applyStyles()) {
      setTimeout(poll, 100);
    }
  }
})();
