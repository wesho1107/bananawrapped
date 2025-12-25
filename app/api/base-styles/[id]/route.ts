import { NextRequest, NextResponse } from 'next/server';
import {
  getBaseStyleImageById,
  updateBaseStyleImage,
  deleteBaseStyleImage,
} from '@/lib/models/BaseStyleImage';

// GET - Fetch a specific base style image by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await getBaseStyleImageById(id);

    if (!image) {
      return NextResponse.json(
        { error: 'Base style image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error fetching base style image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base style image' },
      { status: 500 }
    );
  }
}

// PUT - Update a base style image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, imageUrl, thumbnailUrl } = body;

    // Validate imageUrl if provided
    if (imageUrl && !imageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageUrl must be a base64 data URI' },
        { status: 400 }
      );
    }

    const updatedImage = await updateBaseStyleImage(id, {
      name,
      imageUrl,
      thumbnailUrl,
    });

    if (!updatedImage) {
      return NextResponse.json(
        { error: 'Base style image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating base style image:', error);
    return NextResponse.json(
      { error: 'Failed to update base style image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a base style image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteBaseStyleImage(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Base style image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Base style image deleted' });
  } catch (error) {
    console.error('Error deleting base style image:', error);
    return NextResponse.json(
      { error: 'Failed to delete base style image' },
      { status: 500 }
    );
  }
}

