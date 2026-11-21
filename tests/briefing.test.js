import assert from 'node:assert/strict';
import { test } from 'node:test';
import { asText, readBriefing, summarize, validPhone } from '../src/briefing/state.js';
import { deliverBriefing } from '../src/briefing/submit.js';

test('normaliza texto e mantém escolhas múltiplas e consentimento', () => {
  const source = new FormData();
  source.append('company', '  Estúdio Mosaico  ');
  source.append('pages', 'Início');
  source.append('pages', 'Outras');
  source.append('otherPages', ' Agenda ');
  source.append('otherFeatures', 'Ignorar quando Outras estiver desmarcada');
  source.append('consent', 'on');
  const result = readBriefing(source);
  assert.equal(result.company, 'Estúdio Mosaico');
  assert.deepEqual(result.pages, ['Início', 'Outras']);
  assert.equal(result.otherPages, 'Agenda');
  assert.equal(result.otherFeatures, '');
  assert.equal(result.consent, true);
  assert.match(asText(result), /Autorização de contato: Sim/);
  assert.equal(summarize(result).length, 4);
});

test('aceita WhatsApp opcional e números válidos com DDD ou país', () => {
  for (const phone of ['', '(11) 98765-4321', '+55 11 98765-4321', '1134567890']) {
    assert.equal(validPhone(phone), true, phone);
  }
  for (const phone of ['abc12345678901', '98765-4321', '0123456789012345', '++55 11 98888-8888']) {
    assert.equal(validPhone(phone), false, phone);
  }
});

test('envia JSON e só confirma um recibo explícito', async () => {
  const receipt = await deliverBriefing('/api/briefings', { email: 'teste@example.com', consent: true }, 'id-24',
    async (url, request) => {
      assert.equal(url, '/api/briefings');
      assert.equal(request.method, 'POST');
      assert.equal(request.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(request.body), { email: 'teste@example.com', consent: true, requestId: 'id-24' });
      return Response.json({ accepted: true, id: 'receipt-13' }, { status: 201 });
    });
  assert.equal(receipt.id, 'receipt-13');
});

test('rejeita falhas HTTP, HTML e resposta sem confirmação', async () => {
  const responses = [
    new Response('', { status: 503 }),
    new Response('<!doctype html>', { status: 200 }),
    Response.json({ accepted: false }, { status: 200 }),
    Response.json({ id: 'sem-confirmacao' }, { status: 200 })
  ];
  for (const response of responses) await assert.rejects(deliverBriefing('/api', {}, 'id', async () => response));
});
