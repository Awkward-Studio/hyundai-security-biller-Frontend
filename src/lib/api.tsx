/* API client that preserves the old document shape: documents, $id, $createdAt. */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export interface CarRecord {
  $id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  serviceType?: string;
  location?: string | null;
  locationId?: string | null;
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
  id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  serviceType?: string;
  location?: string | null;
  locationId?: string | null;
  carStatus: CarStatus;
  carsTableId: string;
  purposesOfVisit: string[];
  redundant?: boolean;
  gatePassPDF?: string | null;
  inParking?: boolean;
  deliveryBy?: string;
  driverId?: string | null;
  driverName?: string;
  clearanceTime?: string | null;
  clearanceBy?: string | null;
  clearanceRemarks?: string;
  exitTime?: string | null;
  exitBy?: string | null;
  exitType?: string;
  entryTime?: string;
  entryBy?: string | null;
  remarks?: string;
  transferredFromLocation?: string | null;
  transferredToLocation?: string | null;
  $createdAt?: string;
  $updatedAt?: string;
}

export enum CarStatus {
  ENTERED = "ENTERED",
  CLEARED = "CLEARED",
  GATEPASS_GENERATED = "GATEPASS_GENERATED",
  EXITED = "EXITED",
  COMPLETED = "COMPLETED",
}

export interface CarModelDoc {
  $id: string;
  make: string;
  models: string[];
}

export interface LocationRecord {
  $id?: string;
  id: string;
  name: string;
  code?: string;
  active: boolean;
  isActive?: boolean;
  isBodyshop?: boolean;
  is_bodyshop?: boolean;
}

export interface DriverRecord {
  $id?: string;
  id: string;
  name: string;
  phone?: string;
  locationId?: string | null;
  location_id?: string | null;
  locationName?: string;
  active: boolean;
  isActive?: boolean;
}

export interface ServiceTypeRecord {
  $id?: string;
  id: string;
  name: string;
  bodyshopOnly?: boolean;
  bodyshop_only?: boolean;
  active: boolean;
  isActive?: boolean;
}


export interface RoleRecord {
  $id?: string;
  id: string;
  name: string;
  role_key: string;
  description?: string;
  permissions: string[];
  is_system?: boolean;
  scope_mode?: string;
}

export interface PermissionCatalogItem {
  cat: string;
  key: string;
  label: string;
}

export interface DashboardStats {
  gateInToday: number;
  gateOutToday: number;
  currentlyIn: number;
  inWorkshop: number;
  clearedCashier: number;
  serviceBreakdown: Record<string, number>;
  locationStats: Array<{
    id: string;
    name: string;
    inToday: number;
    outToday: number;
    active: number;
  }>;
}

