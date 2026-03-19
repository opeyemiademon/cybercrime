import jwt from 'jsonwebtoken';
import { include } from '../settings.js';
import { GraphQLError } from 'graphql';
import User from '../modules/user/user.model.js';
class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
    }
}
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    return token || null;
};
export const verifyJWTToken = (token) => {
    try {
        const decoded = jwt.verify(token, include.TOKEN_SECRET);
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return { status: 401, message: 'Token has expired' };
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            return { status: 401, message: 'Invalid token' };
        }
        else {
            return { status: 401, message: 'Token verification failed' };
        }
    }
};
export const getUserFromToken = async (payload) => {
    try {
        const user = await User.findById(payload.id).select('-password');
        if (!user || user.isDeleted) {
            throw new AuthenticationError('User not found or has been deleted');
        }
        if (!user.isActive) {
            throw new AuthenticationError('User account is deactivated');
        }
        return {
            id: user._id.toString(),
            email: user.email || '',
            fullname: user.fullname || '',
            role: user.role || 'Investigator'
        };
    }
    catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('User not found or has been deleted');
    }
};
export const getAuthContext = async (authHeader) => {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
        return {
            isAuthenticated: false
        };
    }
    try {
        const payload = verifyJWTToken(token);
        if (payload.status === 401) {
            throw new AuthenticationError(payload.message || 'Authentication failed');
        }
        const user = await getUserFromToken(payload);
        if (!user) {
            throw new AuthenticationError('User not found or has been deleted');
        }
        return {
            user,
            isAuthenticated: true
        };
    }
    catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('Authentication failed');
    }
};
export const requireAuth = (context) => {
    if (!context.isAuthenticated || !context.user) {
        throw new AuthenticationError('You must be logged in to perform this action');
    }
    return context.user;
};
//# sourceMappingURL=auth.js.map