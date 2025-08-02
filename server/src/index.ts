
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createLeadInputSchema, 
  createContactFormInputSchema,
  createNewsletterSubscriptionInputSchema,
  createAnalyticsEventInputSchema
} from './schema';

// Import handlers
import { createLead } from './handlers/create_lead';
import { getLeads } from './handlers/get_leads';
import { createContactForm } from './handlers/create_contact_form';
import { createNewsletterSubscription } from './handlers/create_newsletter_subscription';
import { createAnalyticsEvent } from './handlers/create_analytics_event';
import { getNewsletterSubscriptions } from './handlers/get_newsletter_subscriptions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Lead management routes
  createLead: publicProcedure
    .input(createLeadInputSchema)
    .mutation(({ input }) => createLead(input)),
  
  getLeads: publicProcedure
    .query(() => getLeads()),
  
  // Contact form routes
  createContactForm: publicProcedure
    .input(createContactFormInputSchema)
    .mutation(({ input }) => createContactForm(input)),
  
  // Newsletter subscription routes
  createNewsletterSubscription: publicProcedure
    .input(createNewsletterSubscriptionInputSchema)
    .mutation(({ input }) => createNewsletterSubscription(input)),
  
  getNewsletterSubscriptions: publicProcedure
    .query(() => getNewsletterSubscriptions()),
  
  // Analytics tracking routes
  createAnalyticsEvent: publicProcedure
    .input(createAnalyticsEventInputSchema)
    .mutation(({ input }) => createAnalyticsEvent(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
