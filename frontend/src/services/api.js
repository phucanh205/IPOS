import axios from "axios";

const API_BASE_URL = "/api";
const STORAGE_KEY = "pos_auth";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const auth = JSON.parse(raw);
                const token = auth?.token;
                if (token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            // ignore storage parse errors
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const loginUser = async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
};

export const getProducts = async (categoryId = null, search = "") => {
    const params = {};
    if (categoryId && categoryId !== "all") {
        params.category = categoryId;
    }
    if (search) {
        params.search = search;
    }
    const response = await api.get("/products", { params });
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get("/categories");
    return response.data;
};

export const getCategory = async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axios.post("/api/upload/image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post("/products", productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

// Held Orders API
export const getHeldOrders = async (search = "") => {
    const params = search ? { search } : {};
    const response = await api.get("/held-orders", { params });
    return response.data;
};

export const getHeldOrder = async (id) => {
    const response = await api.get(`/held-orders/${id}`);
    return response.data;
};

export const createHeldOrder = async (orderData) => {
    const response = await api.post("/held-orders", orderData);
    return response.data;
};

export const deleteHeldOrder = async (id) => {
    const response = await api.delete(`/held-orders/${id}`);
    return response.data;
};

// Orders API
export const getOrders = async (search = "", status = "", startDate = "", endDate = "") => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get("/orders", { params });
    return response.data;
};

export const getOrder = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data;
};

// Dashboard API
export const getDashboardStats = async (date = null) => {
    const params = date ? { date } : {};
    const response = await api.get("/dashboard/stats", { params });
    return response.data;
};

export default api;
