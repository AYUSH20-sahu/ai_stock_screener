import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, JwtPayload } from '../utils/jwt';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                verificationToken,
            }
        });

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    imageUrl: user.imageUrl,
                },
                accessToken,
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    imageUrl: user.imageUrl,
                },
                accessToken,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        try {
            const decoded = verifyRefreshToken(refreshToken);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId }
            });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }

            const payload: JwtPayload = {
                userId: user.id,
                email: user.email,
            };

            const newAccessToken = generateAccessToken(payload);

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });

            res.json({
                success: true,
                data: { accessToken: newAccessToken }
            });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        try {
            const decoded = verifyAccessToken(accessToken);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    imageUrl: true,
                    createdAt: true,
                }
            });

            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            res.json({ success: true, data: { user } });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;