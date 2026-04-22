// L'API HTTP a été remplacée par un store local. Ce module est conservé pour
// compatibilité ; il n'est plus utilisé. Supprimable en toute sécurité.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(_path: string, _init?: RequestInit): Promise<T> {
  throw new ApiError(501, 'apiFetch désactivé — utilisez le store local (@/lib/local-store).');
}
