import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface MonthData {
  month: string; // "Jan", "Feb", etc.
  baseImageUrl: string; // base64 data URI (MVP)
  editPrompt: string;
  resultImageUrl: string; // base64 data URI (MVP)
}

export interface GeneratedCalendar {
  _id?: ObjectId;
  months: MonthData[];
  selectedBaseStyleId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'generatedCalendars';

export async function getGeneratedCalendars(): Promise<GeneratedCalendar[]> {
  const db = await getDatabase();
  const collection = db.collection<GeneratedCalendar>(COLLECTION_NAME);
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getGeneratedCalendarById(id: string): Promise<GeneratedCalendar | null> {
  const db = await getDatabase();
  const collection = db.collection<GeneratedCalendar>(COLLECTION_NAME);
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function createGeneratedCalendar(
  data: Omit<GeneratedCalendar, '_id' | 'createdAt' | 'updatedAt'>
): Promise<GeneratedCalendar> {
  const db = await getDatabase();
  const collection = db.collection<GeneratedCalendar>(COLLECTION_NAME);
  
  const now = new Date();
  const newCalendar: GeneratedCalendar = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await collection.insertOne(newCalendar);
  return { ...newCalendar, _id: result.insertedId };
}

export async function updateGeneratedCalendar(
  id: string,
  data: Partial<Omit<GeneratedCalendar, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<GeneratedCalendar | null> {
  const db = await getDatabase();
  const collection = db.collection<GeneratedCalendar>(COLLECTION_NAME);
  
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

export async function deleteGeneratedCalendar(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<GeneratedCalendar>(COLLECTION_NAME);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

