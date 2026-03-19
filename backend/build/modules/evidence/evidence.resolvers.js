import Evidence from './evidence.model.js';
import Case from '../case/case.model.js';
import CustodyLog from '../custodylog/custodylog.model.js';
import { requireAuth } from '../../middleware/auth.js';
import { processEvidenceUpload } from '../../utils/fileUpload.js';
const generateEvidenceId = async () => {
    const year = new Date().getFullYear();
    const count = await Evidence.countDocuments({ isDeleted: false });
    return `EVD-${year}-${String(count + 1).padStart(6, '0')}`;
};
const evidenceResolvers = {
    Query: {
        getEvidence: async (_, { id }, context) => {
            requireAuth(context);
            try {
                const evidence = await Evidence.findById(id);
                if (!evidence || evidence.isDeleted) {
                    return {
                        success: false,
                        message: 'Evidence not found',
                        evidence: null
                    };
                }
                return {
                    success: true,
                    message: 'Evidence retrieved successfully',
                    evidence
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidence: null
                };
            }
        },
        getAllEvidence: async (_, { caseId, status, search }, context) => {
            requireAuth(context);
            try {
                const query = { isDeleted: false };
                if (caseId) {
                    query.caseId = caseId;
                }
                if (status && status !== 'All') {
                    query.status = status;
                }
                if (search) {
                    query.$or = [
                        { evidenceId: { $regex: search, $options: 'i' } },
                        { filename: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ];
                }
                const evidences = await Evidence.find(query)
                    .sort({ createdAt: -1 });
                const total = evidences.length;
                return {
                    success: true,
                    message: 'Evidence retrieved successfully',
                    evidences,
                    total
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidences: [],
                    total: 0
                };
            }
        },
        getEvidenceByCase: async (_, { caseId }, context) => {
            requireAuth(context);
            try {
                const evidences = await Evidence.find({ caseId, isDeleted: false })
                    .sort({ createdAt: -1 });
                return {
                    success: true,
                    message: 'Evidence retrieved successfully',
                    evidences,
                    total: evidences.length
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidences: [],
                    total: 0
                };
            }
        }
    },
    Mutation: {
        createEvidence: async (_, { input }, context) => {
            const user = requireAuth(context);
            try {
                const evidenceId = input.evidenceId || await generateEvidenceId();
                const existingEvidence = await Evidence.findOne({ hash: input.hash, isDeleted: false });
                if (existingEvidence) {
                    return {
                        success: false,
                        message: 'Evidence with this hash already exists',
                        evidence: null
                    };
                }
                let uploadedFile = null;
                if (input.fileData) {
                    try {
                        uploadedFile = await processEvidenceUpload(input.fileData, input.caseId, input.filename, evidenceId);
                    }
                    catch (uploadError) {
                        return {
                            success: false,
                            message: `File upload failed: ${uploadError.message}`,
                            evidence: null
                        };
                    }
                }
                else {
                    console.log('No fileData provided in input');
                }
                const evidence = new Evidence({
                    ...input,
                    evidenceId,
                    collectedBy: user.id,
                    collectedByName: user.fullname,
                    ...(uploadedFile && {
                        filePath: uploadedFile.filePath,
                        filename: uploadedFile.filename,
                        fileSize: uploadedFile.fileSize
                    })
                });
                await evidence.save();
                const caseData = await Case.findById(input.caseId);
                if (caseData) {
                    caseData.evidenceCount = (caseData.evidenceCount || 0) + 1;
                    await caseData.save();
                }
                await CustodyLog.create({
                    evidenceId: evidence._id,
                    caseId: input.caseId,
                    action: 'Collected',
                    performedBy: user.id,
                    performedByName: user.fullname,
                    currentHash: input.hash,
                    notes: uploadedFile
                        ? `Evidence collected and file uploaded to ${uploadedFile.filePath}`
                        : 'Evidence collected and uploaded to system'
                });
                return {
                    success: true,
                    message: 'Evidence created successfully',
                    evidence
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidence: null
                };
            }
        },
        updateEvidence: async (_, { id, input }, context) => {
            requireAuth(context);
            try {
                const evidence = await Evidence.findById(id);
                if (!evidence || evidence.isDeleted) {
                    return {
                        success: false,
                        message: 'Evidence not found',
                        evidence: null
                    };
                }
                Object.assign(evidence, input);
                await evidence.save();
                return {
                    success: true,
                    message: 'Evidence updated successfully',
                    evidence
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidence: null
                };
            }
        },
        deleteEvidence: async (_, { id }, context) => {
            requireAuth(context);
            try {
                const evidence = await Evidence.findById(id);
                if (!evidence || evidence.isDeleted) {
                    return {
                        success: false,
                        message: 'Evidence not found',
                        evidence: null
                    };
                }
                evidence.isDeleted = true;
                await evidence.save();
                const caseData = await Case.findById(evidence.caseId);
                if (caseData && caseData.evidenceCount > 0) {
                    caseData.evidenceCount -= 1;
                    await caseData.save();
                }
                return {
                    success: true,
                    message: 'Evidence deleted successfully',
                    evidence: null
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    evidence: null
                };
            }
        },
        verifyEvidence: async (_, { input }, context) => {
            const user = requireAuth(context);
            try {
                const evidence = await Evidence.findById(input.evidenceId);
                if (!evidence || evidence.isDeleted) {
                    return {
                        success: false,
                        message: 'Evidence not found',
                        isValid: false,
                        storedHash: '',
                        calculatedHash: input.hash,
                        evidence: null
                    };
                }
                const isValid = evidence.hash === input.hash;
                evidence.verificationCount = (evidence.verificationCount || 0) + 1;
                evidence.lastVerifiedAt = new Date();
                evidence.verificationStatus = isValid ? 'Verified' : 'Failed';
                await evidence.save();
                await CustodyLog.create({
                    evidenceId: evidence._id,
                    caseId: evidence.caseId,
                    action: 'Verified',
                    performedBy: user.id,
                    performedByName: user.fullname,
                    previousHash: evidence.hash,
                    currentHash: input.hash,
                    notes: isValid ? 'Hash verification passed' : 'Hash verification failed'
                });
                return {
                    success: true,
                    message: isValid ? 'Evidence verified successfully' : 'Evidence verification failed',
                    isValid,
                    storedHash: evidence.hash,
                    calculatedHash: input.hash,
                    evidence
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message,
                    isValid: false,
                    storedHash: '',
                    calculatedHash: input.hash,
                    evidence: null
                };
            }
        }
    }
};
export default evidenceResolvers;
//# sourceMappingURL=evidence.resolvers.js.map