import mockData from "../data/mock-data.json";

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== "false";

const clone = (value) => JSON.parse(JSON.stringify(value));

async function request(path, options = {}) {
  if (!apiUrl) {
    if (!useMockData) {
      throw new Error("VITE_API_URL is not configured.");
    }
    return clone(mockData);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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
};

export default adminApi;
