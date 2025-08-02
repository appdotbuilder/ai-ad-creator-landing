
import { db } from '../db';
import { newsletterSubscriptionsTable } from '../db/schema';
import { type NewsletterSubscription } from '../schema';

export const getNewsletterSubscriptions = async (): Promise<NewsletterSubscription[]> => {
  try {
    const results = await db.select()
      .from(newsletterSubscriptionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Newsletter subscriptions fetch failed:', error);
    throw error;
  }
};
