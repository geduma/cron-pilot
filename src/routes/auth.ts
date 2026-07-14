import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { GedumaSessionResponse, ApiResponse, GedumaUser } from '../types/index.js';
import { sessionCache, type AuthUser } from '../plugins/auth.js';

const GEDUMA_API_URL = process.env.GEDUMA_API_URL || 'http://localhost:3000';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/auth/session', async (request: FastifyRequest, reply: FastifyReply) => {
    const { sessionToken } = request.body as { sessionToken: string };

    if (!sessionToken) {
      return reply.status(400).send({
        success: false,
        data: null,
        message: 'sessionToken is required'
      } as ApiResponse<null>);
    }

    try {
      const response = await fetch(`${GEDUMA_API_URL}/auth/session/${sessionToken}`);

      if (!response.ok) {
        return reply.status(401).send({
          success: false,
          data: null,
          message: 'Invalid or expired session token'
        } as ApiResponse<null>);
      }

      const data: GedumaSessionResponse = await response.json();

      if (!data.ok || !data.data) {
        return reply.status(401).send({
          success: false,
          data: null,
          message: 'Invalid session'
        } as ApiResponse<null>);
      }

      if (!data.data.allowed) {
        return reply.status(403).send({
          success: false,
          data: null,
          message: 'User not allowed'
        } as ApiResponse<null>);
      }

      const userData: GedumaUser = data.data;

      const authUser: AuthUser = {
        email: userData.email,
        displayName: userData.displayName,
        picture: userData.picture,
        provider: userData.provider,
        userId: userData.email
      };
      sessionCache.set(sessionToken, authUser);

      const apiResponse: ApiResponse<GedumaUser> = {
        success: true,
        data: userData,
        message: ''
      };

      return reply.send(apiResponse);
    } catch (error) {
      console.error('Session validation error:', error);
      return reply.status(500).send({
        success: false,
        data: null,
        message: 'Internal server error during session validation'
      } as ApiResponse<null>);
    }
  });
}
