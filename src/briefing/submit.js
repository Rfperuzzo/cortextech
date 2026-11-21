export async function deliverBriefing(endpoint, data, requestId, fetcher = fetch) {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, requestId }),
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) throw new Error('Falha HTTP ' + response.status);
  const receipt = await response.json();
  if (receipt?.accepted !== true) throw new Error('O serviço não confirmou o recebimento');
  return receipt;
}
