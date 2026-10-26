import React, { useState, useMemo } from 'react';
import ActiveExpiryPantry from './components/ActiveExpiryPantry';
import DietaryFilterBar from './components/DietaryFilterBar';
import RecipeCard from './components/RecipeCard';

// Sample Dataset with NUTRITION attributes (calories, protein, isVeg)
const INITIAL_RECIPES = [
  {
    slug: 'garlic-butter-chili-noodles',
    title: 'Garlic Butter Chili Noodles',
    badge: '🍜 Noodles',
    cook_time_min: 10,
    budget_inr: 45,
    difficulty: 'Easy',
    rating: 4.8,
    image: 'images/recipe_noodles.jpg',
    description: 'Instant noodles elevated with charred garlic, melted butter, and soy glaze in one pan.',
    ingredients: ['Pasta', 'Garlic', 'Butter', 'Soy Sauce', 'Chili Flakes'],
    isVeg: true,
    protein: 11,
    calories: 380,
    fiber_g: 4,
    single_pan: true
  },
  {
    slug: 'crispy-egg-cheese-toast-fold',
    title: 'Crispy Egg & Cheese Toast Fold',
    badge: '🍳 Quick Bite',
    cook_time_min: 8,
    budget_inr: 40,
    difficulty: 'Easy',
    rating: 4.9,
    image: 'images/recipe_egg_toast.jpg',
    description: 'Folded one-pan toast with crispy buttered edges, fluffy eggs, and molten cheese.',
    ingredients: ['Eggs', 'Bread', 'Cheese', 'Butter'],
    isVeg: false,
    protein: 22,
    calories: 410,
    fiber_g: 3,
    single_pan: true
  },
  {
    slug: 'high-protein-chicken-skillet',
    title: 'High Protein Garlic Herb Chicken Skillet',
    badge: '💪 Protein',
    cook_time_min: 14,
    budget_inr: 110,
    difficulty: 'Easy',
    rating: 4.9,
    image: 'images/collection_protein.jpg',
    description: 'Juicy seared chicken breast cubes tossed with garlic, butter, and black pepper.',
    ingredients: ['Chicken', 'Garlic', 'Butter', 'Vegetables', 'Black Pepper'],
    isVeg: false,
    protein: 34,
    calories: 420,
    fiber_g: 3,
    single_pan: true
  },
  {
    slug: 'midnight-garlic-cheese-melt',
    title: 'Midnight Garlic & Cheese Pan Melt',
    badge: '🌙 Midnight',
    cook_time_min: 7,
    budget_inr: 40,
    difficulty: 'Easy',
    rating: 4.9,
    image: 'images/collection_midnight.jpg',
    description: 'Silent, gooey midnight comfort snack made in minutes with bread, garlic butter, and cheese.',
    ingredients: ['Bread', 'Cheese', 'Garlic', 'Butter'],
    isVeg: true,
    protein: 14,
    calories: 370,
    fiber_g: 4,
    single_pan: true
  },
  {
    slug: 'crispy-chickpea-veggie-skillet',
    title: 'Crispy Spiced Chickpea & Veggie Bowl',
    badge: '🌾 Fiber',
    cook_time_min: 12,
    budget_inr: 50,
    difficulty: 'Easy',
    rating: 4.8,
    image: 'images/collection_fiber.jpg',
    description: 'Crunchy golden pan-fried chickpeas and tender vegetables seasoned with chili flakes.',
    ingredients: ['Chickpeas / Beans', 'Vegetables', 'Garlic', 'Butter'],
    isVeg: true,
    protein: 16,
    calories: 370,
    fiber_g: 10,
    single_pan: true
  }
];

export default function App() {
  // 1. Dietary & Health Filter State Management
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isHighProtein, setIsHighProtein] = useState(false);

  // Expiry tracking state
  const [expiringIngredients, setExpiringIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (slug) => {
    setFavorites(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  // 2. Recipe Filtering & Scoring Logic
  const filteredAndRankedRecipes = useMemo(() => {
    let list = [...INITIAL_RECIPES];

    // HARD FILTER: If isVegOnly is TRUE, exclude all non-veg recipes immediately
    if (isVegOnly) {
      list = list.filter(recipe => recipe.isVeg === true);
    }

    // SOFT BOOST: If isHighProtein is TRUE, boost display score for recipes with 20g+ protein
    list = list.map(recipe => {
      const isProteinRich = recipe.protein >= 20;
      let score = 85;

      // Active Expiry rescue boost
      const hasExpiringMatch = expiringIngredients.some(exp =>
        recipe.ingredients.some(ing => ing.toLowerCase().includes(exp.toLowerCase()))
      );

      if (hasExpiringMatch) score += 20;
      if (isHighProtein && isProteinRich) score += 20;

      return {
        ...recipe,
        match_score: Math.min(100, score),
        is_high_protein: isProteinRich,
        uses_expiring_boost: hasExpiringMatch,
        expiring_matched: hasExpiringMatch ? expiringIngredients : []
      };
    });

    // Sorting: Expiring boost first, then High Protein priority if toggled, then match score
    return list.sort((a, b) => {
      const aExp = a.uses_expiring_boost ? 1 : 0;
      const bExp = b.uses_expiring_boost ? 1 : 0;
      if (bExp !== aExp) return bExp - aExp;

      if (isHighProtein) {
        const aProt = a.is_high_protein ? 1 : 0;
        const bProt = b.is_high_protein ? 1 : 0;
        if (bProt !== aProt) return bProt - aProt;
      }

      return (b.match_score || 0) - (a.match_score || 0);
    });
  }, [isVegOnly, isHighProtein, expiringIngredients]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>🍳 BachelorBite</h1>
        <p style={{ color: '#64748b' }}>Solo Cooking Made Simple - Active Expiry, Health Filters & Nutrition</p>
      </header>

      {/* Active Expiry Tracker */}
      <ActiveExpiryPantry
        onExpiringChange={setExpiringIngredients}
        onSelectedIngredientsChange={setSelectedIngredients}
      />

      {/* Health & Nutrition Filter Bar Controls */}
      <DietaryFilterBar
        isVegOnly={isVegOnly}
        isHighProtein={isHighProtein}
        onToggleVegOnly={() => setIsVegOnly(prev => !prev)}
        onToggleHighProtein={() => setIsHighProtein(prev => !prev)}
      />

      {/* Recipe Cards Grid */}
      <section style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Showing {filteredAndRankedRecipes.length} Recipes
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {isVegOnly ? '🥗 Veg Only Filter Active • ' : ''}
            {isHighProtein ? '💪 High Protein Priority Boost Active' : 'Sorted by match score'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredAndRankedRecipes.map(recipe => (
            <RecipeCard
              key={recipe.slug}
              recipe={recipe}
              isFavorite={favorites.includes(recipe.slug)}
              onToggleFavorite={toggleFavorite}
              onOpenModal={(slug) => alert(`Opening modal for ${slug}`)}
              onStartCook={(slug) => alert(`Starting cook mode for ${slug}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
