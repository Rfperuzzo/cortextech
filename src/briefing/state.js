export function readBriefing(formData) {
  const field = key => String(formData.get(key) ?? '').trim();
  const list = name => formData.getAll(name).map(String);
  const pages = list('pages');
  const features = list('features');
  const other = (selected, label, key) => selected.includes(label) ? field(key) : '';
  return {
    type: field('type'),
    company: field('company'),
    industry: field('industry'),
    goal: field('goal'),
    idea: field('idea'),
    pages,
    otherPages: other(pages, 'Outras', 'otherPages'),
    features,
    otherFeatures: other(features, 'Outras', 'otherFeatures'),
    style: field('style'),
    accent: field('accent'),
    references: field('references'),
    contact: field('contact'),
    email: field('email'),
    phone: field('phone'),
    deadline: field('deadline'),
    budget: field('budget'),
    consent: formData.has('consent')
  };
}

const groups = [
  ['Projeto', [['Tipo de projeto', 'type']]],
  ['Ideia', [['Empresa', 'company'], ['Ramo de atuação', 'industry'], ['Objetivo', 'goal'], ['Descrição', 'idea']]],
  ['Forma', [
    ['Páginas', 'pages'], ['Outras páginas', 'otherPages'], ['Funcionalidades', 'features'],
    ['Outras funcionalidades', 'otherFeatures'], ['Preferência visual', 'style'],
    ['Cor de destaque', 'accent'], ['Referências', 'references']
  ]],
  ['Contato', [
    ['Responsável', 'contact'], ['E-mail', 'email'], ['WhatsApp', 'phone'], ['Prazo', 'deadline'],
    ['Orçamento', 'budget'], ['Autorização de contato', 'consent']
  ]]
];

export function summarize(data) {
  return groups.map(([title, keys]) => ({
    title,
    rows: keys.map(([label, id]) => {
      const value = data[id];
      if (id === 'consent') return [label, value ? 'Sim' : 'Não'];
      if (Array.isArray(value)) return [label, value.join(', ') || 'Nenhuma seleção'];
      return [label, value || 'Não informado'];
    })
  }));
}

export function asText(data) {
  return ['Briefing de projeto · CortexTech', ...summarize(data).map(({ title, rows }) =>
    [title.toUpperCase(), ...rows.map(([label, value]) => label + ': ' + value)].join('\n')
  )].join('\n\n');
}

export function validPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return !phone || (/^\+?[0-9 ()-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15);
}
