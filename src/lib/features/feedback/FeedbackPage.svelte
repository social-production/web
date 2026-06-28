<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { extractErrorMessage } from '$lib/api/drivers/fastapi/client';
  import { localizedApiError } from '$lib/i18n/notifications';
  import * as m from '$lib/paraglide/messages';
  import { submitFeedback, type FeedbackCategory } from '$lib/services/queries/feedback';

  let category: FeedbackCategory = 'bug';
  let title = '';
  let description = '';
  let pending = false;
  let errorMessage = '';
  let issueUrl = '';
  let submitted = false;

  async function handleSubmit() {
    if (pending) {
      return;
    }

    pending = true;
    errorMessage = '';

    try {
      const pageUrl = browser
        ? `${window.location.origin}${$page.url.pathname}${$page.url.search}`
        : undefined;
      const result = await submitFeedback({
        category,
        title: title.trim(),
        description: description.trim(),
        pageUrl
      });
      submitted = true;
      issueUrl = result.issueUrl;
    } catch (err) {
      errorMessage = localizedApiError(extractErrorMessage(err, ''), m.feedback_error_generic());
    } finally {
      pending = false;
    }
  }
</script>

<section class="page">
  <section class="hero-card">
    <h1>{m.feedback_title()}</h1>
    <p>{m.feedback_intro()}</p>
  </section>

  {#if submitted}
    <section class="success-card">
      <h2>{m.feedback_success_title()}</h2>
      {#if issueUrl}
        <a class="github-link" href={issueUrl} rel="noopener noreferrer" target="_blank">
          {m.feedback_success_view_github()}
        </a>
      {:else}
        <p>{m.feedback_success_no_link()}</p>
      {/if}
    </section>
  {:else}
    <form class="form-card" on:submit|preventDefault={handleSubmit}>
      <div class="category-row">
        <button
          class:active={category === 'bug'}
          class="category-button"
          type="button"
          on:click={() => (category = 'bug')}
        >
          {m.feedback_category_bug()}
        </button>
        <button
          class:active={category === 'idea'}
          class="category-button"
          type="button"
          on:click={() => (category = 'idea')}
        >
          {m.feedback_category_idea()}
        </button>
      </div>

      <label class="field">
        <span>{m.feedback_title_label()}</span>
        <input bind:value={title} maxlength="200" placeholder={m.feedback_title_placeholder()} required type="text" />
      </label>

      <label class="field">
        <span>{m.feedback_description_label()}</span>
        <textarea
          bind:value={description}
          maxlength="5000"
          placeholder={m.feedback_description_placeholder()}
          required
          rows="8"
        ></textarea>
      </label>

      <input autocomplete="off" class="honeypot" name="website" tabindex="-1" type="text" />

      {#if errorMessage}
        <p class="error">{errorMessage}</p>
      {/if}

      <button class="submit-button" disabled={pending} type="submit">
        {pending ? m.feedback_submitting() : m.feedback_submit()}
      </button>
    </form>
  {/if}
</section>

<style>
  .page,
  .form-card,
  .field {
    display: grid;
    gap: 12px;
  }

  .hero-card,
  .success-card,
  .form-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  h1,
  h2 {
    color: var(--brand-strong);
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .category-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .category-button,
  .submit-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 700;
  }

  .category-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .category-button.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--text-main);
  }

  .submit-button {
    width: fit-content;
    border: 0;
    background: var(--brand);
    color: var(--page-bg);
  }

  .github-link {
    color: var(--brand-strong);
    font-weight: 800;
  }

  .error {
    color: #b42318;
  }

  .honeypot {
    display: none;
  }
</style>
