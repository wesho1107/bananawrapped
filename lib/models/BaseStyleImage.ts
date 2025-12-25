import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface BaseStyleImage {
  _id?: ObjectId;
  name: string;
  imageUrl: string; // base64 data URI (MVP) or S3 URL (future)
  thumbnailUrl?: string; // base64 data URI (MVP)
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'baseStyleImages';

export async function getBaseStyleImages(): Promise<BaseStyleImage[]> {
  const db = await getDatabase();
  const collection = db.collection<BaseStyleImage>(COLLECTION_NAME);
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getBaseStyleImageById(id: string): Promise<BaseStyleImage | null> {
  const db = await getDatabase();
  const collection = db.collection<BaseStyleImage>(COLLECTION_NAME);
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function createBaseStyleImage(data: Omit<BaseStyleImage, '_id' | 'createdAt' | 'updatedAt'>): Promise<BaseStyleImage> {
  const db = await getDatabase();
  const collection = db.collection<BaseStyleImage>(COLLECTION_NAME);
  
  const now = new Date();
  const newImage: BaseStyleImage = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await collection.insertOne(newImage);
  return { ...newImage, _id: result.insertedId };
}

export async function updateBaseStyleImage(
  id: string,
  data: Partial<Omit<BaseStyleImage, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<BaseStyleImage | null> {
  const db = await getDatabase();
  const collection = db.collection<BaseStyleImage>(COLLECTION_NAME);
  
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...data, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

export async function deleteBaseStyleImage(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<BaseStyleImage>(COLLECTION_NAME);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

