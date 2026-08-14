import { Router } from 'express';
const router = Router();
import console from 'console';
import { asc, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { categoryPresentations } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

// Get all category presentations
router.get('/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db
      .select({
        id: categoryPresentations.id,
        category: categoryPresentations.category,
        name: categoryPresentations.name,
        age_group: categoryPresentations.ageGroup,
        display_order: categoryPresentations.displayOrder,
        notes: categoryPresentations.notes,
        created_at: categoryPresentations.createdAt,
      })
      .from(categoryPresentations)
      .orderBy(
        asc(categoryPresentations.ageGroup),
        asc(categoryPresentations.category),
        asc(categoryPresentations.displayOrder)
      );
    res.json(result);
  } catch (error) {
    console.error('Error fetching category presentations:', error);
    res.status(500).json({ error: 'Failed to fetch category presentations' });
  }
});

// Get presentations by category
router.get('/categories/category/:category', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { category } = req.params;

    const result = await db
      .select({
        id: categoryPresentations.id,
        category: categoryPresentations.category,
        name: categoryPresentations.name,
        age_group: categoryPresentations.ageGroup,
        display_order: categoryPresentations.displayOrder,
        notes: categoryPresentations.notes,
        created_at: categoryPresentations.createdAt,
      })
      .from(categoryPresentations)
      .where(eq(categoryPresentations.category, category))
      .orderBy(asc(categoryPresentations.ageGroup), asc(categoryPresentations.displayOrder));
    res.json(result);
  } catch (error) {
    console.error('Error fetching presentations by category:', error);
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
});

// Get all unique categories
router.get('/categories/list/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db
      .selectDistinct({ category: categoryPresentations.category })
      .from(categoryPresentations)
      .orderBy(asc(categoryPresentations.category));
    res.json(result.map((row) => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
