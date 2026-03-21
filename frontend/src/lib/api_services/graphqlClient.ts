import axios from 'axios';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.chaintrivex.com/graphql'
console.log(BACKEND_API_URL)
const graphqlClient = axios.create({
  baseURL: BACKEND_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

graphqlClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage?.getItem('dems_auth_token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

graphqlClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default graphqlClient;
