import mongoose from 'mongoose';
const { Schema } = mongoose;
const caseSchema = new Schema({
    caseId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Open', 'Active', 'In Progress', 'Under Review', 'Closed', 'Archived'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    investigatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    investigatorName: {
        type: String,
        required: true
    },
    suspectLabel: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    incidentDate: {
        type: Date
    },
    evidenceCount: {
        type: Number,
        default: 0
    },
    tags: [{
            type: String
        }],
    notes: {
        type: String,
        default: ''
    },
    courtTribunal: {
        type: String,
        default: ''
    },
    requestingAuthority: {
        type: String,
        default: ''
    },
    investigationReference: {
        type: String,
        default: ''
    },
    requestingAgency: {
        type: String,
        default: ''
    },
    dateOfInstruction: {
        type: Date
    },
    scopeOfEngagement: {
        type: String,
        default: ''
    },
    specificQuestions: [{
            type: String
        }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
// Index for faster searches
caseSchema.index({ createdAt: -1 });
const Case = mongoose.model('Case', caseSchema);
export default Case;
//# sourceMappingURL=case.model.js.map