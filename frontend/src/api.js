import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api' })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nexwealth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401) {
    localStorage.removeItem('nexwealth_token')
    localStorage.removeItem('nexwealth_user')
    window.dispatchEvent(new Event('nexwealth:logout'))
  }
  return Promise.reject(e)
})
export const messageOf = e => e.response?.data?.detail || e.message || 'Something went wrong'
export default api
