import axios, { AxiosRequestConfig } from 'axios';
import { encodeValue, decodeValue } from './crypto';

// Helper for making encoded API calls with axios
export const makeApiCall = async (url: string, options: AxiosRequestConfig = {}) => {
  let { data, ...restOptions } = options;
  // Send encoded data
  if (data) {
    data = {value: encodeValue(data)};
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
  
  // Return response directly
  return decodeValue(response.data.value);
};