import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from './user.model.js';
import { include } from '../../settings.js';
import { GraphQLError } from 'graphql';
import { requireAuth } from '../../middleware/auth.js';

const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      const user = requireAuth(context);
      const userData = await User.findById(user.id).select('-password');
      if (!userData || userData.isDeleted) {
        throw new GraphQLError('User not found');
      }
      return userData;
    },

    getUser: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      return await User.findById(id).select('-password');
    },

    getUserByEmail: async (_: any, { email }: { email: string }, context: any) => {
      requireAuth(context);
      return await User.findOne({ email }).select('-password');
    },

    getAllUsers: async (_: any, { role, search }: any, context: any) => {
      requireAuth(context);
      const query: any = { isDeleted: false };
      
      if (role) {
        query.role = role;
      }
      
      if (search) {
        query.$or = [
          { fullname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      return await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    register: async (_: any, { data }: { data: any }, context: any) => {
      requireAuth(context);
      const { fullname, email, password, role, department, phone } = data;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash('12345678', 10);

      const user = await User.create({
        fullname,
        email,
        password: hashedPassword,
        role: role || 'Investigator',
        department,
        phone
      });

      return {
        success: true,
        message: 'User created successfully',
        data: user
      };
    },

    login: async (_: any, { data }: { data: { email: string; password: string } }) => {
      const { email, password } = data;

      const user = await User.findOne({ email, isDeleted: false });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Your account has been deactivated');
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id },
        include.TOKEN_SECRET,
        { expiresIn: '7d' }
      );
 
      return {
        token,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role
        }
      };
    },


    updateUser: async (_: any, { id, data }: { id: string; data: any }, context: any) => {
      requireAuth(context);

      const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'User updated successfully',
        data: user
      };
    },

    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);

      const user = await User.findByIdAndUpdate(id, { isDeleted: true });
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'User deleted successfully',
        data: null
      };
    },

    changeUserPassword: async (
      _: any,
      { id, currentPassword, newPassword }: { id: string; currentPassword: string; newPassword: string },
      context: any
    ) => {
      requireAuth(context);

      if (!newPassword || newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return {
        success: true,
        message: 'Password updated successfully',
        data: null
      };
    }
  }
};

export default userResolvers;
