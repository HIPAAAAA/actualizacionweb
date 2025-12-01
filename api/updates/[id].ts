import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UpdateFeature } from '../../types';

// Connection URI
const uri = 'mongodb+srv://complexrp:complexrp@hipaaaaa.kjko0im.mongodb.net/complexrp?appName=Hipaaaaa';
let client: MongoClient;

async function getClient() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }

    try {
        const db = (await getClient()).db('complexrp');
        const collection = db.collection<UpdateFeature>('updates');

        switch (req.method) {
            case 'PUT': {
                const updated: UpdateFeature = req.body;
                // We use 'id' field for identification, not _id
                await collection.updateOne({ id: id }, { $set: updated });
                const result = await collection.findOne({ id: id });
                res.status(200).json(result);
                break;
            }
            case 'DELETE': {
                await collection.deleteOne({ id: id });
                res.status(204).end();
                break;
            }
            default:
                res.setHeader('Allow', ['PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
