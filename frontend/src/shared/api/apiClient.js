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
            const raw = sessionStorage.getItem(STORAGE_KEY);
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

export const getProductsAvailability = async (productIds = [], cartItems = []) => {
    const response = await api.post("/products/availability", {
        productIds,
        cartItems,
    });
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

export const createCategory = async (data) => {
    const response = await api.post("/categories", data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

export const getIngredients = async (search = "") => {
    const params = {};
    if (search) params.search = search;
    const response = await api.get("/ingredients", { params });
    return response.data;
};

export const getToppings = async () => {
    const response = await api.get("/toppings");
    return response.data;
};

export const createIngredient = async (data) => {
    const response = await api.post("/ingredients", data);
    return response.data;
};

export const updateIngredient = async (id, data) => {
    const response = await api.put(`/ingredients/${id}`, data);
    return response.data;
};

export const deleteIngredient = async (id) => {
    const response = await api.delete(`/ingredients/${id}`);
    return response.data;
};

export const getRecipeByProduct = async (productId) => {
    const response = await api.get(`/recipes/product/${productId}`);
    return response.data;
};

export const upsertRecipeByProduct = async (productId, items) => {
    const response = await api.put(`/recipes/product/${productId}`, { items });
    return response.data;
};

export const deleteRecipeByProduct = async (productId) => {
    const response = await api.delete(`/recipes/product/${productId}`);
    return response.data;
};

export const setRecipeActiveByProduct = async (productId, isActive) => {
    const response = await api.patch(`/recipes/product/${productId}/active`, { isActive });
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
