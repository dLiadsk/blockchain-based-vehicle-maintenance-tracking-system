import axios from 'axios';

// Базова URL-адреса твого Spring Boot бекенду
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// Перехоплювач запитів: автоматично додає JWT токен, якщо він є
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;