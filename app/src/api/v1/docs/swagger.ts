import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi, { SwaggerOptions } from 'swagger-ui-express';
import express from 'express';
let docRouter = express.Router();

const swaggerOptions: SwaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Blinkfix API',
      version: '1.0.0',
      description: 'API Information',
      contact: {
        name: 'Amazing Developer',
      },
      servers: ['http://localhost:3000'],
    },
  },
  // ['.routes/*.js']

  apis: ['app/src/api/v1/controllers/*/*.ts', 'app/src/api/v1/models/*/*.ts'],
};
export const swaggerDocs = swaggerJsDoc(swaggerOptions);
export default docRouter;
