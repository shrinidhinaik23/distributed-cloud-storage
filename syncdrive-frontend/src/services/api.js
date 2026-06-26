import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:9090",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Firebase ID token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Log responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "Server Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "Network Error: No response received from backend",
        error.request
      );
    } else {
      console.error("Axios Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;