
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use(
    (config) => {
        const email = sessionStorage.getItem('email');
        const password = sessionStorage.getItem('password');

        if (email && password) {
            config.headers.Authorization =
                'Basic ' + btoa(email + ':' + password);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
