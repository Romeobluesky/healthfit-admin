// 브라우저에서는 Next.js API 프록시를 통해 호출 (CORS 우회)
// 서버에서는 직접 호출
const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api/proxy"
    : (process.env.NEXT_PUBLIC_API_URL || "https://healthfit.autocallup.com");

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text);
  } catch {
    return null as T;
  }
}

// ManagerMember API
export const managerMemberApi = {
  getAll: () => request<import("@/types").ManagerMember[]>("/managerMember"),
  getById: (idx: number) => request<import("@/types").ManagerMember>(`/managerMember/${idx}`),
  getByLoginId: (id: string) => request<import("@/types").ManagerMember>(`/managerMember/login/${id}`),
  login: (id: string, password: string) =>
    request<import("@/types").ManagerMember>(`/managerMember/login/${id}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  create: (data: Partial<import("@/types").ManagerMember>) =>
    request<import("@/types").SqlResult>("/managerMember", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (idx: number, data: Partial<import("@/types").ManagerMember>) =>
    request<import("@/types").SqlResult>(`/managerMember/${idx}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (idx: number, status: string) =>
    request<import("@/types").SqlResult>(`/managerMember/status/${idx}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (idx: number) =>
    request<import("@/types").SqlResult>(`/managerMember/${idx}`, { method: "DELETE" }),
};

// Member API
export const memberApi = {
  getAll: () => request<import("@/types").Member[]>("/member"),
  getById: (idx: number) => request<import("@/types").Member>(`/member/${idx}`),
  create: (data: Partial<import("@/types").Member>) =>
    request<import("@/types").SqlResult>("/member", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (idx: number, data: Partial<import("@/types").Member>) =>
    request<import("@/types").SqlResult>(`/member/${idx}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (idx: number) =>
    request<import("@/types").SqlResult>(`/member/${idx}`, { method: "DELETE" }),
};

// CheckUp API
export const checkUpApi = {
  getAll: () => request<import("@/types").CheckUp[]>("/checkUp"),
  getById: (idx: number) => request<import("@/types").CheckUp>(`/checkUp/${idx}`),
  getByMember: (memberIdx: number) =>
    request<import("@/types").CheckUp[]>(`/checkUp/member/${memberIdx}`),
  getAnalysis: (memberIdx: number) =>
    request<(import("@/types").CheckUp & { analysis?: import("@/types").Analysis })[]>(
      `/checkUp/analysis/${memberIdx}`
    ),
  create: (data: Partial<import("@/types").CheckUp>) =>
    request<import("@/types").SqlResult>("/checkUp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (idx: number, data: Partial<import("@/types").CheckUp>) =>
    request<import("@/types").SqlResult>(`/checkUp/${idx}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (idx: number) =>
    request<import("@/types").SqlResult>(`/checkUp/${idx}`, { method: "DELETE" }),
};

// Analysis API
export const analysisApi = {
  getAll: () => request<import("@/types").Analysis[]>("/analysis"),
  getById: (idx: number) => request<import("@/types").Analysis>(`/analysis/${idx}`),
  getByMember: (memberIdx: number) =>
    request<import("@/types").Analysis[]>(`/analysis/memberIdx/${memberIdx}`),
  getByCheckUp: (checkUpIdx: number) =>
    request<import("@/types").Analysis>(`/analysis/checkUpIdx/${checkUpIdx}`),
};

// Survey API
export const surveyApi = {
  getAll: () => request<import("@/types").Survey[]>("/survey"),
  getById: (idx: number) => request<import("@/types").Survey>(`/survey/${idx}`),
  getByMember: (memberIdx: number) =>
    request<import("@/types").Survey[]>(`/survey/member/${memberIdx}`),
};

// ServiceCode API
export const serviceCodeApi = {
  getAll: () => request<import("@/types").ServiceCode[]>("/serviceCode"),
  getById: (idx: number) => request<import("@/types").ServiceCode>(`/serviceCode/${idx}`),
  getByCode: (one: string, two: string, three: string) =>
    request<import("@/types").ServiceCode>(`/serviceCode/code/${one}/${two}/${three}`),
  use: (memberIdx: number, one: string, two: string, three: string) =>
    request<import("@/types").SqlResult>(
      `/serviceCode/code/${memberIdx}/${one}/${two}/${three}`,
      { method: "PUT" }
    ),
};

// Clause API
export const clauseApi = {
  getAll: () => request<import("@/types").Clause[]>("/clause"),
  getById: (idx: number) => request<import("@/types").Clause>(`/clause/${idx}`),
  create: (data: Partial<import("@/types").Clause>) =>
    request<import("@/types").SqlResult>("/clause", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (idx: number, data: Partial<import("@/types").Clause>) =>
    request<import("@/types").SqlResult>(`/clause/${idx}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (idx: number) =>
    request<import("@/types").SqlResult>(`/clause/${idx}`, { method: "DELETE" }),
};

// Server Status API
export const serverApi = {
  getStatus: () => request<{ status: string }>("/server/status"),
};
