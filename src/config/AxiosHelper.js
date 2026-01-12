import axios from 'axios';
export const baseUrl = `https://chat-app-backend-2-pfg1.onrender.com`
export const httpClient = axios.create({
    baseURL : baseUrl
});