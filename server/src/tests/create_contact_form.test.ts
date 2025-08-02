
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactFormsTable, leadsTable } from '../db/schema';
import { type CreateContactFormInput } from '../schema';
import { createContactForm } from '../handlers/create_contact_form';
import { eq } from 'drizzle-orm';

// Test input for contact form
const testInput: CreateContactFormInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'Inquiry about AI ad creation',
  message: 'I would like to know more about your AI-powered ad creation service.',
  lead_id: null
};

describe('createContactForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact form and auto-create lead', async () => {
    const result = await createContactForm(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.subject).toEqual('Inquiry about AI ad creation');
    expect(result.message).toEqual(testInput.message);
    expect(result.id).toBeDefined();
    expect(result.lead_id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify that a lead was created automatically - check lead_id is not null before using it
    if (result.lead_id !== null) {
      const lead = await db.select()
        .from(leadsTable)
        .where(eq(leadsTable.id, result.lead_id))
        .execute();

      expect(lead).toHaveLength(1);
      expect(lead[0].email).toEqual('john.doe@example.com');
      expect(lead[0].first_name).toEqual('John');
      expect(lead[0].last_name).toEqual('Doe');
      expect(lead[0].source).toEqual('contact_form');
    } else {
      throw new Error('Expected lead_id to be defined');
    }
  });

  it('should save contact form to database', async () => {
    const result = await createContactForm(testInput);

    // Query database to verify
    const contactForms = await db.select()
      .from(contactFormsTable)
      .where(eq(contactFormsTable.id, result.id))
      .execute();

    expect(contactForms).toHaveLength(1);
    expect(contactForms[0].name).toEqual('John Doe');
    expect(contactForms[0].email).toEqual('john.doe@example.com');
    expect(contactForms[0].subject).toEqual('Inquiry about AI ad creation');
    expect(contactForms[0].message).toEqual(testInput.message);
    expect(contactForms[0].lead_id).toBeDefined();
    expect(contactForms[0].created_at).toBeInstanceOf(Date);
  });

  it('should link to existing lead when email matches', async () => {
    // Create a lead first
    const leadResult = await db.insert(leadsTable)
      .values({
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Test Company',
        interest_level: 'high',
        source: 'referral'
      })
      .returning()
      .execute();

    const lead = leadResult[0];

    // Create contact form with same email
    const result = await createContactForm(testInput);

    // Should automatically link to the existing lead
    expect(result.lead_id).toEqual(lead.id);
    expect(result.email).toEqual(lead.email);

    // Verify no duplicate lead was created
    const allLeads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.email, 'john.doe@example.com'))
      .execute();

    expect(allLeads).toHaveLength(1);
  });

  it('should use provided lead_id when valid', async () => {
    // Create a lead first
    const leadResult = await db.insert(leadsTable)
      .values({
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        interest_level: 'medium',
        source: 'landing_page'
      })
      .returning()
      .execute();

    const lead = leadResult[0];

    // Create contact form with explicit lead_id
    const inputWithLeadId: CreateContactFormInput = {
      ...testInput,
      lead_id: lead.id
    };

    const result = await createContactForm(inputWithLeadId);

    expect(result.lead_id).toEqual(lead.id);
  });

  it('should reject invalid lead_id', async () => {
    const inputWithInvalidLeadId: CreateContactFormInput = {
      ...testInput,
      lead_id: 99999
    };

    await expect(createContactForm(inputWithInvalidLeadId))
      .rejects
      .toThrow(/Lead with ID 99999 does not exist/i);
  });

  it('should handle single name correctly', async () => {
    // Create contact form with single name
    const singleNameInput: CreateContactFormInput = {
      ...testInput,
      name: 'Madonna',
      email: 'madonna@example.com'
    };

    const result = await createContactForm(singleNameInput);

    expect(result.name).toEqual('Madonna');
    
    // Check the auto-created lead - ensure lead_id is not null before using it
    if (result.lead_id !== null) {
      const lead = await db.select()
        .from(leadsTable)
        .where(eq(leadsTable.id, result.lead_id))
        .execute();

      expect(lead[0].first_name).toEqual('Madonna');
      expect(lead[0].last_name).toBeNull();
    } else {
      throw new Error('Expected lead_id to be defined');
    }
  });
});