type ListResponse<T> = { total: number; documents: T[] };
export type UserRole = "security" | "biller" | "admin" | "cashier" | "manager" | "reception" | string;
export type ApiUser = {
  $id: string;
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  labels: UserRole[];
  status: boolean;
  permissions?: string[];
  locationId?: string | null;
  locationName?: string;
  allLocationAccess?: boolean;
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

export const listAllUsers = async () =>
  apiFetch<ListResponse<ApiUser>>("/api/auth/users/");
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
  role: string,
  name?: string,
  location_id?: string | null,
  all_location_access?: boolean
) =>
  apiFetch<ApiUser>("/api/auth/users/", {
    method: "POST",
    body: JSON.stringify({ email, password, role, name, location_id, all_location_access }),
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
  location?: string | null,
  locationId?: string | null
) => {
  return apiFetch<{ car: CarRecord; tempCar: TempCarRecord }>(
    "/api/cars/with-temp/",
    {
      method: "POST",
      body: JSON.stringify({ ...car, location: location ?? null, locationId: locationId ?? null }),
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

export const addCarMake = async (make: string) =>
  apiFetch<CarModelDoc>("/api/car-models/", {
    method: "POST",
    body: JSON.stringify({ make }),
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

/* --- Masters & Upgraded API Methods --- */

// Locations API
export const getLocations = async () =>
  apiFetch<ListResponse<LocationRecord>>("/api/locations/");
export const createLocation = async (data: { name: string; code?: string; is_bodyshop?: boolean }) =>
  apiFetch<LocationRecord>("/api/locations/", { method: "POST", body: JSON.stringify(data) });
export const updateLocation = async (id: string, data: Partial<LocationRecord>) =>
  apiFetch<LocationRecord>(`/api/locations/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteLocation = async (id: string) =>
  apiFetch<void>(`/api/locations/${id}/`, { method: "DELETE" });

// Drivers API
export const getDrivers = async () =>
  apiFetch<ListResponse<DriverRecord>>("/api/drivers/");
export const createDriver = async (data: { name: string; phone?: string; location_id?: string | null }) =>
  apiFetch<DriverRecord>("/api/drivers/", { method: "POST", body: JSON.stringify(data) });
export const updateDriver = async (id: string, data: Partial<DriverRecord>) =>
  apiFetch<DriverRecord>(`/api/drivers/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteDriver = async (id: string) =>
  apiFetch<void>(`/api/drivers/${id}/`, { method: "DELETE" });

// Service Types API
export const getServiceTypes = async () =>
  apiFetch<ListResponse<ServiceTypeRecord>>("/api/service-types/");
export const createServiceType = async (data: { name: string; bodyshop_only?: boolean }) =>
  apiFetch<ServiceTypeRecord>("/api/service-types/", { method: "POST", body: JSON.stringify(data) });
export const updateServiceType = async (id: string, data: Partial<ServiceTypeRecord>) =>
  apiFetch<ServiceTypeRecord>(`/api/service-types/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteServiceType = async (id: string) =>
  apiFetch<void>(`/api/service-types/${id}/`, { method: "DELETE" });

// Roles API
export const getRoles = async () =>
  apiFetch<ListResponse<RoleRecord>>("/api/auth/roles/");
export const createRole = async (data: { name: string; role_key: string; description?: string; permissions: string[] }) =>
  apiFetch<RoleRecord>("/api/auth/roles/", { method: "POST", body: JSON.stringify(data) });
export const updateRole = async (id: string, data: Partial<RoleRecord>) =>
  apiFetch<RoleRecord>(`/api/auth/roles/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteRole = async (id: string) =>
  apiFetch<void>(`/api/auth/roles/${id}/`, { method: "DELETE" });
export const getPermissionsCatalog = async () =>
  apiFetch<PermissionCatalogItem[]>("/api/auth/permissions/");

// Cashier Clearance API
export const approveCashierClearance = async (
  tempCarId: string,
  data: { deliveryBy: string; driverId?: string | null; driverName?: string; clearanceRemarks?: string }
) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${tempCarId}/approve-clearance/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Gate Out Delivery API
export const performGateOut = async (
  tempCarId: string,
  data: { deliveryBy?: string; driverId?: string | null; driverName?: string; remarks?: string }
) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${tempCarId}/gate-out/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Vehicle Transfer API
export const transferVehicle = async (tempCarId: string, destinationLocationId: string) =>
  apiFetch<{ source: TempCarRecord; destination: TempCarRecord }>(
    `/api/temp-cars/${tempCarId}/transfer/`,
    {
      method: "POST",
      body: JSON.stringify({ destinationLocationId }),
    }
  );

// Modify Service Type API
export const modifyServiceType = async (tempCarId: string, serviceType: string) =>
  apiFetch<TempCarRecord>(`/api/temp-cars/${tempCarId}/modify-service-type/`, {
    method: "POST",
    body: JSON.stringify({ serviceType }),
  });

// Dashboard Stats API
export const getDashboardStats = async (locationId?: string) => {
  const query = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
  return apiFetch<DashboardStats>(`/api/temp-cars/dashboard-stats/${query}`);
};

// Reports API
export const getReportsData = async (params: {
  reportType?: string;
  locationId?: string;
  from?: string;
  to?: string;
  month?: string;
}) => {
  const q = new URLSearchParams();
  if (params.reportType) q.set("reportType", params.reportType);
  if (params.locationId) q.set("locationId", params.locationId);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.month) q.set("month", params.month);
  return apiFetch<ListResponse<TempCarRecord>>(`/api/temp-cars/reports/?${q}`);
};

// Log Retention API
export const getRetentionStats = async (days = 30) =>
  apiFetch<{ totalRecords: number; activeRecords: number; prunableRecords: number; retentionDays: number }>(
    `/api/temp-cars/retention/?days=${days}`
  );

export const runRetentionCleanup = async (days = 30) =>
  apiFetch<{ message: string; deletedCount: number; remainingTotal: number }>(
    `/api/temp-cars/retention/`,
    {
      method: "POST",
      body: JSON.stringify({ days }),
    }
  );

export interface AppSettingRecord {

  id?: number;
  brand_name: string;
  subtitle: string;
  brand_subtitle: string;
  welcome_title: string;
  welcome_desc: string;
  feature_list: string;
  signin_title: string;
  signin_subtitle: string;
  signin_btn: string;
  credit_text: string;
  footer_text: string;
  logo_data_url: string;
}

export const getAppSettings = async () =>
  apiFetch<AppSettingRecord>("/api/auth/settings/", {}, false);

export const updateAppSettings = async (data: Partial<AppSettingRecord>) =>
  apiFetch<AppSettingRecord>("/api/auth/settings/", {
    method: "PUT",
    body: JSON.stringify(data),
  });


