import useSWR from "swr";
import axios from "axios";
import { API_URL, USERNAME_LOCALSTORAGE } from "./constants";

const fetcher = async (url) => {
  const token = localStorage.getItem(USERNAME_LOCALSTORAGE);
  const response = await axios.get(API_URL + url, {
    headers: {
      Authorization: token ? `${token}` : "",
    },
  });
  return response.data;
};

const poster = async (url, data) => {
  const token = localStorage.getItem(USERNAME_LOCALSTORAGE);
  const response = await axios.post(API_URL + url, data, {
    headers: {
      Authorization: token ? `${token}` : "",
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

const getter = async (url, data) => {
  const token = localStorage.getItem(USERNAME_LOCALSTORAGE);
  
  const response = await axios.get(API_URL + url, {
    params: data,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });

  return response.data;
};


export function useGetApi() {
  return getter;
}

export function usePostApi() {
  return poster;
}
