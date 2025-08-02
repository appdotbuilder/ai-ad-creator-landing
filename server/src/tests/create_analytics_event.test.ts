
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { analyticsEventsTable } from '../db/schema';
import { type CreateAnalyticsEventInput } from '../schema';
import { createAnalyticsEvent } from '../handlers/create_analytics_event';
import { eq } from 'drizzle-orm';

// Comprehensive test input with all fields
const testInput: CreateAnalyticsEventInput = {
  event_type: 'page_view',
  event_data: '{"page": "/landing", "section": "hero"}',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip_address: '192.168.1.1',
  referrer: 'https://google.com',
  utm_campaign: 'summer_sale',
  utm_source: 'google',
  utm_medium: 'cpc'
};

describe('createAnalyticsEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an analytics event with all fields', async () => {
    const result = await createAnalyticsEvent(testInput);

    // Basic field validation
    expect(result.event_type).toEqual('page_view');
    expect(result.event_data).toEqual('{"page": "/landing", "section": "hero"}');
    expect(result.user_agent).toEqual('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(result.ip_address).toEqual('192.168.1.1');
    expect(result.referrer).toEqual('https://google.com');
    expect(result.utm_campaign).toEqual('summer_sale');
    expect(result.utm_source).toEqual('google');
    expect(result.utm_medium).toEqual('cpc');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an analytics event with minimal fields', async () => {
    const minimalInput: CreateAnalyticsEventInput = {
      event_type: 'button_click',
      event_data: null,
      user_agent: null,
      ip_address: null,
      referrer: null,
      utm_campaign: null,
      utm_source: null,
      utm_medium: null
    };

    const result = await createAnalyticsEvent(minimalInput);

    expect(result.event_type).toEqual('button_click');
    expect(result.event_data).toBeNull();
    expect(result.user_agent).toBeNull();
    expect(result.ip_address).toBeNull();
    expect(result.referrer).toBeNull();
    expect(result.utm_campaign).toBeNull();
    expect(result.utm_source).toBeNull();
    expect(result.utm_medium).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save analytics event to database', async () => {
    const result = await createAnalyticsEvent(testInput);

    // Query using proper drizzle syntax
    const events = await db.select()
      .from(analyticsEventsTable)
      .where(eq(analyticsEventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].event_type).toEqual('page_view');
    expect(events[0].event_data).toEqual('{"page": "/landing", "section": "hero"}');
    expect(events[0].user_agent).toEqual('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(events[0].ip_address).toEqual('192.168.1.1');
    expect(events[0].utm_campaign).toEqual('summer_sale');
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different event types correctly', async () => {
    const eventTypes = ['page_view', 'button_click', 'form_submit', 'download', 'video_play'];

    for (const eventType of eventTypes) {
      const input: CreateAnalyticsEventInput = {
        event_type: eventType,
        event_data: `{"type": "${eventType}"}`,
        user_agent: null,
        ip_address: null,
        referrer: null,
        utm_campaign: null,
        utm_source: null,
        utm_medium: null
      };

      const result = await createAnalyticsEvent(input);
      expect(result.event_type).toEqual(eventType);
      expect(result.event_data).toEqual(`{"type": "${eventType}"}`);
    }

    // Verify all events were saved
    const allEvents = await db.select()
      .from(analyticsEventsTable)
      .execute();

    expect(allEvents).toHaveLength(eventTypes.length);
  });
});
