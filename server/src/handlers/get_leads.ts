
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type Lead } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export interface GetLeadsFilters {
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  interest_level?: 'low' | 'medium' | 'high';
  created_after?: Date;
  created_before?: Date;
}

export const getLeads = async (filters?: GetLeadsFilters): Promise<Lead[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.status) {
      conditions.push(eq(leadsTable.status, filters.status));
    }

    if (filters?.source) {
      conditions.push(eq(leadsTable.source, filters.source));
    }

    if (filters?.interest_level) {
      conditions.push(eq(leadsTable.interest_level, filters.interest_level));
    }

    if (filters?.created_after) {
      conditions.push(gte(leadsTable.created_at, filters.created_after));
    }

    if (filters?.created_before) {
      conditions.push(lte(leadsTable.created_at, filters.created_before));
    }

    // Build query with all modifiers at once to maintain type consistency
    const results = await db.select()
      .from(leadsTable)
      .where(conditions.length === 0 ? undefined : 
        conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(leadsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    throw error;
  }
};
