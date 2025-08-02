
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsletterSubscriptionsTable } from '../db/schema';
import { type CreateNewsletterSubscriptionInput } from '../schema';
import { createNewsletterSubscription } from '../handlers/create_newsletter_subscription';
import { eq } from 'drizzle-orm';

const testInput: CreateNewsletterSubscriptionInput = {
  email: 'test@example.com'
};

describe('createNewsletterSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new newsletter subscription', async () => {
    const result = await createNewsletterSubscription(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.subscribed_at).toBeInstanceOf(Date);
    expect(result.unsubscribed_at).toBeNull();
  });

  it('should save subscription to database', async () => {
    const result = await createNewsletterSubscription(testInput);

    const subscriptions = await db.select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].email).toEqual('test@example.com');
    expect(subscriptions[0].status).toEqual('active');
    expect(subscriptions[0].subscribed_at).toBeInstanceOf(Date);
  });

  it('should return existing subscription if email already active', async () => {
    // Create initial subscription
    const first = await createNewsletterSubscription(testInput);
    
    // Try to subscribe again with same email
    const second = await createNewsletterSubscription(testInput);

    // Should return the same subscription
    expect(second.id).toEqual(first.id);
    expect(second.email).toEqual(first.email);
    expect(second.status).toEqual('active');

    // Verify only one record exists in database
    const allSubscriptions = await db.select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, testInput.email))
      .execute();

    expect(allSubscriptions).toHaveLength(1);
  });

  it('should reactivate unsubscribed email', async () => {
    // Create initial subscription
    const initial = await createNewsletterSubscription(testInput);

    // Manually mark as unsubscribed
    await db.update(newsletterSubscriptionsTable)
      .set({
        status: 'unsubscribed',
        unsubscribed_at: new Date()
      })
      .where(eq(newsletterSubscriptionsTable.id, initial.id))
      .execute();

    // Try to subscribe again
    const reactivated = await createNewsletterSubscription(testInput);

    // Should reactivate the same record
    expect(reactivated.id).toEqual(initial.id);
    expect(reactivated.email).toEqual(testInput.email);
    expect(reactivated.status).toEqual('active');
    expect(reactivated.subscribed_at).toBeInstanceOf(Date);
    expect(reactivated.unsubscribed_at).toBeNull();

    // Verify subscribed_at was updated
    expect(reactivated.subscribed_at.getTime()).toBeGreaterThan(initial.subscribed_at.getTime());

    // Verify only one record exists
    const allSubscriptions = await db.select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, testInput.email))
      .execute();

    expect(allSubscriptions).toHaveLength(1);
    expect(allSubscriptions[0].status).toEqual('active');
  });

  it('should handle different email addresses independently', async () => {
    const email1 = { email: 'user1@example.com' };
    const email2 = { email: 'user2@example.com' };

    const sub1 = await createNewsletterSubscription(email1);
    const sub2 = await createNewsletterSubscription(email2);

    expect(sub1.id).not.toEqual(sub2.id);
    expect(sub1.email).toEqual('user1@example.com');
    expect(sub2.email).toEqual('user2@example.com');
    expect(sub1.status).toEqual('active');
    expect(sub2.status).toEqual('active');

    // Verify both records exist
    const allSubscriptions = await db.select()
      .from(newsletterSubscriptionsTable)
      .execute();

    expect(allSubscriptions).toHaveLength(2);
  });
});
