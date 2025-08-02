
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsletterSubscriptionsTable } from '../db/schema';
import { getNewsletterSubscriptions } from '../handlers/get_newsletter_subscriptions';

describe('getNewsletterSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subscriptions exist', async () => {
    const result = await getNewsletterSubscriptions();
    expect(result).toEqual([]);
  });

  it('should return all newsletter subscriptions', async () => {
    // Create test subscriptions
    await db.insert(newsletterSubscriptionsTable)
      .values([
        {
          email: 'user1@example.com',
          status: 'active'
        },
        {
          email: 'user2@example.com',
          status: 'unsubscribed'
        },
        {
          email: 'user3@example.com',
          status: 'active'
        }
      ])
      .execute();

    const result = await getNewsletterSubscriptions();

    expect(result).toHaveLength(3);
    
    // Check first subscription
    const activeSubscription = result.find(sub => sub.email === 'user1@example.com');
    expect(activeSubscription).toBeDefined();
    expect(activeSubscription!.status).toEqual('active');
    expect(activeSubscription!.subscribed_at).toBeInstanceOf(Date);
    expect(activeSubscription!.unsubscribed_at).toBeNull();
    expect(activeSubscription!.id).toBeDefined();

    // Check unsubscribed subscription
    const unsubscribedSubscription = result.find(sub => sub.email === 'user2@example.com');
    expect(unsubscribedSubscription).toBeDefined();
    expect(unsubscribedSubscription!.status).toEqual('unsubscribed');
    expect(unsubscribedSubscription!.subscribed_at).toBeInstanceOf(Date);
    expect(unsubscribedSubscription!.id).toBeDefined();
  });

  it('should return subscriptions with correct date types', async () => {
    // Create subscription with unsubscribed date
    const now = new Date();
    await db.insert(newsletterSubscriptionsTable)
      .values({
        email: 'test@example.com',
        status: 'unsubscribed',
        unsubscribed_at: now
      })
      .execute();

    const result = await getNewsletterSubscriptions();

    expect(result).toHaveLength(1);
    expect(result[0].subscribed_at).toBeInstanceOf(Date);
    expect(result[0].unsubscribed_at).toBeInstanceOf(Date);
    expect(result[0].email).toEqual('test@example.com');
    expect(result[0].status).toEqual('unsubscribed');
  });
});
