import mongoose from 'mongoose';

const { Schema } = mongoose;

const evidenceSchema = new Schema({
  evidenceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  caseId: {
    type: Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  evidenceType: {
    type: String,
    enum: ['Digital', 'Physical', 'Document', 'Image', 'Video', 'Audio', 'Network', 'Mobile', 'Computer', 'Other'],
    default: 'Digital'
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  hashAlgorithm: {
    type: String,
    default: 'SHA-256'
  },
  sourceDevice: {
    type: String,
    default: ''
  },
  capturedAt: {
    type: Date
  },
  collectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collectedByName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Collected', 'In Analysis', 'Verified', 'Compromised', 'Archived'],
    default: 'Collected'
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Failed', 'Not Verified'],
    default: 'Pending'
  },
  lastVerifiedAt: {
    type: Date
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  serialNumber: {
    type: String,
    default: ''
  },
  conditionOnReceipt: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  filePath: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for faster searches
/* evidenceSchema.index({ evidenceId: 1 });
evidenceSchema.index({ caseId: 1 });
evidenceSchema.index({ hash: 1 });
evidenceSchema.index({ status: 1 });
evidenceSchema.index({ createdAt: -1 }); */

const Evidence = mongoose.model('Evidence', evidenceSchema);

export default Evidence;
