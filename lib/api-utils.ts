import axios, { AxiosRequestConfig } from 'axios';
import { encodeValue, decodeValue } from './crypto';

// Helper for making encoded API calls with axios
export const makeApiCall = async (
  url: string,
  options: AxiosRequestConfig = {}
) => {
  let { data, ...restOptions } = options;

  if (data) {
    data = { value: encodeValue(data) };
  }

  const requestConfig: any = {
    ...restOptions,
    url,
    data,
    headers: {
      'Content-Type': 'application/json',
      ...restOptions.headers,
    },
  };

  const response = await axios(requestConfig);

  // SAFE HANDLING
  if (response.data?.value) {
    return decodeValue(response.data.value);
  }

  // If not encrypted, return directly
  return response.data;
};