import mongoose from 'mongoose';

const { Schema } = mongoose;

const custodyLogSchema = new Schema({
  evidenceId: {
    type: Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true
  },
  caseId: {
    type: Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  action: {
    type: String,
    enum: ['Collected', 'Transferred', 'Analyzed', 'Stored', 'Released', 'Verified', 'Modified', 'Accessed', 'Deleted'],
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  purpose: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  previousHash: {
    type: String,
    default: ''
  },
  currentHash: {
    type: String,
    default: ''
  },
  hashChain: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for faster searches
/* custodyLogSchema.index({ evidenceId: 1 });
custodyLogSchema.index({ caseId: 1 });
custodyLogSchema.index({ performedBy: 1 });
custodyLogSchema.index({ action: 1 });
custodyLogSchema.index({ createdAt: -1 }); */

const CustodyLog = mongoose.model('CustodyLog', custodyLogSchema);

export default CustodyLog;
