import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO || process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'marcus.smart@athlete.com' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
    
    console.log('USER_ID:', user._id);
    console.log('TOKEN:', token);
    process.exit(0);
};

run();
