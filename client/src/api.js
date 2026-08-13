const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error('서버에 연결하지 못했어요. 서버가 실행 중인지 확인해주세요.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
  }

  return payload;
}

export function createAdvice({ category, content }) {
  return request('/advices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, content }),
  }).then((payload) => payload.advice);
}

export function fetchRandomAdvice({ category, excludeId }) {
  const params = new URLSearchParams({ category });
  if (excludeId != null) params.set('exclude', String(excludeId));

  return request(`/advices/random?${params}`).then((payload) => payload.advice);
}

export function fetchCounts() {
  return request('/advices/count').then((payload) => payload.counts);
}
