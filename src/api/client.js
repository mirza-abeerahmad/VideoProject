import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV
    ? 'http://localhost:3000/api/v1'
    : 'https://streamlybackend-nu.vercel.app/api/v1'),
  withCredentials: true,
})

export async function api(path, options = {}) {
  const { body, ...requestOptions } = options

  try {
    const response = await apiClient({
      url: path,
      data: body,
      ...requestOptions,
    })

    const result = response.data
    return result?.data ?? result
  } catch (error) {
    const result = error.response?.data || {}
    const message = result?.message || result?.error || error.message || 'Request failed'
    console.error(`API error for ${path}`, { status: error.response?.status, result })
    throw new Error(message)
  }
}
