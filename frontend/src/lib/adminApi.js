const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

async function request(path, options = {}) {
  if (!apiUrl) {
    throw new Error("VITE_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

  getAuthStatus() {
    return request("/api/auth/me");
  },

  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  loginWithGoogle(credential) {
    return request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  logout() {
    return request("/api/auth/logout", { method: "POST" });
  },

  requestPasswordReset(email) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};

export default adminApi;
