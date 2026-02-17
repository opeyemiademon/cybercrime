import Case from './case.model.js';
import Evidence from '../evidence/evidence.model.js';
import { requireAuth } from '../../middleware/auth.js';
import { GraphQLError } from 'graphql';

const generateCaseId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Case.countDocuments({ isDeleted: false });
  return `CASE-${year}-${String(count + 1).padStart(5, '0')}`;
};

const caseResolvers = {
  Query: {
    getCase: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      try {
        const caseData = await Case.findById(id);
        if (!caseData || caseData.isDeleted) {
          return {
            success: false,
            message: 'Case not found',
            case: null
          };
        }
        return {
          success: true,
          message: 'Case retrieved successfully',
          case: caseData
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          case: null
        };
      }
    },

    getAllCases: async (_: any, { status, search }: any, context: any) => {
      requireAuth(context);
      try {
        const query: any = { isDeleted: false };
        
        if (status && status !== 'All') {
          query.status = status;
        }
        
        if (search) {
          query.$or = [
            { caseId: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { assignedTo: { $regex: search, $options: 'i' } }
          ];
        }

        const cases = await Case.find(query)
          .sort({ createdAt: -1 });

        const total = cases.length;

        return {
          success: true,
          message: 'Cases retrieved successfully',
          cases,
          total
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          cases: [],
          total: 0
        };
      }
    },

    getDashboardStats: async (_: any, __: any, context: any) => {
      requireAuth(context);
      try {
        const totalCases = await Case.countDocuments({ isDeleted: false });
        const activeCases = await Case.countDocuments({ status: 'Active', isDeleted: false });
        const closedCases = await Case.countDocuments({ status: 'Closed', isDeleted: false });
        const totalEvidence = await Evidence.countDocuments({ isDeleted: false });
        const verifications = await Evidence.countDocuments({ 
          verificationStatus: 'Verified', 
          isDeleted: false 
        });

        return {
          totalCases,
          activeCases,
          closedCases,
          totalEvidence,
          verifications
        };
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Failed to fetch dashboard stats');
      }
    }
  },

  Mutation: {
    createCase: async (_: any, { input }: any, context: any) => {
      const user = requireAuth(context);
      try {
        const caseId = input.caseId || await generateCaseId();
        
        const existingCase = await Case.findOne({ caseId, isDeleted: false });
        if (existingCase) {
          return {
            success: false,
            message: 'Case ID already exists',
            case: null
          };
        }

        const caseData = new Case({
          ...input,
          caseId,
          investigatorId: user.id,
          investigatorName: user.fullname
        });

        await caseData.save();

        return {
          success: true,
          message: 'Case created successfully',
          case: caseData
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          case: null
        };
      }
    },

    updateCase: async (_: any, { id, input }: any, context: any) => {
      requireAuth(context);
      try {
        const caseData = await Case.findById(id);
        if (!caseData || caseData.isDeleted) {
          return {
            success: false,
            message: 'Case not found',
            case: null
          };
        }

        Object.assign(caseData, input);
        await caseData.save();

        return {
          success: true,
          message: 'Case updated successfully',
          case: caseData
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          case: null
        };
      }
    },

    deleteCase: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      try {
        const caseData = await Case.findById(id);
        if (!caseData || caseData.isDeleted) {
          return {
            success: false,
            message: 'Case not found',
            case: null
          };
        }

        caseData.isDeleted = true;
        await caseData.save();

        return {
          success: true,
          message: 'Case deleted successfully',
          case: null
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          case: null
        };
      }
    }
  }
};

export default caseResolvers;
