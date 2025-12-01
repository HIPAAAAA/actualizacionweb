import { MongoClient, ObjectId } from 'mongodb';
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
    try {
        const db = (await getClient()).db('complexrp');
        const collection = db.collection<UpdateFeature>('updates');

        switch (req.method) {
            case 'GET': {
                const updates = await collection.find().sort({ date: -1 }).toArray();
                // Convert _id to string id if needed, but our type has 'id'. 
                // We should ensure the stored objects have 'id' matching our frontend expectations.
                // The frontend generates 'id' (timestamp string) when creating.
                res.status(200).json(updates);
                break;
            }
            case 'POST': {
                const newUpdate: UpdateFeature = req.body;
                // Ensure we don't duplicate _id if mongo adds it.
                // We trust the frontend provided 'id'.
                await collection.insertOne(newUpdate);
                res.status(201).json(newUpdate);
                break;
            }
            default:
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
