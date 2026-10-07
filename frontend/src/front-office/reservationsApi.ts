import {
  getAccessToken,
  getRefreshToken,
  signOut,
  updateSessionTokens,
} from "../lib/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export type Reservation = {
  id: number;
  reservation_code: string;
  room_number: string | null;
  room_category: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  status: string;
  guest: {
    first_name: string;
    last_name: string;
    email: string | null;
    mobile: string | null;
  };
};

export type ReservationInput = {
  guest: {
    first_name: string;
    last_name: string;
    email?: string;
    mobile?: string;
  };
  room_number?: string;
  room_category?: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  source: string;
};

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token || !data.refresh_token) return false;

  updateSessionTokens(data.access_token, data.refresh_token);
  return true;
}

function returnToLogin() {
  signOut();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export async function frontOfficeRequest<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    returnToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !retried && await refreshAccessToken()) {
    return frontOfficeRequest<T>(path, options, true);
  }
  if (response.status === 401) {
    returnToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }
  if (!response.ok) {
    const validationDetail = Array.isArray(data.detail)
      ? data.detail.map((item: { msg?: string; loc?: (string | number)[] }) => item.msg || item.loc?.join(".")).filter(Boolean).join("; ")
      : "";
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : validationDetail
        ? validationDetail
        : "Unable to complete the reservation request."
    );
  }
  return data as T;
}

export function getReservations(search = "", status = "", arrivalDate = "") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  if (arrivalDate) params.set("arrival_date", arrivalDate);
  const query = params.toString();
  return frontOfficeRequest<{ items: Reservation[]; total: number }>(
    `/reservations${query ? `?${query}` : ""}`
  );
}

export function createReservation(data: ReservationInput) {
  return frontOfficeRequest<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function cancelReservation(id: number) {
  return frontOfficeRequest<Reservation>("/reservations/" + id + "/cancel", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
export function markReservationNoShow(id: number) {
  return frontOfficeRequest<Reservation>(`/reservations/${id}/no-show`, { method: "POST", body: JSON.stringify({}) });
}
export function assignReservationRoom(
  id: number,
  roomNumber: string,
  roomCategory: string
) {
  return frontOfficeRequest<Reservation>("/reservations/" + id, {
    method: "PATCH",
    body: JSON.stringify({
      room_number: roomNumber,
      room_category: roomCategory || null,
    }),
  });
}

export function updateReservation(id: number, changes: Partial<ReservationInput>) {
  return frontOfficeRequest<Reservation>(`/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}


