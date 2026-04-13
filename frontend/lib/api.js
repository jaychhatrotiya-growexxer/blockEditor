const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.message || "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function registerRequest(values) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function loginRequest(values) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function refreshRequest() {
  return request("/auth/refresh", {
    method: "POST",
  });
}

export async function logoutRequest() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export async function withAuthorizedRequest({
  path,
  options,
  accessToken,
  onAuthRefresh,
  onAuthFailure,
}) {
  try {
    return await request(path, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    });
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    try {
      const nextAccessToken = await onAuthRefresh();

      return await request(path, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${nextAccessToken}`,
        },
      });
    } catch (refreshError) {
      onAuthFailure();
      throw refreshError;
    }
  }
}
