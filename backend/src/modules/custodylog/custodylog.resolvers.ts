import CustodyLog from './custodylog.model.js';
import { requireAuth } from '../../middleware/auth.js';

const custodyLogResolvers = {
  Query: {
    getCustodyLog: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      try {
        const log = await CustodyLog.findById(id);
        if (!log || log.isDeleted) {
          return {
            success: false,
            message: 'Custody log not found',
            log: null
          };
        }
        return {
          success: true,
          message: 'Custody log retrieved successfully',
          log
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          log: null
        };
      }
    },

    getAllCustodyLogs: async (_: any, { evidenceId, caseId, action, search }: any, context: any) => {
      requireAuth(context);
      try {
        const query: any = { isDeleted: false };
        
        if (evidenceId) {
          query.evidenceId = evidenceId;
        }
        
        if (caseId) {
          query.caseId = caseId;
        }
        
        if (action && action !== 'All') {
          query.action = action;
        }
        
        if (search) {
          query.$or = [
            { performedBy: { $regex: search, $options: 'i' } },
            { reason: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
          ];
        }

        const logs = await CustodyLog.find(query)
          .sort({ createdAt: -1 });

        const total = logs.length;

        return {
          success: true,
          message: 'Custody logs retrieved successfully',
          logs,
          total
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          logs: [],
          total: 0
        };
      }
    },

    getCustodyLogsByEvidence: async (_: any, { evidenceId }: { evidenceId: string }, context: any) => {
      requireAuth(context);
      try {
        const logs = await CustodyLog.find({ evidenceId, isDeleted: false })
          .sort({ createdAt: -1 });

        return {
          success: true,
          message: 'Custody logs retrieved successfully',
          logs,
          total: logs.length
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          logs: [],
          total: 0
        };
      }
    },

    getCustodyLogsByCase: async (_: any, { caseId }: { caseId: string }, context: any) => {
      requireAuth(context);
      try {
        const logs = await CustodyLog.find({ caseId, isDeleted: false })
          .sort({ createdAt: -1 });

        return {
          success: true,
          message: 'Custody logs retrieved successfully',
          logs,
          total: logs.length
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          logs: [],
          total: 0
        };
      }
    }
  },

  Mutation: {
    createCustodyLog: async (_: any, { input }: any, context: any) => {
      const user = requireAuth(context);
      try {
        const log = new CustodyLog({
          ...input,
          performedBy: user.id,
          performedByName: user.fullname
        });

        await log.save();

        return {
          success: true,
          message: 'Custody log created successfully',
          log
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          log: null
        };
      }
    }
  }
};

export default custodyLogResolvers;
