type ListResult<T = any> = { total: number; documents: T[] };

export class BaseRepository<T = any> {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  }

  async createDocument(data: T): Promise<T> {
    return this.request<T>("", { method: "POST", body: JSON.stringify(data) });
  }

  async getDocumentById(documentId: string): Promise<T> {
    return this.request<T>(`/${documentId}/`);
  }

  async updateDocumentById(documentId: string, data: Partial<T>): Promise<T> {
    return this.request<T>(`/${documentId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async listDocuments(): Promise<ListResult<T>> {
    return this.request<ListResult<T>>("");
  }

  async deleteDocumentById(documentId: string): Promise<void> {
    return this.request<void>(`/${documentId}/`, { method: "DELETE" });
  }

  private async request<R>(suffix: string, init: RequestInit = {}): Promise<R> {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    const token =
      typeof window === "undefined" ? null : window.localStorage.getItem("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${apiUrl}${this.basePath}${suffix}`, {
      ...init,
      headers,
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    if (response.status === 204) return undefined as R;
    return response.json() as Promise<R>;
  }
}
