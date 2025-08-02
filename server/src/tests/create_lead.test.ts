
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { createLead } from '../handlers/create_lead';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateLeadInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  company: 'Acme Corp',
  phone: '+1-555-0123',
  interest_level: 'high',
  source: 'landing_page',
  utm_campaign: 'summer_promo',
  utm_source: 'google',
  utm_medium: 'cpc',
  notes: 'Interested in enterprise features'
};

describe('createLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead with all fields', async () => {
    const result = await createLead(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.company).toEqual('Acme Corp');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.interest_level).toEqual('high');
    expect(result.source).toEqual('landing_page');
    expect(result.utm_campaign).toEqual('summer_promo');
    expect(result.utm_source).toEqual('google');
    expect(result.utm_medium).toEqual('cpc');
    expect(result.notes).toEqual('Interested in enterprise features');
    expect(result.status).toEqual('new');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a lead with defaults applied', async () => {
    const minimalInput: CreateLeadInput = {
      email: 'minimal@example.com',
      first_name: null,
      last_name: null,
      company: null,
      phone: null,
      interest_level: 'medium', // Default from Zod
      source: 'landing_page', // Default from Zod
      utm_campaign: null,
      utm_source: null,
      utm_medium: null,
      notes: null
    };

    const result = await createLead(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.interest_level).toEqual('medium');
    expect(result.source).toEqual('landing_page');
    expect(result.status).toEqual('new');
    expect(result.first_name).toBeNull();
    expect(result.company).toBeNull();
  });

  it('should save lead to database', async () => {
    const result = await createLead(testInput);

    // Query database to verify save
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].email).toEqual('test@example.com');
    expect(leads[0].first_name).toEqual('John');
    expect(leads[0].company).toEqual('Acme Corp');
    expect(leads[0].interest_level).toEqual('high');
    expect(leads[0].status).toEqual('new');
    expect(leads[0].created_at).toBeInstanceOf(Date);
    expect(leads[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate email constraint', async () => {
    // Create first lead
    await createLead(testInput);

    // Attempt to create duplicate - should throw error
    expect(createLead(testInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should track UTM parameters correctly', async () => {
    const utmInput: CreateLeadInput = {
      email: 'utm-test@example.com',
      first_name: 'UTM',
      last_name: 'Tester',
      company: null,
      phone: null,
      interest_level: 'low',
      source: 'google_ads',
      utm_campaign: 'black_friday_2024',
      utm_source: 'google',
      utm_medium: 'paid_search',
      notes: null
    };

    const result = await createLead(utmInput);

    expect(result.utm_campaign).toEqual('black_friday_2024');
    expect(result.utm_source).toEqual('google');
    expect(result.utm_medium).toEqual('paid_search');
    expect(result.source).toEqual('google_ads');

    // Verify in database
    const dbLead = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(dbLead[0].utm_campaign).toEqual('black_friday_2024');
    expect(dbLead[0].utm_source).toEqual('google');
    expect(dbLead[0].utm_medium).toEqual('paid_search');
  });
});
