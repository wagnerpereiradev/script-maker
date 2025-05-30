import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Chave secreta para JWT (em produção deve estar em .env)
const JWT_SECRET = process.env.JWT_SECRET || 'script-maker-secret-key-change-in-production';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Gerar token JWT
 */
export function generateToken(user: AuthUser): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token válido por 7 dias
    );
}

/**
 * Verificar e decodificar token JWT
 */
export function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return null;
    }
}

/**
 * Autenticar usuário com email e senha
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
    try {
        const { email, password } = credentials;

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            return null; // Usuário não encontrado
        }

        if (!user.isActive) {
            throw new Error('Usuário inativo');
        }

        // Verificar senha
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return null; // Senha incorreta
        }

        // Atualizar último login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Retornar dados do usuário (sem senha)
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN',
        };
    } catch (error) {
        console.error('Erro na autenticação:', error);
        throw error;
    }
}

/**
 * Registrar novo usuário
 */
export async function registerUser(data: RegisterData): Promise<AuthUser> {
    try {
        const { email, password, name } = data;

        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('Email já está em uso');
        }

        // Validar senha
        if (password.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
        }

        // Hash da senha
        const hashedPassword = await hashPassword(password);

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER', // Usuários novos sempre começam como USER
                isActive: true,
                emailVerified: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN',
        };
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
}

/**
 * Buscar usuário por ID
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN',
        };
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
}

/**
 * Validar se email é válido
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validar força da senha
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
        return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }

    if (password.length > 100) {
        return { isValid: false, message: 'Senha muito longa' };
    }

    return { isValid: true };
} 