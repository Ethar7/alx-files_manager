import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      type,
      parentId = 0,
      isPublic = false,
      data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : new ObjectId(parentId),
    };

    if (type === 'folder') {
      const newFile = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(newFile.ops[0]);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    fileDocument.localPath = localPath;
    fileDocument.mimeType = mime.lookup(name);

    const newFile = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json(newFile.ops[0]);
  }

  static async getShow(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(req.params.id), userId: new ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(file);
  }

  static async getIndex(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const files = await dbClient.db.collection('files')
      .find({ userId: new ObjectId(userId), parentId: parentId === '0' ? '0' : new ObjectId(parentId) })
      .skip(page * 20)
      .limit(20)
      .toArray();

    return res.json(files);
  }

  static async putPublish(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnOriginal: false }
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async putUnpublish(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnOriginal: false }
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }
}

export default FilesController;
