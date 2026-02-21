import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'D&D AI Narrative API',
      version: '0.1.0',
      description:
        'API REST pour le jeu de rôle narratif D&D propulsé par l\'IA. ' +
        'Gère les salles de jeu, personnages, sessions et mémoires narratives.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via /api/auth/signin',
        },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            message: { type: 'string', example: 'Validation failed' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                details: { type: 'object' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'health', description: 'Healthcheck et statut du service' },
      { name: 'auth', description: 'Authentification et gestion de session' },
      { name: 'rooms', description: 'Gestion des salles de jeu' },
      { name: 'characters', description: 'Gestion des personnages D&D' },
    ],
  },
  apis: ['./app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
