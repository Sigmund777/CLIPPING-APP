import axios from "axios";
import { supabase } from "./supabase";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

// Attach Supabase access token to every request.
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) { /* unauthenticated calls still allowed */ }
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  if (detail?.message) return detail.message;
  return String(detail);
}

export default api;
