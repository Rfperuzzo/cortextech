import { asText, readBriefing, summarize, validPhone } from './state.js';
import { deliverBriefing } from './submit.js';
import { createBriefingSpark } from '../motion/briefing-spark.js';

const states = {
  company: 'Informe o nome da empresa.',
  industry: 'Informe o ramo de atuação.',
  goal: 'Escolha o objetivo principal.',
  idea: 'Descreva sua ideia.',
  contact: 'Informe o nome do responsável.',
  email: 'Informe seu e-mail.',
  deadline: 'Selecione um prazo.',
  consent: 'Autorize o contato para concluir o briefing.'
};

function fieldError(input) {
  if (input.required && (input.type === 'checkbox' ? !input.checked : !input.value.trim())) {
    return states[input.name] ?? 'Escolha uma opção.';
  }
  if (input.type === 'email' && (input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()))) {
    return 'Use um e-mail no formato nome@exemplo.com.';
  }
  if (input.type === 'tel' && !validPhone(input.value.trim())) {
    return 'Informe o DDD e o número. Inclua o código do país se necessário.';
  }
  return '';
}

function showError(input, message) {
  const label = input.closest('label');
  if (!label || input.type === 'radio') return;
  const id = 'erro-' + input.name;
  let detail = document.getElementById(id);
  if (message && !detail) {
    detail = document.createElement('span');
    detail.id = id;
    detail.className = 'field-error';
    label.append(detail);
    input.setAttribute('aria-describedby', id);
  }
  if (message) {
    detail.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  } else {
    detail?.remove();
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}

export function setupBriefing() {
  const body = document.querySelector('.briefing__body');
  const form = body.querySelector('form');
  const steps = [...form.querySelectorAll('[data-step]')];
  const labels = [...body.querySelectorAll('.briefing__progress li')];
  const progress = body.querySelector('[data-step-progress]');
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const copy = form.querySelector('[data-copy]');
  const signal = createBriefingSpark(body, next);
  const status = form.querySelector('.form-status');
  const review = form.querySelector('[data-review]');
  const delivery = form.querySelector('[data-delivery]');
  const manualCopy = form.querySelector('[data-manual-copy]');
  const preview = body.querySelector('.preview__content');
  const previewName = preview.querySelector('[data-preview-name]');
  const previewLead = preview.querySelector('[data-preview-lead]');
  const previewType = preview.querySelector('[data-preview-type]');
  const previewPages = preview.querySelector('[data-preview-pages]');
  const endpoint = (import.meta.env.VITE_BRIEFING_ENDPOINT ?? '').trim();
  const requestIds = new Map();
  const last = steps.length - 1;
  const data = () => readBriefing(new FormData(form));
  let step = 0;
  let sending = false;
  let sentPayload;

  function announce(message = '', error = false, focus = false) {
    status.textContent = message;
    status.toggleAttribute('data-error', error);
    if (focus) status.focus();
  }

  function createReview() {
    const heading = document.createElement('h4');
    heading.textContent = 'Resumo do projeto';
    review.append(heading);
    return summarize(data()).map(({ title, rows }, index) => {
      const group = document.createElement('div');
      group.className = 'review__group';
      const top = document.createElement('div');
      const name = document.createElement('strong');
      const edit = document.createElement('button');
      name.textContent = title;
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.setAttribute('aria-label', 'Editar ' + title.toLowerCase());
      edit.addEventListener('click', () => showStep(index));
      top.append(name, edit);
      const list = document.createElement('dl');
      const values = rows.map(([key]) => {
        const term = document.createElement('dt');
        const value = document.createElement('dd');
        term.textContent = key;
        list.append(term, value);
        return value;
      });
      group.append(top, list);
      review.append(group);
      return values;
    });
  }

  const values = createReview();

  function update() {
    const current = data();
    const name = current.company || 'Sua marca';
    previewName.textContent = name;
    previewLead.textContent = name;
    previewType.textContent = current.type;
    preview.dataset.previewStyle = current.style;
    preview.style.setProperty('--preview-accent', current.accent);
    previewPages.replaceChildren(...current.pages.map(page => {
      const item = document.createElement('li');
      item.textContent = page === 'Outras' && current.otherPages ? current.otherPages : page;
      return item;
    }));
    form.querySelector('[data-other="pages"]').hidden = !current.pages.includes('Outras');
    form.querySelector('[data-other="features"]').hidden = !current.features.includes('Outras');
    const energy = [current.type, current.company, current.goal, current.idea, current.contact].filter(Boolean).length;
    body.style.setProperty('--pulse', Math.min(1, (energy + current.features.length + step) / 8));
    if (step === last) {
      summarize(current).forEach(({ rows }, index) => {
        rows.forEach(([, value], row) => { values[index][row].textContent = value; });
      });
    }
  }

  function showStep(index, focus = true) {
    const previous = step;
    step = index;
    steps.forEach((panel, position) => {
      panel.hidden = position !== index;
      panel.classList.toggle('enter', position === index && focus);
    });
    labels.forEach((label, position) => {
      if (position === index) label.setAttribute('aria-current', 'step');
      else label.removeAttribute('aria-current');
      label.classList.toggle('is-complete', position < index);
    });
    body.style.setProperty('--step-offset', String(12.5 + index * 25) + '%');
    progress.textContent = 'Etapa ' + (index + 1) + ' de ' + steps.length;
    back.hidden = index === 0;
    copy.hidden = index !== last || !endpoint;
    review.hidden = index !== last;
    next.textContent = index === last ? (endpoint ? 'Enviar briefing ↗' : 'Copiar resumo') : 'Continuar →';
    delivery.textContent = endpoint
      ? 'Usaremos seus dados de contato para responder sobre este projeto.'
      : 'Modo demonstração. Você pode copiar o resumo e compartilhar por um canal de sua escolha.';
    manualCopy.hidden = true;
    announce();
    update();
    signal(index, last);
    if (focus) {
      const heading = steps[index].querySelector('h3');
      heading.focus({ preventScroll: true });
      if (index !== previous) progress.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function validate(index) {
    const panel = steps[index];
    const type = panel.querySelector('[name="type"]:checked');
    if (index === 0 && !type) {
      showStep(0, step !== 0);
      announce('Escolha um tipo de projeto para continuar.', true);
      panel.querySelector('[name="type"]').focus();
      return false;
    }
    const errors = [...panel.querySelectorAll('input:not([type="radio"]), select, textarea')]
      .map(input => ({ input, message: fieldError(input) }));
    const first = errors.find(({ message }) => message);
    if (first && step !== index) showStep(index);
    errors.forEach(({ input, message }) => showError(input, message));
    if (!first) return true;
    announce('Revise os campos indicados para continuar.', true);
    first.input.focus();
    return false;
  }

  async function copySummary() {
    if (!steps.every((_, index) => validate(index))) return;
    const summary = asText(data());
    try {
      await navigator.clipboard.writeText(summary);
      manualCopy.hidden = true;
      announce('Resumo copiado.', false);
    } catch {
      const textarea = manualCopy.querySelector('textarea');
      textarea.value = summary;
      manualCopy.hidden = false;
      announce('Selecione e copie o resumo abaixo.');
      textarea.focus();
      textarea.select();
    }
  }

  form.addEventListener('input', event => {
    if (event.target.hasAttribute('aria-invalid')) showError(event.target, fieldError(event.target));
    if (event.target.matches('input, select, textarea') && !manualCopy.contains(event.target)) {
      announce();
      manualCopy.hidden = true;
      update();
    }
  });
  back.addEventListener('click', () => showStep(step - 1));
  copy.addEventListener('click', copySummary);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !validate(step)) return;
    if (step < last) {
      showStep(step + 1);
      return;
    }
    if (!endpoint) {
      await copySummary();
      return;
    }
    if (!steps.every((_, index) => validate(index))) return;
    const payload = data();
    const serialized = JSON.stringify(payload);
    if (sentPayload === serialized) {
      announce('Este briefing já foi enviado.', false, true);
      return;
    }
    if (!requestIds.has(serialized)) {
      requestIds.set(serialized, globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2));
    }
    sending = true;
    next.disabled = true;
    back.disabled = true;
    copy.disabled = true;
    review.querySelectorAll('button').forEach(button => { button.disabled = true; });
    next.textContent = 'Enviando…';
    announce('Enviando briefing.');
    try {
      await deliverBriefing(endpoint, payload, requestIds.get(serialized));
      sentPayload = serialized;
      announce('Briefing enviado. A CortexTech poderá entrar em contato pelos canais informados.', false, true);
    } catch {
      announce('O recebimento não foi confirmado. Tente novamente ou copie o resumo.', true, true);
    } finally {
      sending = false;
      next.disabled = false;
      back.disabled = false;
      copy.disabled = false;
      review.querySelectorAll('button').forEach(button => { button.disabled = false; });
      next.textContent = 'Enviar briefing ↗';
    }
  });

  document.querySelectorAll('[data-project-type]').forEach(link => {
    link.addEventListener('click', () => {
      if (sending) return;
      const option = [...form.querySelectorAll('[name="type"]')].find(input => input.value === link.dataset.projectType);
      if (option) option.checked = true;
      showStep(0, false);
    });
  });
  body.hidden = false;
  showStep(0, false);
}
