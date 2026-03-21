import graphqlClient from './graphqlClient';

export interface UserData {
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
}

export interface RegisterUserData {
  fullname: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  phone?: string;
}

export interface UpdateUserData {
  fullname?: string;
  email?: string;
  password?: string;
  role?: string;
  department?: string;
  phone?: string;
  isActive?: boolean;
}

export const getAllUsers = async (params?: {
  role?: string;
  search?: string;
}): Promise<UserData[]> => {
  const query = `
    query GetAllUsers($role: String, $search: String) {
      getAllUsers(role: $role, search: $search) {
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

  const response = await graphqlClient.post('', {
    query,
    variables: params,
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getAllUsers;
};

export const getUser = async (id: string): Promise<UserData> => {
  const query = `
    query GetUser($id: ID!) {
      getUser(id: $id) {
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

  const response = await graphqlClient.post('', {
    query,
    variables: { id },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getUser;
};

export const registerUser = async (data: RegisterUserData) => {
  const mutation = `
    mutation Register($data: RegisterInput!) {
      register(data: $data) {
        success
        message
        data {
          id
          fullname
          email
          role
          department
          phone
          isActive
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

  return response.data.data.register;
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const mutation = `
    mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
      updateUser(id: $id, data: $data) {
        success
        message
        data {
          id
          fullname
          email
          role
          department
          phone
          isActive
        }
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { id, data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateUser;
};

export const deleteUser = async (id: string) => {
  const mutation = `
    mutation DeleteUser($id: ID!) {
      deleteUser(id: $id) {
        success
        message
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { id },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.deleteUser;
};
