
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput, type Lead } from '../schema';

export const createLead = async (input: CreateLeadInput): Promise<Lead> => {
  try {
    // Insert lead record
    const result = await db.insert(leadsTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        company: input.company,
        phone: input.phone,
        interest_level: input.interest_level,
        source: input.source,
        utm_campaign: input.utm_campaign,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        notes: input.notes,
        status: 'new'
      })
      .returning()
      .execute();

    const lead = result[0];
    return lead;
  } catch (error) {
    console.error('Lead creation failed:', error);
    throw error;
  }
};
