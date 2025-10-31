// app/api/settings/route.js - Settings API endpoint
import { NextResponse } from 'next/server';
import { getTransitionDelay, setTransitionDelay } from '@/lib/settings-operations';

// GET - Retrieve current settings
export async function GET(request) {
  try {
    const transitionDelay = await getTransitionDelay();
    
    return NextResponse.json({
      success: true,
      data: {
        transitionDelay
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve settings'
    }, { status: 500 });
  }
}

// POST - Update settings
export async function POST(request) {
  try {
    const body = await request.json();
    const { transitionDelay } = body;

    // Validate transition delay
    if (transitionDelay === undefined || transitionDelay === null) {
      return NextResponse.json({
        success: false,
        error: 'transitionDelay is required'
      }, { status: 400 });
    }

    if (typeof transitionDelay !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'transitionDelay must be a number'
      }, { status: 400 });
    }

    if (transitionDelay < 0) {
      return NextResponse.json({
        success: false,
        error: 'transitionDelay must be non-negative'
      }, { status: 400 });
    }

    if (transitionDelay > 60) {
      return NextResponse.json({
        success: false,
        error: 'transitionDelay cannot exceed 60 seconds'
      }, { status: 400 });
    }

    // Update setting
    const updatedDelay = await setTransitionDelay(transitionDelay);

    console.log(`Settings updated: transitionDelay=${updatedDelay}s`);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        transitionDelay: updatedDelay
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update settings'
    }, { status: 500 });
  }
}

