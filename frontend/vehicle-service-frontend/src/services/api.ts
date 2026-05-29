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
api.interceptors.response.use(
    (response) => response, // Якщо все добре - просто віддаємо відповідь далі
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Якщо токен прострочений або немає прав:
            console.warn('Сесія закінчилася або доступ заборонено. Виконуємо вихід.');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');

            // Якщо ми не на сторінках входу/реєстрації, перенаправляємо на логін
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;