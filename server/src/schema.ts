
import { z } from 'zod';

// Lead schema for capturing potential customers
export const leadSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  interest_level: z.enum(['low', 'medium', 'high']),
  source: z.string(), // Where the lead came from (landing page, referral, etc.)
  utm_campaign: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Lead = z.infer<typeof leadSchema>;

// Input schema for creating leads
export const createLeadInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  interest_level: z.enum(['low', 'medium', 'high']).default('medium'),
  source: z.string().default('landing_page'),
  utm_campaign: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  notes: z.string().nullable()
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;

// Contact form schema for general inquiries
export const contactFormSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  lead_id: z.number().nullable(), // Link to lead if applicable
  created_at: z.coerce.date()
});

export type ContactForm = z.infer<typeof contactFormSchema>;

// Input schema for contact form submissions
export const createContactFormInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
  lead_id: z.number().nullable()
});

export type CreateContactFormInput = z.infer<typeof createContactFormInputSchema>;

// Newsletter subscription schema
export const newsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  status: z.enum(['active', 'unsubscribed']),
  subscribed_at: z.coerce.date(),
  unsubscribed_at: z.coerce.date().nullable()
});

export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;

// Input schema for newsletter subscriptions
export const createNewsletterSubscriptionInputSchema = z.object({
  email: z.string().email()
});

export type CreateNewsletterSubscriptionInput = z.infer<typeof createNewsletterSubscriptionInputSchema>;

// Analytics event schema for tracking user interactions
export const analyticsEventSchema = z.object({
  id: z.number(),
  event_type: z.string(), // 'page_view', 'button_click', 'form_submit', etc.
  event_data: z.string().nullable(), // JSON string with additional data
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  referrer: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  created_at: z.coerce.date()
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Input schema for tracking analytics events
export const createAnalyticsEventInputSchema = z.object({
  event_type: z.string(),
  event_data: z.string().nullable(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  referrer: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable()
});

export type CreateAnalyticsEventInput = z.infer<typeof createAnalyticsEventInputSchema>;
