import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GedumaSessionResponse } from '../types/index.js';

export const sessionCache = new Map<string, AuthUser>();

export interface AuthUser {
  email: string;
  displayName: string;
  picture: string;
  provider: string;
  userId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: 'Unauthorized: No token provided'
    });
  }

  const token = authHeader.substring(7);

  const cached = sessionCache.get(token);
  if (cached) {
    request.user = cached;
    return;
  }

  const gedumaUrl = process.env.GEDUMA_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${gedumaUrl}/auth/session/${token}`);

    if (!response.ok) {
      sessionCache.delete(token);
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized: Invalid or expired token'
      });
    }

    const data: GedumaSessionResponse = await response.json();

    if (!data.ok || !data.data) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized: Invalid session'
      });
    }

    if (!data.data.allowed) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: User not allowed'
      });
    }

    // Use email as userId for simplicity
    request.user = {
      email: data.data.email,
      displayName: data.data.displayName,
      picture: data.data.picture,
      provider: data.data.provider,
      userId: data.data.email
    };

    sessionCache.set(token, request.user);
  } catch (error) {
    console.error('Auth validation error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}
