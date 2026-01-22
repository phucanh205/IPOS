import api from "./api";

export const getAdminReceivingSummary = async (date) => {
    const res = await api.get("/admin/receiving/summary", { params: { date } });
    return res.data;
};

export const getAdminLowStock = async () => {
    const res = await api.get("/admin/receiving/low-stock");
    return res.data;
};

export const markLowStockReported = async (ingredientId) => {
    const res = await api.post(`/admin/receiving/low-stock/${ingredientId}/report`);
    return res.data;
};

export const markLowStockChecked = async (ingredientId) => {
    const res = await api.post(`/admin/receiving/low-stock/${ingredientId}/checked`);
    return res.data;
};

export const markLowStockResolved = async (ingredientId) => {
    const res = await api.post(`/admin/receiving/low-stock/${ingredientId}/resolved`);
    return res.data;
};
