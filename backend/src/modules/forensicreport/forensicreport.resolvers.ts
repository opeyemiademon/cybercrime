import ForensicReport from './forensicreport.model.js';
import Case from '../case/case.model.js';
import { requireAuth } from '../../middleware/auth.js';

const forensicReportResolvers = {
  Query: {
    getForensicReport: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      try {
        const report = await ForensicReport.findById(id);
        if (!report || report.isDeleted) {
          return { success: false, message: 'Report not found', report: null };
        }
        return { success: true, message: 'Report retrieved successfully', report };
      } catch (error: any) {
        return { success: false, message: error.message, report: null };
      }
    },

    getForensicReportsByCase: async (_: any, { caseId }: { caseId: string }, context: any) => {
      requireAuth(context);
      try {
        const reports = await ForensicReport.find({ caseId, isDeleted: false }).sort({ createdAt: -1 });
        return { success: true, message: 'Reports retrieved successfully', reports, total: reports.length };
      } catch (error: any) {
        return { success: false, message: error.message, reports: [], total: 0 };
      }
    },

    getAllForensicReports: async (_: any, __: any, context: any) => {
      requireAuth(context);
      try {
        const reports = await ForensicReport.find({ isDeleted: false }).sort({ createdAt: -1 });
        return { success: true, message: 'Reports retrieved successfully', reports, total: reports.length };
      } catch (error: any) {
        return { success: false, message: error.message, reports: [], total: 0 };
      }
    }
  },

  Mutation: {
    createForensicReport: async (_: any, { input }: any, context: any) => {
      const user = requireAuth(context);
      try {
        const caseData = await Case.findById(input.caseId);
        if (!caseData || caseData.isDeleted) {
          return { success: false, message: 'Case not found', report: null };
        }

        const report = new ForensicReport({
          ...input,
          caseRef: caseData.caseId,
          generatedBy: user.id,
          generatedByName: user.fullname,
          reportDate: new Date()
        });

        await report.save();
        return { success: true, message: 'Forensic report created successfully', report };
      } catch (error: any) {
        return { success: false, message: error.message, report: null };
      }
    },

    updateForensicReport: async (_: any, { id, input }: any, context: any) => {
      requireAuth(context);
      try {
        const report = await ForensicReport.findById(id);
        if (!report || report.isDeleted) {
          return { success: false, message: 'Report not found', report: null };
        }

        // Deep merge nested objects
        const nestedFields = ['methodology', 'examinationProcess', 'findings', 'limitations'];
        for (const field of nestedFields) {
          if (input[field]) {
            (report as any)[field] = { ...(report as any)[field]?.toObject?.() ?? {}, ...input[field] };
            delete input[field];
          }
        }

        Object.assign(report, input);
        await report.save();
        return { success: true, message: 'Forensic report updated successfully', report };
      } catch (error: any) {
        return { success: false, message: error.message, report: null };
      }
    },

    deleteForensicReport: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      try {
        const report = await ForensicReport.findById(id);
        if (!report || report.isDeleted) {
          return { success: false, message: 'Report not found', report: null };
        }
        report.isDeleted = true;
        await report.save();
        return { success: true, message: 'Forensic report deleted successfully', report: null };
      } catch (error: any) {
        return { success: false, message: error.message, report: null };
      }
    }
  }
};

export default forensicReportResolvers;
