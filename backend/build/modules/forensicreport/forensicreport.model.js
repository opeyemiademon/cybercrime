import mongoose from 'mongoose';
const { Schema } = mongoose;
const toolSchema = new Schema({
    name: { type: String, default: '' },
    version: { type: String, default: '' },
    purpose: { type: String, default: '' }
}, { _id: false });
const forensicReportSchema = new Schema({
    caseId: {
        type: Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    caseRef: {
        type: String,
        required: true
    },
    generatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    generatedByName: {
        type: String,
        required: true
    },
    reportDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Draft', 'Finalised', 'Submitted'],
        default: 'Draft'
    },
    // Section 1 / Cover Page extras
    courtTribunal: { type: String, default: '' },
    requestingAuthority: { type: String, default: '' },
    investigationReference: { type: String, default: '' },
    // Section 3 – Instructions Received
    requestingAgency: { type: String, default: '' },
    dateOfInstruction: { type: Date },
    scopeOfEngagement: { type: String, default: '' },
    specificQuestions: [{ type: String }],
    // Section 2 – Expert Credentials
    expertQualifications: { type: String, default: '' },
    expertExperience: { type: String, default: '' },
    expertProfessionalBody: { type: String, default: '' },
    independenceStatement: { type: String, default: '' },
    oathDeclaration: { type: String, default: '' },
    expertName: { type: String, default: '' },
    // Section 6 – Methodology
    methodology: {
        standardsReferenced: [{ type: String }],
        toolsUsed: [toolSchema]
    },
    // Section 7 – Examination Process
    examinationProcess: {
        forensicImaging: { type: String, default: '' },
        dataAnalysis: { type: String, default: '' },
        timelineExamination: { type: String, default: '' },
        artifactRecovery: { type: String, default: '' }
    },
    // Section 8 – Findings
    findings: {
        fileSystemFindings: { type: String, default: '' },
        internetActivity: { type: String, default: '' },
        deletedDataRecovery: { type: String, default: '' },
        communicationArtifacts: { type: String, default: '' },
        timelineCorrelation: { type: String, default: '' }
    },
    // Section 9 – Limitations
    limitations: {
        encryptionIssues: { type: String, default: '' },
        damagedSectors: { type: String, default: '' },
        cloudAccessRestrictions: { type: String, default: '' },
        other: { type: String, default: '' }
    },
    // Section 10 – Expert Opinion
    expertOpinion: { type: String, default: '' },
    // Section 11 – Conclusion
    conclusion: { type: String, default: '' },
    // Section 12 – Recommendations
    recommendations: [{ type: String }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
forensicReportSchema.index({ caseId: 1 });
forensicReportSchema.index({ createdAt: -1 });
const ForensicReport = mongoose.model('ForensicReport', forensicReportSchema);
export default ForensicReport;
//# sourceMappingURL=forensicreport.model.js.map