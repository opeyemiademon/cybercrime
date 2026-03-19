import mongoose from 'mongoose';
const { Schema } = mongoose;
const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Investigator', 'Reviewer', 'Analyst'],
        default: 'Investigator'
    },
    department: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    qualifications: {
        type: String,
        default: ''
    },
    experience: {
        type: String,
        default: ''
    },
    professionalBody: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;
//# sourceMappingURL=user.model.js.map