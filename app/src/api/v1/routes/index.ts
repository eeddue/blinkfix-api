import { Router } from 'express';
import UserRouter from './User';
import RecipesRouter from './Recipes';
import OrderRouter from './Order';
import ProfileRouter from './Profile';
import RatingRouter from './Rating';

import swaggerUi from 'swagger-ui-express';
import { swaggerDocs } from '../docs/swagger';
import { uploadStripeImage } from '../controllers/order/payment';

let rootRouter = Router();
rootRouter.use('/user', UserRouter);
rootRouter.use('/docs/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
rootRouter.use('/recipes', RecipesRouter);
rootRouter.use('/order', OrderRouter);
rootRouter.use('/profile', ProfileRouter);
rootRouter.use('/rating', RatingRouter);

rootRouter.get('/hello', (req, res) => {
  res.send('File uploaded');
});

export { rootRouter as RootRouter };
