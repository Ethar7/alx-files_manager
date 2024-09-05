import express from 'express';
import routes from './routes/index';

const appli = express();
const port = process.env.PORT || 5000;

appli.use(express.json());
appli.use('/', routes);

appli.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
