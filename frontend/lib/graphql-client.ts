import { GraphQLClient } from 'graphql-request';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const graphqlClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    graphqlClient.setHeader('Authorization', `Bearer ${token}`);
  } else {
    graphqlClient.setHeader('Authorization', '');
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export const saveAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    setAuthToken(null);
  }
};

// Initialize auth token on client side
if (typeof window !== 'undefined') {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
  }
}
