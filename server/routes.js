const express = require('express');
const crypto = require('crypto');
const { dbQueries } = require('./db');
const { isTiDBConfigured, getConnectionStatus } = require('./tidb');

const router = express.Router();

// Helper to hash passwords using built-in crypto
function hashPassword(password) {
  const salt = 'bachelor_bite_salt_2026';
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function verifyPassword(password, storedHash) {
  const hash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// 1. Health Check & Database Status
router.get('/health', (req, res) => {
  const tidbStatus = getConnectionStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BachelorBite API v1',
    database: {
      provider: tidbStatus.configured ? 'TiDB Cloud' : 'SQLite (Local Fallback)',
      tidbConfigured: tidbStatus.configured,
      connected: tidbStatus.connected
    }
  });
});

router.get('/database/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    ...getConnectionStatus()
  });
});

// 2. Native User Authentication (Replaces Firebase Auth)
router.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : '';

    // Check if user already exists
    const existing = await dbQueries.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const passwordHash = hashPassword(password);
    const newUser = await dbQueries.createUser(cleanName, cleanEmail, passwordHash, cleanPhone);

    // Also register as lead for outreach/tiffin notifications
    try {
      const existingLead = await dbQueries.getLeadByEmail(cleanEmail);
      if (!existingLead) {
        await dbQueries.createLead(cleanName, cleanEmail, cleanPhone || '9999999999');
      }
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to BachelorBite 🎉',
      user: {
        id: newUser.id,
        displayName: cleanName,
        email: cleanEmail,
        phone: cleanPhone
      }
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dbQueries.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please sign up.' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully! 🍳',
      user: {
        id: user.id,
        displayName: user.name || cleanEmail.split('@')[0],
        email: user.email,
        phone: user.phone || ''
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// 3. Leads / Waitlist
router.post('/leads', async (req, res) => {
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
    const existing = await dbQueries.getLeadByEmail(cleanEmail);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Welcome back! You are already on the access list.',
        lead: { id: existing.id, name: existing.name, email: existing.email }
      });
    }

    const newLead = await dbQueries.createLead(cleanName, cleanEmail, cleanPhone);
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

router.get('/leads', async (req, res) => {
  try {
    const leads = await dbQueries.getAllLeads();
    res.json({ count: leads.length, leads });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// 4. Recipes List & Filtering
router.get('/recipes', async (req, res) => {
  try {
    let recipes = await dbQueries.getAllRecipes();
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
        (Array.isArray(r.ingredients) && r.ingredients.some(ing => ing.toLowerCase().includes(query)))
      );
    }

    res.json({ count: recipes.length, recipes });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Failed to fetch recipes.' });
  }
});

// 5. Recipe Details
router.get('/recipes/:idOrSlug', async (req, res) => {
  try {
    const recipe = await dbQueries.getRecipeByIdOrSlug(req.params.idOrSlug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }
    res.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe detail:', err);
    res.status(500).json({ error: 'Failed to fetch recipe detail.' });
  }
});

// 6. Intelligent Pantry Matching Engine
router.post('/recipes/match', async (req, res) => {
  try {
    const { ingredients = [], expiring_ingredients = [], max_budget, max_time } = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients must be an array of strings.' });
    }

    const userIngredients = ingredients.map(i => i.trim().toLowerCase());
    const expiringList = Array.isArray(expiring_ingredients) ? expiring_ingredients.map(i => String(i).trim().toLowerCase()).filter(Boolean) : [];
    let recipes = await dbQueries.getAllRecipes();

    // Optional filters
    if (max_budget) {
      recipes = recipes.filter(r => r.budget_inr <= Number(max_budget));
    }
    if (max_time) {
      recipes = recipes.filter(r => r.cook_time_min <= Number(max_time));
    }

    // Match Calculation with Active Expiry Prioritization
    const matchedRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      const matched = [];
      const missing = [];
      const matchedExpiring = [];

      for (const recipeIng of recipeIngredients) {
        const lower = String(recipeIng).toLowerCase();
        const found = userIngredients.some(userIng =>
          lower.includes(userIng) || userIng.includes(lower)
        );

        if (found) {
          matched.push(recipeIng);
        } else {
          missing.push(recipeIng);
        }

        // Check if ingredient is among urgent expiring ingredients (<= 2 days)
        const isExpiring = expiringList.some(exp =>
          lower.includes(exp) || exp.includes(lower)
        );
        if (isExpiring && !matchedExpiring.includes(recipeIng)) {
          matchedExpiring.push(recipeIng);
        }
      }

      const totalCount = recipeIngredients.length;
      let matchPercent = 0;
      if (userIngredients.length === 0) {
        matchPercent = 80;
      } else if (totalCount > 0) {
        matchPercent = Math.round((matched.length / totalCount) * 100);
      }

      // Priority boost for recipes utilizing expiring ingredients (<= 2 days)
      const usesExpiring = matchedExpiring.length > 0;
      let boostedScore = matchPercent;
      if (usesExpiring) {
        boostedScore = Math.min(100, matchPercent + 25);
      }

      return {
        ...recipe,
        match_score: boostedScore,
        raw_match_score: matchPercent,
        matched_ingredients: matched,
        missing_ingredients: missing,
        expiring_matched: matchedExpiring,
        uses_expiring_boost: usesExpiring
      };
    });

    // Sort by expiring boost first, then match score descending, then rating descending
    matchedRecipes.sort((a, b) => {
      const aBoost = a.uses_expiring_boost ? 1 : 0;
      const bBoost = b.uses_expiring_boost ? 1 : 0;
      if (bBoost !== aBoost) {
        return bBoost - aBoost;
      }
      return b.match_score - a.match_score || b.rating - a.rating;
    });

    res.json({
      selected_count: userIngredients.length,
      expiring_count: expiringList.length,
      recipes: matchedRecipes
    });
  } catch (err) {
    console.error('Error in recipe match engine:', err);
    res.status(500).json({ error: 'Failed to process ingredient matching.' });
  }
});

// 7. Curated Collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await dbQueries.getAllCollections();
    res.json({ count: collections.length, collections });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to fetch collections.' });
  }
});

router.get('/collections/:slug/recipes', async (req, res) => {
  try {
    const slug = req.params.slug;
    let category = 'quick';
    if (slug === 'broke-edition') category = 'budget';
    else if (slug === 'single-skillet-gains') category = 'protein';
    else if (slug === 'midnight-study') category = 'midnight';

    const recipes = await dbQueries.getRecipesByCategory(category);
    res.json({ collection_slug: slug, count: recipes.length, recipes });
  } catch (err) {
    console.error('Error fetching collection recipes:', err);
    res.status(500).json({ error: 'Failed to fetch collection recipes.' });
  }
});

module.exports = router;
