import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../services/prisma.service';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

const authCookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'strict' as const,
    path: '/',
    maxAge,
});

const clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'strict' as const,
    path: '/',
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
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

        res.cookie('accessToken', accessToken, authCookieOptions(15 * 60 * 1000));
        res.cookie('refreshToken', refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

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

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
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

        res.cookie('accessToken', accessToken, authCookieOptions(15 * 60 * 1000));
        res.cookie('refreshToken', refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

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

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry,
                },
            });

            // TODO: Send this token by email in production.
            // For now, return it in the response to support the demo workflow.
            return res.json({
                success: true,
                data: { resetToken },
                message: 'Password reset instructions have been generated.',
            });
        }

        return res.json({ success: true, message: 'If an account exists for that email, password reset instructions have been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: String(token),
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const passwordHash = await bcrypt.hash(String(password), 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
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

            res.cookie('accessToken', newAccessToken, authCookieOptions(15 * 60 * 1000));

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
    res.clearCookie('accessToken', clearAuthCookieOptions);
    res.clearCookie('refreshToken', clearAuthCookieOptions);
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
