import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(request, res) {
    const rediusst = await redisClient.isAlive();
    const dbStatus = await dbClient.isAlive();
    res.status(200).json({ redis: redisSt, db: dbStatus });
  }

  static async getStats(request, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

export default AppController;
