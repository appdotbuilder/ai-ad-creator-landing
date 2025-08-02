
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { getLeads, type GetLeadsFilters } from '../handlers/get_leads';
import { eq } from 'drizzle-orm';

const testLead1: CreateLeadInput = {
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  company: 'Acme Corp',
  phone: '+1234567890',
  interest_level: 'high',
  source: 'landing_page',
  utm_campaign: 'summer_2024',
  utm_source: 'google',
  utm_medium: 'cpc',
  notes: 'Very interested in our product'
};

const testLead2: CreateLeadInput = {
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  company: 'Tech Solutions',
  phone: '+1987654321',
  interest_level: 'medium',
  source: 'referral',
  utm_campaign: null,
  utm_source: null,
  utm_medium: null,
  notes: 'Referred by existing customer'
};

const testLead3: CreateLeadInput = {
  email: 'bob@example.com',
  first_name: 'Bob',
  last_name: 'Johnson',
  company: null,
  phone: null,
  interest_level: 'low',
  source: 'social_media',
  utm_campaign: 'facebook_ads',
  utm_source: 'facebook',
  utm_medium: 'social',
  notes: null
};

describe('getLeads', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no leads exist', async () => {
    const result = await getLeads();
    expect(result).toEqual([]);
  });

  it('should return all leads when no filters applied', async () => {
    // Create test leads - insert separately to ensure different timestamps
    await db.insert(leadsTable).values(testLead1).execute();
    await new Promise(resolve => setTimeout(resolve, 5));
    
    await db.insert(leadsTable).values(testLead2).execute();
    await new Promise(resolve => setTimeout(resolve, 5));
    
    await db.insert(leadsTable).values(testLead3).execute();

    const result = await getLeads();

    expect(result).toHaveLength(3);
    // Most recent should be first (bob is inserted last)
    expect(result[0].email).toEqual('bob@example.com');
    expect(result[1].email).toEqual('jane@example.com'); 
    expect(result[2].email).toEqual('john@example.com');
    
    // Verify ordering by checking timestamps
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should filter leads by status', async () => {
    // Create leads with different statuses
    await db.insert(leadsTable).values([
      { ...testLead1 },
      { ...testLead2 }
    ]).execute();

    // Update one lead to 'contacted' status
    await db.update(leadsTable)
      .set({ status: 'contacted' })
      .where(eq(leadsTable.email, 'john@example.com'))
      .execute();

    const filters: GetLeadsFilters = { status: 'contacted' };
    const result = await getLeads(filters);

    expect(result).toHaveLength(1);
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].status).toEqual('contacted');
  });

  it('should filter leads by source', async () => {
    // Create test leads
    await db.insert(leadsTable).values([
      { ...testLead1 }, // landing_page
      { ...testLead2 }, // referral
      { ...testLead3 }  // social_media
    ]).execute();

    const filters: GetLeadsFilters = { source: 'referral' };
    const result = await getLeads(filters);

    expect(result).toHaveLength(1);
    expect(result[0].email).toEqual('jane@example.com');
    expect(result[0].source).toEqual('referral');
  });

  it('should filter leads by interest level', async () => {
    // Create test leads
    await db.insert(leadsTable).values([
      { ...testLead1 }, // high
      { ...testLead2 }, // medium
      { ...testLead3 }  // low
    ]).execute();

    const filters: GetLeadsFilters = { interest_level: 'high' };
    const result = await getLeads(filters);

    expect(result).toHaveLength(1);
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].interest_level).toEqual('high');
  });

  it('should filter leads by date range', async () => {
    // Create leads
    await db.insert(leadsTable).values([testLead1]).execute();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Test created_after filter
    const afterFilters: GetLeadsFilters = { created_after: yesterday };
    const afterResult = await getLeads(afterFilters);
    expect(afterResult).toHaveLength(1);

    // Test created_before filter
    const beforeFilters: GetLeadsFilters = { created_before: tomorrow };
    const beforeResult = await getLeads(beforeFilters);
    expect(beforeResult).toHaveLength(1);

    // Test date range that excludes all leads
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const noMatchFilters: GetLeadsFilters = { created_after: futureDate };
    const noMatchResult = await getLeads(noMatchFilters);
    expect(noMatchResult).toHaveLength(0);
  });

  it('should apply multiple filters together', async () => {
    // Create test leads
    await db.insert(leadsTable).values([
      { ...testLead1 }, // high interest, landing_page
      { ...testLead2 }, // medium interest, referral
      { ...testLead3 }  // low interest, social_media
    ]).execute();

    const filters: GetLeadsFilters = {
      interest_level: 'high',
      source: 'landing_page'
    };
    const result = await getLeads(filters);

    expect(result).toHaveLength(1);
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].interest_level).toEqual('high');
    expect(result[0].source).toEqual('landing_page');
  });

  it('should return leads ordered by creation date (newest first)', async () => {
    // Create leads with slight delay to ensure different timestamps
    await db.insert(leadsTable).values([testLead1]).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(leadsTable).values([testLead2]).execute();

    const result = await getLeads();

    expect(result).toHaveLength(2);
    expect(result[0].email).toEqual('jane@example.com'); // Newer
    expect(result[1].email).toEqual('john@example.com'); // Older
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle leads with all field types correctly', async () => {
    await db.insert(leadsTable).values([testLead1]).execute();

    const result = await getLeads();

    expect(result).toHaveLength(1);
    const lead = result[0];

    // Required fields
    expect(lead.id).toBeDefined();
    expect(lead.email).toEqual('john@example.com');
    expect(lead.interest_level).toEqual('high');
    expect(lead.source).toEqual('landing_page');
    expect(lead.status).toEqual('new'); // Default value
    expect(lead.created_at).toBeInstanceOf(Date);
    expect(lead.updated_at).toBeInstanceOf(Date);

    // Optional text fields
    expect(lead.first_name).toEqual('John');
    expect(lead.last_name).toEqual('Doe');
    expect(lead.company).toEqual('Acme Corp');
    expect(lead.phone).toEqual('+1234567890');
    expect(lead.utm_campaign).toEqual('summer_2024');
    expect(lead.utm_source).toEqual('google');
    expect(lead.utm_medium).toEqual('cpc');
    expect(lead.notes).toEqual('Very interested in our product');
  });
});
