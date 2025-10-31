// lib/settings-operations.js - Settings management
import { tables, DATABASE_ID, SETTINGS_COLLECTION } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

const TRANSITION_DELAY_KEY = 'transitionDelay';

// Initialize settings with defaults if they don't exist
export async function initializeSettings() {
  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SETTINGS_COLLECTION,
      queries: [Query.equal('setting', TRANSITION_DELAY_KEY), Query.limit(1)]
    });

    if (!existing.rows || existing.rows.length === 0) {
      // Create default transition delay setting (0 seconds = disabled)
      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: SETTINGS_COLLECTION,
        rowId: ID.unique(),
        data: {
          setting: TRANSITION_DELAY_KEY,
          value: 0
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize settings:', error);
    throw error;
  }
}

// Get transition delay setting
export async function getTransitionDelay() {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SETTINGS_COLLECTION,
      queries: [Query.equal('setting', TRANSITION_DELAY_KEY), Query.limit(1)]
    });

    if (result.rows && result.rows.length > 0) {
      return result.rows[0].value;
    }

    // If not found, initialize and return default
    await initializeSettings();
    return 0;
  } catch (error) {
    console.error('Failed to get transition delay:', error);
    return 0; // Return default on error
  }
}

// Set transition delay setting
export async function setTransitionDelay(seconds) {
  try {
    // Validate input
    if (typeof seconds !== 'number' || seconds < 0) {
      throw new Error('Transition delay must be a non-negative number');
    }

    if (seconds > 60) {
      throw new Error('Transition delay cannot exceed 60 seconds');
    }

    // Find existing setting
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SETTINGS_COLLECTION,
      queries: [Query.equal('setting', TRANSITION_DELAY_KEY), Query.limit(1)]
    });

    if (result.rows && result.rows.length > 0) {
      // Update existing setting
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: SETTINGS_COLLECTION,
        rowId: result.rows[0].$id,
        data: { value: seconds }
      });
    } else {
      // Create new setting
      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: SETTINGS_COLLECTION,
        rowId: ID.unique(),
        data: {
          setting: TRANSITION_DELAY_KEY,
          value: seconds
        }
      });
    }

    return seconds;
  } catch (error) {
    console.error('Failed to set transition delay:', error);
    throw error;
  }
}

