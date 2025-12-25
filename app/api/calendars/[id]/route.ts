import { NextRequest, NextResponse } from 'next/server';
import {
  getGeneratedCalendarById,
  updateGeneratedCalendar,
  GeneratedCalendar,
  MonthData,
} from '@/lib/models/GeneratedCalendar';
import { ObjectId } from 'mongodb';

// GET - Fetch a specific calendar by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid calendar ID format' },
        { status: 400 }
      );
    }

    const calendar = await getGeneratedCalendarById(id);

    if (!calendar) {
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(calendar);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing calendar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { months, selectedBaseStyleId } = body;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid calendar ID format' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: Partial<Omit<GeneratedCalendar, '_id' | 'createdAt' | 'updatedAt'>> = {};

    // Validate and set months if provided
    if (months !== undefined) {
      if (!Array.isArray(months)) {
        return NextResponse.json(
          { error: 'months must be an array' },
          { status: 400 }
        );
      }

      if (months.length === 0) {
        return NextResponse.json(
          { error: 'months array cannot be empty' },
          { status: 400 }
        );
      }

      // Validate each month entry
      for (const month of months) {
        if (!month.month || typeof month.month !== 'string') {
          return NextResponse.json(
            { error: 'Each month must have a valid month string' },
            { status: 400 }
          );
        }

        if (!month.baseImageUrl || typeof month.baseImageUrl !== 'string') {
          return NextResponse.json(
            { error: 'Each month must have a valid baseImageUrl' },
            { status: 400 }
          );
        }

        if (!month.baseImageUrl.startsWith('data:image/')) {
          return NextResponse.json(
            { error: 'baseImageUrl must be a base64 data URI' },
            { status: 400 }
          );
        }

        if (!month.editPrompt || typeof month.editPrompt !== 'string') {
          return NextResponse.json(
            { error: 'Each month must have a valid editPrompt' },
            { status: 400 }
          );
        }

        if (!month.resultImageUrl || typeof month.resultImageUrl !== 'string') {
          return NextResponse.json(
            { error: 'Each month must have a valid resultImageUrl' },
            { status: 400 }
          );
        }

        if (!month.resultImageUrl.startsWith('data:image/')) {
          return NextResponse.json(
            { error: 'resultImageUrl must be a base64 data URI' },
            { status: 400 }
          );
        }
      }

      updateData.months = months as MonthData[];
    }

    // Validate and set selectedBaseStyleId if provided
    if (selectedBaseStyleId !== undefined) {
      if (!ObjectId.isValid(selectedBaseStyleId)) {
        return NextResponse.json(
          { error: 'selectedBaseStyleId must be a valid ObjectId' },
          { status: 400 }
        );
      }
      updateData.selectedBaseStyleId = new ObjectId(selectedBaseStyleId);
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const updatedCalendar = await updateGeneratedCalendar(id, updateData);

    if (!updatedCalendar) {
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCalendar);
  } catch (error) {
    console.error('Error updating calendar:', error);

    if (error instanceof Error) {
      // Handle ObjectId validation errors
      if (error.message.includes('ObjectId')) {
        return NextResponse.json(
          { error: `Invalid ObjectId format: ${error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Failed to update calendar: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update calendar' },
      { status: 500 }
    );
  }
}

