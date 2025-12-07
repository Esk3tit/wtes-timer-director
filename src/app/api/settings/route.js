// app/api/settings/route.js - Settings API endpoint
import { NextResponse } from 'next/server';
import { getAllSettings, setTransitionDelay, setBroadcastDelay } from '@/lib/settings-operations';

// GET - Retrieve current settings
export async function GET(request) {
  try {
    const settings = await getAllSettings();
    
    return NextResponse.json({
      success: true,
      data: settings
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
    const { transitionDelay, broadcastDelay } = body;
    
    const updatedSettings = {};

    // Update transition delay if provided
    if (transitionDelay !== undefined && transitionDelay !== null) {
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

      updatedSettings.transitionDelay = await setTransitionDelay(transitionDelay);
    }

    // Update broadcast delay if provided
    if (broadcastDelay !== undefined && broadcastDelay !== null) {
      if (typeof broadcastDelay !== 'number') {
        return NextResponse.json({
          success: false,
          error: 'broadcastDelay must be a number'
        }, { status: 400 });
      }

      if (broadcastDelay < 0) {
        return NextResponse.json({
          success: false,
          error: 'broadcastDelay must be non-negative'
        }, { status: 400 });
      }

      if (broadcastDelay > 600) {
        return NextResponse.json({
          success: false,
          error: 'broadcastDelay cannot exceed 600 seconds (10 minutes)'
        }, { status: 400 });
      }

      updatedSettings.broadcastDelay = await setBroadcastDelay(broadcastDelay);
    }

    // Get all current settings to return
    const allSettings = await getAllSettings();

    console.log('Settings updated:', updatedSettings);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: allSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update settings'
    }, { status: 500 });
  }
}

