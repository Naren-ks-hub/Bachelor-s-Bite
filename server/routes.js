const express = require('express');
const { dbQueries } = require('./db');

const router = express.Router();

// 1. Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BachelorBite API v1'
  });
});

// 2. Leads / Waitlist
router.post('/leads', (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid full name.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    // Check for existing lead
    const existing = dbQueries.getLeadByEmail(cleanEmail);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Welcome back! You are already on the access list.',
        lead: { id: existing.id, name: existing.name, email: existing.email }
      });
    }

    const newLead = dbQueries.createLead(cleanName, cleanEmail, cleanPhone);
    return res.status(201).json({
      success: true,
      message: 'Access granted! Welcome to BachelorBite 🎉',
      lead: newLead
    });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: 'Failed to process signup. Please try again.' });
  }
});

router.get('/leads', (req, res) => {
  try {
    const leads = dbQueries.getAllLeads();
    res.json({ count: leads.length, leads });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// 3. Recipes List & Filtering
router.get('/recipes', (req, res) => {
  try {
    let recipes = dbQueries.getAllRecipes();
    const { budget_max, time_max, cookware, category, search } = req.query;

    if (budget_max) {
      const maxBudget = Number(budget_max);
      recipes = recipes.filter(r => r.budget_inr <= maxBudget);
    }

    if (time_max) {
      const maxTime = Number(time_max);
      recipes = recipes.filter(r => r.cook_time_min <= maxTime);
    }

    if (cookware) {
      if (cookware.toLowerCase() === 'single-pan' || cookware.toLowerCase() === 'single pan') {
        recipes = recipes.filter(r => r.single_pan === true);
      }
    }

    if (category) {
      recipes = recipes.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const query = search.toLowerCase();
      recipes = recipes.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    res.json({ count: recipes.length, recipes });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Failed to fetch recipes.' });
  }
});

// 4. Recipe Details
router.get('/recipes/:idOrSlug', (req, res) => {
  try {
    const recipe = dbQueries.getRecipeByIdOrSlug(req.params.idOrSlug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }
    res.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe detail:', err);
    res.status(500).json({ error: 'Failed to fetch recipe detail.' });
  }
});

// 5. Intelligent Pantry Matching Engine
router.post('/recipes/match', (req, res) => {
  try {
    const { ingredients = [], max_budget, max_time } = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients must be an array of strings.' });
    }

    const userIngredients = ingredients.map(i => i.trim().toLowerCase());
    let recipes = dbQueries.getAllRecipes();

    // Optional filters
    if (max_budget) {
      recipes = recipes.filter(r => r.budget_inr <= Number(max_budget));
    }
    if (max_time) {
      recipes = recipes.filter(r => r.cook_time_min <= Number(max_time));
    }

    // Match Calculation
    const matchedRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients;
      const matched = [];
      const missing = [];

      for (const recipeIng of recipeIngredients) {
        const lower = recipeIng.toLowerCase();
        // Check exact or partial match
        const found = userIngredients.some(userIng =>
          lower.includes(userIng) || userIng.includes(lower)
        );

        if (found) {
          matched.push(recipeIng);
        } else {
          missing.push(recipeIng);
        }
      }

      const totalCount = recipeIngredients.length;
      let matchPercent = 0;
      if (userIngredients.length === 0) {
        // Default baseline score
        matchPercent = 80;
      } else if (totalCount > 0) {
        matchPercent = Math.round((matched.length / totalCount) * 100);
      }

      return {
        ...recipe,
        match_score: matchPercent,
        matched_ingredients: matched,
        missing_ingredients: missing
      };
    });

    // Sort by match score descending, then rating descending
    matchedRecipes.sort((a, b) => b.match_score - a.match_score || b.rating - a.rating);

    res.json({
      selected_count: userIngredients.length,
      recipes: matchedRecipes
    });
  } catch (err) {
    console.error('Error in recipe match engine:', err);
    res.status(500).json({ error: 'Failed to process ingredient matching.' });
  }
});

// 6. Curated Collections
router.get('/collections', (req, res) => {
  try {
    const collections = dbQueries.getAllCollections();
    res.json({ count: collections.length, collections });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to fetch collections.' });
  }
});

router.get('/collections/:slug/recipes', (req, res) => {
  try {
    const slug = req.params.slug;
    let category = 'quick';
    if (slug === 'broke-edition') category = 'budget';
    else if (slug === 'single-skillet-gains') category = 'protein';
    else if (slug === 'midnight-study') category = 'midnight';

    const recipes = dbQueries.getRecipesByCategory(category);
    res.json({ collection_slug: slug, count: recipes.length, recipes });
  } catch (err) {
    console.error('Error fetching collection recipes:', err);
    res.status(500).json({ error: 'Failed to fetch collection recipes.' });
  }
});

module.exports = router;
