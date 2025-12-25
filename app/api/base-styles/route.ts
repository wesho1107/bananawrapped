import { NextRequest, NextResponse } from 'next/server';
import {
  getBaseStyleImages,
  createBaseStyleImage,
  BaseStyleImage,
} from '@/lib/models/BaseStyleImage';

// GET - Fetch all base style images
export async function GET() {
  try {
    const images = await getBaseStyleImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching base style images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base style images' },
      { status: 500 }
    );
  }
}

// POST - Create a new base style image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl, thumbnailUrl } = body;

    // Validate required fields
    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'Name and imageUrl are required' },
        { status: 400 }
      );
    }

    // Validate imageUrl is a base64 data URI (MVP)
    if (!imageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageUrl must be a base64 data URI (e.g., data:image/jpeg;base64,...)' },
        { status: 400 }
      );
    }

    const newImage = await createBaseStyleImage({
      name,
      imageUrl,
      thumbnailUrl,
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Error creating base style image:', error);
    return NextResponse.json(
      { error: 'Failed to create base style image' },
      { status: 500 }
    );
  }
}

