"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

/**
 * Helper to get the auth token from cookies.
 * This cookie is set by the server during login and must not be httpOnly
 * for the client to read it.
 */
const getAuthToken = () => Cookies.get('auth_token');

/**
 * Standard SWR/Axios fetcher for GET requests.
 * Automatically injects the Authorization header if a token is present.
 */
export const getter = async (url: string) => {
  try {
    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return result.data;
  } catch (error: unknown) {
    const message = (axios.isAxiosError(error) && error.response?.data?.error) || "Something went wrong: Please try again";
    toast.error(message);
    throw error;
  }
};

/**
 * Axios wrapper for POST requests.
 */
export const poster = async (url: string, data: unknown) => {
  try {
    const result = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return result.data;
  } catch (error: unknown) {
    const message = (axios.isAxiosError(error) && error.response?.data?.error) || "Something went wrong: Please try again";
    toast.error(message);
    throw error;
  }
};

/**
 * Axios wrapper for PUT/PATCH requests.
 */
export const putter = async (url: string, data: unknown) => {
  try {
    const result = await axios.put(url, data, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return result.data;
  } catch (error: unknown) {
    const message = (axios.isAxiosError(error) && error.response?.data?.error) || "Something went wrong: Please try again";
    toast.error(message);
    throw error;
  }
};

/**
 * Axios wrapper for PATCH requests.
 */
export const patcher = async (url: string, data: unknown) => {
  try {
    const result = await axios.patch(url, data, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return result.data;
  } catch (error: unknown) {
    const message = (axios.isAxiosError(error) && error.response?.data?.error) || "Something went wrong: Please try again";
    toast.error(message);
    throw error;
  }
};

/**
 * Axios wrapper for DELETE requests.
 */
export const deleter = async (url: string, data?: unknown) => {
  try {
    const result = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      data, // axios supports body in DELETE via the `data` config key
    });
    return result.data;
  } catch (error: unknown) {
    const message = (axios.isAxiosError(error) && error.response?.data?.error) || "Something went wrong: Please try again";
    toast.error(message);
    throw error;
  }
};

/**
 * Standard SWR configuration to prevent unnecessary re-fetching.
 */
export const preventRerendering = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
};
