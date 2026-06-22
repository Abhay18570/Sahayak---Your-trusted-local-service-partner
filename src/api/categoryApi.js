import { apiClient } from "./apiClient";

export const getCategories = () => apiClient("/api/categories");
