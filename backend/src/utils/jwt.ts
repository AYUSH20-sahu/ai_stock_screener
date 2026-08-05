import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
    userId: string;
    email: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: '15m',
    });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.jwtRefreshSecret, {
        expiresIn: '7d',
    });
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
};