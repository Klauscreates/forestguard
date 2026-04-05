// App configuration — reads from environment variables
export const config = {
  apiBase: import.meta.env.VITE_API_BASE || '/api',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  appEnv: import.meta.env.MODE || 'development',
}
