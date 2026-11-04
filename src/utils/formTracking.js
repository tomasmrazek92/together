// HubSpot form tracking: form_start goal + field funnel in Amplitude. Never sends field values.
const START_GOAL = 'form_start';
const FIELD_EVENT = 'form_field';
const RESTORE_TRANSPORT_MS = 3000;

const focusSent = new Set(); // one funnel step per field
const activeForms = new Map(); // touched and not submitted, by instance
let startSent = false;
let restoreTimer = 0;

// ---------- Senders ----------

function sendStartGoal() {
  if (!window.wf || typeof window.wf.ready !== 'function') return;
  window.wf.ready(() => window.wf.sendEvent(START_GOAL));
}

function trackField(action, formId, props) {
  // Termly removes Amplitude before consent, so these are dropped, not queued.
  if (!window.amplitude || !window.amplitude.track) return;
  window.amplitude.track(FIELD_EVENT, {
    action,
    form_id: formId,
    page_path: location.pathname,
    ...props,
  });
}

// The default fetch transport doesn't survive unload.
function flushOnExit() {
  const { amplitude } = window;
  if (!amplitude || !amplitude.flush) return;

  if (amplitude.setTransport) amplitude.setTransport('beacon');
  amplitude.flush();

  // Only runs if the page lives on, e.g. a cancelled navigation.
  clearTimeout(restoreTimer);
  restoreTimer = setTimeout(() => {
    if (amplitude.setTransport) amplitude.setTransport('fetch');
  }, RESTORE_TRANSPORT_MS);
}

// ---------- Form reading ----------

function findForm({ renderer, instanceId, formId }) {
  return (
    renderer.querySelector('form.hsfc-Form') || document.getElementById(`${instanceId}-${formId}`)
  );
}

function hasValue(input) {
  if (input.type === 'checkbox' || input.type === 'radio') return input.checked;
  return !!input.value.trim();
}

// Counts only. hs_context holds every typed value, so it is skipped before any read.
function countFields(form) {
  const allFields = new Set();
  const filledFields = new Set();

  form.querySelectorAll('input[name], select[name], textarea[name]').forEach((input) => {
    if (input.name === 'hs_context' || input.closest('[data-hsfc-id="HiddenField"]')) return;

    allFields.add(input.name);
    if (hasValue(input)) filledFields.add(input.name);
  });

  return { filled_count: filledFields.size, total_fields: allFields.size };
}

// ---------- Handlers ----------

function onFormFocus(event) {
  if (startSent || !event.target.closest || !event.target.closest('.hsfc-Form')) return;
  startSent = true;
  sendStartGoal();
}

function onFieldFocus(event) {
  const { formId, instanceId, propertyReference: field } = event.detail || {};
  if (!formId || !field) return;

  const instance = instanceId || formId;
  activeForms.set(instance, { formId, instanceId: instance, renderer: event.target, field });

  const key = `${instance}|${field}`;
  if (focusSent.has(key)) return;
  focusSent.add(key);
  trackField('focus', formId, { field });
}

function onFormSubmitted(event) {
  const { formId, instanceId } = event.detail || {};
  activeForms.delete(instanceId || formId);
}

function onPageHide() {
  if (!activeForms.size) return;

  activeForms.forEach((active) => {
    const form = findForm(active);
    trackField('exit', active.formId, {
      last_field: active.field,
      ...(form ? countFields(form) : {}),
    });
  });

  activeForms.clear();
  flushOnExit();
}

// ---------- Init ----------

// Tracking must never break the form.
function safely(handler) {
  return (event) => {
    try {
      handler(event);
    } catch (err) {}
  };
}

export function initFormTracking() {
  if (window.__tgFormTrack) return;
  window.__tgFormTrack = true;

  // Bind on document and window: HubSpot renders late and replaces the form on re-render.
  document.addEventListener('focusin', safely(onFormFocus));
  document.addEventListener('hs-form-event:on-interaction:focus', safely(onFieldFocus), true);
  window.addEventListener('hs-form-event:on-submission:success', safely(onFormSubmitted));
  window.addEventListener('pagehide', safely(onPageHide));
}
