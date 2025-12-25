import { NextRequest, NextResponse } from 'next/server';
import {
  getGeneratedCalendars,
  createGeneratedCalendar,
  GeneratedCalendar,
  MonthData,
} from '@/lib/models/GeneratedCalendar';
import { ObjectId } from 'mongodb';

// GET - Fetch all saved calendars (with optional pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const allCalendars = await getGeneratedCalendars();
    const total = allCalendars.length;

    // Apply pagination if provided
    let calendars = allCalendars;
    if (limit || offset) {
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1)) {
        return NextResponse.json(
          { error: 'limit must be a positive number' },
          { status: 400 }
        );
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        return NextResponse.json(
          { error: 'offset must be a non-negative number' },
          { status: 400 }
        );
      }

      const start = offsetNum;
      const end = limitNum !== undefined ? start + limitNum : undefined;
      calendars = allCalendars.slice(start, end);
    }

    return NextResponse.json({
      calendars,
      total,
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}

// POST - Save a new generated calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { months, selectedBaseStyleId } = body;

    // Validate required fields
    if (!months || !Array.isArray(months)) {
      return NextResponse.json(
        { error: 'months must be an array' },
        { status: 400 }
      );
    }

    if (!selectedBaseStyleId) {
      return NextResponse.json(
        { error: 'selectedBaseStyleId is required' },
        { status: 400 }
      );
    }

    // Validate months array structure
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

    // Validate selectedBaseStyleId is a valid ObjectId
    let baseStyleObjectId: ObjectId;
    try {
      baseStyleObjectId = new ObjectId(selectedBaseStyleId);
    } catch (error) {
      return NextResponse.json(
        { error: 'selectedBaseStyleId must be a valid ObjectId' },
        { status: 400 }
      );
    }

    // Create the calendar
    const newCalendar = await createGeneratedCalendar({
      months: months as MonthData[],
      selectedBaseStyleId: baseStyleObjectId,
    });

    return NextResponse.json(newCalendar, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar:', error);

    if (error instanceof Error) {
      // Handle ObjectId validation errors
      if (error.message.includes('ObjectId')) {
        return NextResponse.json(
          { error: `Invalid ObjectId format: ${error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create calendar: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create calendar' },
      { status: 500 }
    );
  }
}

