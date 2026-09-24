const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

async function request(path, options = {}) {
  if (!apiUrl) {
    throw new Error("VITE_API_URL is not configured.");
  }

  const token = sessionStorage.getItem("alpha_auth_token");
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const adminApi = {
  getAdminData() {
    return request("/api/admin/data");
  },

  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  requestPasswordReset(email) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};

export default adminApi;
