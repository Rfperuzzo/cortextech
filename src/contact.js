export function setupContact() {
  const section = document.querySelector('#contato');
  const email = section.querySelector('.contact__email');
  const copy = section.querySelector('.contact__copy');
  const status = section.querySelector('.contact__status');
  const form = section.querySelector('.contact__form');
  const draft = section.querySelector('[data-draft]');
  const service = form.elements.namedItem('service');
  const address = email.textContent.trim();

  copy.hidden = false;
  form.hidden = false;
  document.querySelectorAll('[data-contact-service]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      service.value = link.dataset.contactService;
      draft.hidden = true;
    });
  });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = 'E-mail copiado.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(email);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Selecione e copie o endereço pelo seu dispositivo.';
    }
  });

  form.addEventListener('input', event => {
    event.target.setCustomValidity('');
    draft.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const value = key => data.get(key).trim();
    for (const [key, message] of [['name', 'Informe seu nome.'], ['message', 'Descreva seu projeto.']]) {
      if (value(key)) continue;
      const field = form.elements.namedItem(key);
      field.setCustomValidity(message);
      field.reportValidity();
      return;
    }
    const title = 'Novo projeto | ' + value('service');
    const body = [
      'Olá, equipe CortexTech!',
      '',
      'Nome: ' + value('name'),
      'Empresa: ' + (value('company') || 'Não informada'),
      'E-mail para retorno: ' + value('email'),
      'Serviço: ' + value('service'),
      '',
      value('message')
    ].join('\r\n');
    draft.href = email.href + '?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
    draft.hidden = false;
    draft.click();
  });
}
