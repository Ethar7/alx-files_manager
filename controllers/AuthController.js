// controllers/AuthController.js
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const status = await redisClient.isAlive() && await dbClient.isAlive();
    res.status(status ? 200 : 500).send({ redis: true, db: true });
  }

  static async getDisconnect(req, res) {
    await redisClient.quit();
    await dbClient.close();
    res.status(204).send();
  }
}

export default AuthController;
