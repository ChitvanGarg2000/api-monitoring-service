import mongoose from "mongoose";
import SecurityUtils from "../utils/SecurityUtils.js";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,  
        minLength: 3,
        validate: {
            validator: function(username) {
                return /^[a-zA-Z0-9]+$/.test(username)
            },
            message: 'Please enter valid username'
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            },
            message: 'Please enter valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        validate: {
            validator: function(password) {
                if(this.isModified('password') && password && !password.startsWith('$2b$') && !password.startsWith('$2y$')) {
                    const result = SecurityUtils.validatePassword(password);
                    return result.success;
                }
                return true
            },
            message: function({value}){
                if(value && !value.startsWith('$2b$') && !value.startsWith('$2y$')) {
                    const result = SecurityUtils.validatePassword(value);
                    return result.errors.join('\n');
                }
                return 'Password is required';
            }
        }
    },
    role: {
        type: String,
        enum: ['super_admin', 'client_admin', 'client_user'],
        default: 'client_user',
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: function(){
            return this.role !== 'super_admin'
        }
    },

    isActive: {
        type: Boolean,
        default: true,
    },
    permissions: {
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canCreateApiKeys:{
            type: Boolean,
            default: false
        },
        canViewAnalytics:{
            type: Boolean,
            default: true
        },
        canExportData: {
            type: Boolean,
            default: false
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true, collection: 'users' })

UserSchema.pre('save', async function() {
    if(!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

UserSchema.index({clientId: 1, isActive: 1})
UserSchema.index({ role: 1})

export default mongoose.model('user', UserSchema);