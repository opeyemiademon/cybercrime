import { gql } from 'graphql-tag';

const userTypeDefs = gql`
  type User {
    id: ID!
    fullname: String!
    email: String!
    role: String!
    department: String
    phone: String
    isActive: Boolean!
    lastLogin: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UserResponsePayload {
    success: Boolean!
    message: String!
    data: User
  }

  type UsersResponse {
    success: Boolean!
    message: String!
    users: [User!]!
    total: Int!
  }

  input RegisterInput {
    fullname: String!
    email: String!
    password: String!
    role: String
    department: String
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    fullname: String
    email: String
    role: String
    department: String
    phone: String
    isActive: Boolean
  }

  type Query {
    me: User
    getUser(id: ID!): User
    getUserByEmail(email: String!): User
    getAllUsers(role: String, search: String): [User!]!
  }

  type Mutation {
    register(data: RegisterInput!): UserResponsePayload!
    login(data: LoginInput!): AuthPayload!
    updateUser(id: ID!, data: UpdateUserInput!): UserResponsePayload!
    changeUserPassword(id: ID!, currentPassword: String!, newPassword: String!): UserResponsePayload!
    deleteUser(id: ID!): UserResponsePayload!
  }
`;

export default userTypeDefs;
