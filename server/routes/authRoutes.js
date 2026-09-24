const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, region } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'User with this email already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            name, 
            email: email.toLowerCase().trim(), 
            password: hashedPassword, 
            role, 
            region: region || 'North Region' 
        });

        await newUser.save();
        
        // Auto-generate token upon successful registration
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role, name: newUser.name, region: newUser.region }, 
            secret, 
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            message: 'User registered successfully!',
            token,
            user: { 
                id: newUser._id, 
                _id: newUser._id, 
                name: newUser.name, 
                email: newUser.email, 
                role: newUser.role, 
                region: newUser.region 
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ error: 'User account not found.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid password or credentials.' });

        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name, region: user.region }, 
            secret, 
            { expiresIn: '7d' }
        );
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                region: user.region 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify & Get Current User Profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;