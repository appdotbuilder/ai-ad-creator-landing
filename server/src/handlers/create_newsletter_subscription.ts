
import { db } from '../db';
import { newsletterSubscriptionsTable } from '../db/schema';
import { type CreateNewsletterSubscriptionInput, type NewsletterSubscription } from '../schema';
import { eq } from 'drizzle-orm';

export const createNewsletterSubscription = async (input: CreateNewsletterSubscriptionInput): Promise<NewsletterSubscription> => {
  try {
    // Check if email already exists
    const existingSubscription = await db.select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, input.email))
      .execute();

    if (existingSubscription.length > 0) {
      const existing = existingSubscription[0];
      
      // If already active, return existing subscription
      if (existing.status === 'active') {
        return existing;
      }
      
      // If unsubscribed, reactivate the subscription
      if (existing.status === 'unsubscribed') {
        const reactivated = await db.update(newsletterSubscriptionsTable)
          .set({
            status: 'active',
            subscribed_at: new Date(),
            unsubscribed_at: null
          })
          .where(eq(newsletterSubscriptionsTable.id, existing.id))
          .returning()
          .execute();
        
        return reactivated[0];
      }
    }

    // Create new subscription
    const result = await db.insert(newsletterSubscriptionsTable)
      .values({
        email: input.email,
        status: 'active'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Newsletter subscription creation failed:', error);
    throw error;
  }
};
