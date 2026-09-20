const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Set default dev authorization if not present
  if (!headers.has('Authorization')) {
    headers.set('x-dev-user-id', '00000000-0000-0000-0000-000000000002');
    headers.set('x-dev-org-id', '00000000-0000-0000-0000-000000000001');
    headers.set('x-dev-email', 'cha@apexlogistics.com');
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}
