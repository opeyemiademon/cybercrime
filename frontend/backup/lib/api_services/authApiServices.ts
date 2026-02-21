import graphqlClient from './graphqlClient';

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    role: string;
    department?: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const mutation = `
    mutation Login($data: LoginInput!) {
      login(data: $data) {
        token
        user {
          id
        }
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.login;
};

export const getMe = async () => {
  const query = `
    query Me {
      me {
        id
        fullname
        email
        role
        department
        phone
        isActive
        lastLogin
        createdAt
        updatedAt
      }
    }
  `;

  const response = await graphqlClient.post('', { query });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.me;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const mutation = `
    mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
      changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
        success
        message
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { oldPassword, newPassword },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.changePassword;
};
