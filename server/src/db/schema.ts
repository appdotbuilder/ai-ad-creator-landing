
import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const interestLevelEnum = pgEnum('interest_level', ['low', 'medium', 'high']);
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'converted', 'lost']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'unsubscribed']);

// Leads table - primary entity for capturing potential customers
export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name'),
  last_name: text('last_name'),
  company: text('company'),
  phone: text('phone'),
  interest_level: interestLevelEnum('interest_level').notNull().default('medium'),
  source: text('source').notNull().default('landing_page'),
  utm_campaign: text('utm_campaign'),
  utm_source: text('utm_source'),
  utm_medium: text('utm_medium'),
  notes: text('notes'),
  status: leadStatusEnum('status').notNull().default('new'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Contact forms table - for general inquiries and support requests
export const contactFormsTable = pgTable('contact_forms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  lead_id: serial('lead_id').references(() => leadsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Newsletter subscriptions table - for email marketing
export const newsletterSubscriptionsTable = pgTable('newsletter_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  subscribed_at: timestamp('subscribed_at').defaultNow().notNull(),
  unsubscribed_at: timestamp('unsubscribed_at'),
});

// Analytics events table - for tracking user behavior
export const analyticsEventsTable = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  event_type: text('event_type').notNull(),
  event_data: text('event_data'),
  user_agent: text('user_agent'),
  ip_address: text('ip_address'),
  referrer: text('referrer'),
  utm_campaign: text('utm_campaign'),
  utm_source: text('utm_source'),
  utm_medium: text('utm_medium'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const leadsRelations = relations(leadsTable, ({ many }) => ({
  contactForms: many(contactFormsTable),
}));

export const contactFormsRelations = relations(contactFormsTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [contactFormsTable.lead_id],
    references: [leadsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;
export type ContactForm = typeof contactFormsTable.$inferSelect;
export type NewContactForm = typeof contactFormsTable.$inferInsert;
export type NewsletterSubscription = typeof newsletterSubscriptionsTable.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscriptionsTable.$inferInsert;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEventsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  leads: leadsTable,
  contactForms: contactFormsTable,
  newsletterSubscriptions: newsletterSubscriptionsTable,
  analyticsEvents: analyticsEventsTable,
};
