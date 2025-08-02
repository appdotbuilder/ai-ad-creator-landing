
import { db } from '../db';
import { contactFormsTable, leadsTable } from '../db/schema';
import { type CreateContactFormInput, type ContactForm } from '../schema';
import { eq } from 'drizzle-orm';

export const createContactForm = async (input: CreateContactFormInput): Promise<ContactForm> => {
  try {
    let leadId: number;

    // If lead_id is explicitly provided, validate it exists
    if (input.lead_id !== null && input.lead_id !== undefined) {
      const leadExists = await db.select()
        .from(leadsTable)
        .where(eq(leadsTable.id, input.lead_id))
        .limit(1)
        .execute();

      if (leadExists.length === 0) {
        throw new Error(`Lead with ID ${input.lead_id} does not exist`);
      }
      leadId = input.lead_id;
    } else {
      // Try to find existing lead by email
      const existingLeads = await db.select()
        .from(leadsTable)
        .where(eq(leadsTable.email, input.email))
        .limit(1)
        .execute();

      if (existingLeads.length > 0) {
        leadId = existingLeads[0].id;
      } else {
        // Create a new lead for this contact form since schema requires valid lead_id
        const newLead = await db.insert(leadsTable)
          .values({
            email: input.email,
            first_name: input.name.split(' ')[0] || input.name,
            last_name: input.name.split(' ').slice(1).join(' ') || null,
            interest_level: 'medium',
            source: 'contact_form',
            status: 'new'
          })
          .returning()
          .execute();

        leadId = newLead[0].id;
      }
    }

    // Insert contact form record
    const result = await db.insert(contactFormsTable)
      .values({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        lead_id: leadId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact form creation failed:', error);
    throw error;
  }
};
