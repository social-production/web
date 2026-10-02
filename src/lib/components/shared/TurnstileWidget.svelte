<script lang="ts">
  import { onMount } from 'svelte';
  import { TURNSTILE_SITE_KEY } from '$lib/config/env';

  export let token = '';

  let container: HTMLDivElement | null = null;
  let loadError = '';

  type TurnstileApi = {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (value: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
      }
    ) => string;
  };

  onMount(() => {
    if (!TURNSTILE_SITE_KEY || !container) return;

    let cancelled = false;
    const widgetHost = container;

    function renderWidget() {
      const turnstile = (window as Window & { turnstile?: TurnstileApi }).turnstile;
      if (!turnstile || cancelled) return;
      turnstile.render(widgetHost, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (value) => {
          token = value;
        },
        'expired-callback': () => {
          token = '';
        },
        'error-callback': () => {
          token = '';
          loadError = 'The captcha could not be completed. Try again.';
        }
      });
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing && (window as Window & { turnstile?: TurnstileApi }).turnstile) {
      renderWidget();
      return () => {
        cancelled = true;
      };
    }

    const script = existing ?? document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', renderWidget, { once: true });
    script.addEventListener(
      'error',
      () => {
        loadError = 'The captcha could not be loaded.';
      },
      { once: true }
    );
    if (!existing) document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  });
</script>

<div class="captcha">
  <div bind:this={container}></div>
  {#if loadError}
    <p class="status-note">{loadError}</p>
  {/if}
</div>

<style>
  .captcha {
    min-height: 65px;
  }

  .status-note {
    margin: 8px 0 0;
    color: var(--danger, #b91c1c);
    font-size: 13px;
  }
</style>
