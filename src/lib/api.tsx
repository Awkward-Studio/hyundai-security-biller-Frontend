/* API client that preserves the old document shape: documents, $id, $createdAt. */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export interface CarRecord {
  $id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  location?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerEmail?: string | null;
  purposesOfVisit: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export interface TempCarRecord {
  $id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  location?: string | null;
  carStatus: CarStatus;
  carsTableId: string;
  purposesOfVisit: string[];
  redundant?: boolean;
  gatePassPDF?: string | null;
  inParking?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export enum CarStatus {
  ENTERED = "ENTERED",
  GATEPASS_GENERATED = "GATEPASS_GENERATED",
  EXITED = "EXITED",
}

export interface CarModelDoc {
  $id: string;
  make: string;
  models: string[];
}

type ListResponse<T> = { total: number; documents: T[] };
export type UserRole = "security" | "biller" | "admin";
export type ApiUser = {
  $id: string;
  name: string;
  email: string;
  labels: UserRole[];
  status: boolean;
};

const tokenStore = {
  getAccess() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("accessToken");
  },
  set(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("accessToken", access);
    window.localStorage.setItem("refreshToken", refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
  },
};

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  authenticate = true
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const access = tokenStore.getAccess();
  if (authenticate && access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message =
        body?.detail ??
        Object.entries(body ?? {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("; ") ??
        message;
    } catch {}
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const account = {
  async get() {
    return getCurrentUser();
  },
  async deleteSessions() {
    return logoutUser();
  },
};

export const checkActiveSession = async () => !!tokenStore.getAccess();
export const deleteSessions = async () => logoutUser();

export const loginUser = async (email: string, password: string) => {
  try {
    const result = await apiFetch<{
      access: string;
      refresh: string;
      user: any;
    }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username: email, password }),
    }, false);
    tokenStore.set(result.access, result.refresh);
    return {
      userDetails: result.user,
      sessionDetails: { access: result.access, refresh: result.refresh },
    };
  } catch (error: any) {
    return { errorMsg: error?.message ?? "Login failed" };
  }
};

export const listAllUsers = async () => [];
export const listSessions = async () => null;

export const logoutUser = async () => {
  tokenStore.clear();
  return { success: true };
};

export const getCurrentUser = async () => {
  try {
    return await apiFetch<any>("/api/auth/me/");
  } catch {
    return null;
  }
};

export const createUser = async (
  email: string,
  password: string,
  role: UserRole,
  name?: string
) =>
  apiFetch<ApiUser>("/api/auth/users/", {
    method: "POST",
    body: JSON.stringify({ email, password, role, name }),
  });

export const createCar = async (payload: CarRecord) => {
  return apiFetch<CarRecord>("/api/cars/", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      carNumber: payload.carNumber.trim().toUpperCase(),
      purposesOfVisit: (payload.purposesOfVisit ?? []).map(String),
    }),
  });
};

export const createTempCar = async (payload: TempCarRecord) => {
  return apiFetch<TempCarRecord>("/api/temp-cars/", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      carNumber: payload.carNumber.trim().toUpperCase(),
      purposesOfVisit: (payload.purposesOfVisit ?? []).map(String),
    }),
  });
};

export const createCarWithTemp = async (
  car: Omit<CarRecord, "$id">,
  location?: string | null
) => {
  return apiFetch<{ car: CarRecord; tempCar: TempCarRecord }>(
    "/api/cars/with-temp/",
    {
      method: "POST",
      body: JSON.stringify({ ...car, location: location ?? null }),
    }
  );
};

export const getAllTempCars = async (statuses?: CarStatus[]) => {
  const query = statuses?.length ? `?statuses=${statuses.join(",")}` : "";
  return apiFetch<ListResponse<TempCarRecord>>(`/api/temp-cars/${query}`);
};

export const getAllCars = async () =>
  apiFetch<ListResponse<CarRecord>>("/api/cars/");

export const getCarByCarNumber = async (carNumber: string) =>
  apiFetch<ListResponse<CarRecord>>(
    `/api/cars/?carNumber=${encodeURIComponent(carNumber.toUpperCase())}`
  );

export const getCarById = async (id: string) =>
  apiFetch<CarRecord>(`/api/cars/${id}/`);

export const getTempCarById = async (id: string) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${id}/`);

export const updateTempCarById = async (id: string, carStatus: CarStatus) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ carStatus }),
  });

export const updateTempCarFieldsById = async (
  id: string,
  data: Partial<TempCarRecord>
) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const updateCarField = async <K extends keyof CarRecord>(
  id: string,
  fieldName: K,
  fieldValue: CarRecord[K]
) => {
  await apiFetch<CarRecord>(`/api/cars/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ [fieldName]: fieldValue }),
  });
  return true;
};

export const updateTempCarField = async <K extends keyof TempCarRecord>(
  id: string,
  fieldName: K,
  fieldValue: TempCarRecord[K]
) => {
  await apiFetch<TempCarRecord>(`/api/temp-cars/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ [fieldName]: fieldValue }),
  });
  return true;
};

export const deleteTempCarById = async (id: string) =>
  apiFetch<void>(`/api/temp-cars/${id}/`, { method: "DELETE" });

export const searchTempCar = async (
  searchTerm: string,
  statuses?: CarStatus[]
) => {
  const params = new URLSearchParams({ search: searchTerm.toUpperCase() });
  if (statuses?.length) params.set("statuses", statuses.join(","));
  return apiFetch<ListResponse<TempCarRecord>>(`/api/temp-cars/?${params}`);
};

export const uploadPDF = async (buffer: Buffer, fileName = "document.pdf") => {
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });
  return uploadInvoice(file);
};

export const uploadInvoice = async (file: File, tempCarId?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (tempCarId) formData.append("tempCarId", tempCarId);
  const result = await apiFetch<{ id: string; downloadUrl: string }>(
    "/api/gate-pass-files/",
    { method: "POST", body: formData }
  );
  return { $id: result.id, downloadUrl: result.downloadUrl };
};

export const getInvoiceUrl = async (
  idOrUploadResult: string | { downloadUrl?: string }
) => {
  const href =
    typeof idOrUploadResult === "string"
      ? idOrUploadResult
      : idOrUploadResult.downloadUrl;
  return href ? { href } : null;
};

export const addCarModel = async (carMakeId: string, carModel: string) =>
  apiFetch<CarModelDoc>(`/api/car-models/${carMakeId}/add-model/`, {
    method: "POST",
    body: JSON.stringify({ model: carModel }),
  });

export const fetchCarMakeAndModels = async () =>
  apiFetch<ListResponse<CarModelDoc>>("/api/car-models/");

export const getAllActiveTempCars = async (statuses?: CarStatus[]) => {
  const params = new URLSearchParams({ active: "true" });
  if (statuses?.length) params.set("statuses", statuses.join(","));
  return apiFetch<ListResponse<TempCarRecord>>(`/api/temp-cars/?${params}`);
};

export const getAllTempCarsToday = async () =>
  apiFetch<ListResponse<TempCarRecord>>("/api/temp-cars/?today=true");

export const getTempCarsBetween = async (from: Date, to: Date) => {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return apiFetch<ListResponse<TempCarRecord>>(`/api/temp-cars/?${params}`);
};

export const getFirstTempCarDate = async (): Promise<Date> => {
  const res = await apiFetch<ListResponse<TempCarRecord>>("/api/temp-cars/");
  const oldest = [...(res.documents ?? [])].sort((a, b) =>
    String(a.$createdAt).localeCompare(String(b.$createdAt))
  )[0];
  return oldest?.$createdAt ? new Date(oldest.$createdAt) : new Date();
};
