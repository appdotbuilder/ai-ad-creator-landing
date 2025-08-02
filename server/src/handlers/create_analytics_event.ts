
import { db } from '../db';
import { analyticsEventsTable } from '../db/schema';
import { type CreateAnalyticsEventInput, type AnalyticsEvent } from '../schema';

export const createAnalyticsEvent = async (input: CreateAnalyticsEventInput): Promise<AnalyticsEvent> => {
  try {
    // Insert analytics event record
    const result = await db.insert(analyticsEventsTable)
      .values({
        event_type: input.event_type,
        event_data: input.event_data,
        user_agent: input.user_agent,
        ip_address: input.ip_address,
        referrer: input.referrer,
        utm_campaign: input.utm_campaign,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Analytics event creation failed:', error);
    throw error;
  }
};
