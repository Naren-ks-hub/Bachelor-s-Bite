/**
 * BachelorBite - Active Expiry Tracking & Date Calculation Utility
 * Compares ingredient expiry dates against the current date and assigns dynamic tiers.
 */

/**
 * Calculates the exact number of days remaining until an item's expiry date.
 * Categorizes the item into three dynamic status tiers:
 *   - Expired: <= 0 days (Red warning badge)
 *   - Expiring Soon: 1 to 3 days (Yellow warning badge/alert)
 *   - Fresh: > 3 days (Standard safe badge)
 *
 * @param {string|Date} expiryDate - Expiry date string (YYYY-MM-DD) or Date object
 * @returns {{
 *   days: number,
 *   status: 'expired' | 'expiring-soon' | 'fresh',
 *   label: string,
 *   badgeClass: string,
 *   isUrgent: boolean
 * }}
 */
export function calculateDaysUntilExpiry(expiryDate) {
  if (!expiryDate) {
    return {
      days: 999,
      status: 'fresh',
      label: 'Fresh',
      badgeClass: 'expiry-badge-fresh',
      isUrgent: false
    };
  }

  // Normalize current date to midnight local time for strict calendar day comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(expiryDate);
  targetDate.setHours(0, 0, 0, 0);

  // Difference in milliseconds converted to whole calendar days
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      days: diffDays,
      status: 'expired',
      label: diffDays === 0 ? 'Expires Today!' : `Expired (${Math.abs(diffDays)}d ago)`,
      badgeClass: 'expiry-badge-expired',
      isUrgent: true // Urgent rescue needed
    };
  } else if (diffDays <= 3) {
    return {
      days: diffDays,
      status: 'expiring-soon',
      label: diffDays === 1 ? 'Expires Tomorrow!' : `Expires in ${diffDays} days`,
      badgeClass: 'expiry-badge-warning',
      isUrgent: diffDays <= 2 // <= 2 days receives recommendation priority score boost
    };
  } else {
    return {
      days: diffDays,
      status: 'fresh',
      label: `Fresh (${diffDays}d left)`,
      badgeClass: 'expiry-badge-fresh',
      isUrgent: false
    };
  }
}

/**
 * Sorts pantry items automatically so items closest to expiration appear at the top.
 * Items with negative or 0 days (expired) appear first, followed by 1, 2, 3... days.
 *
 * @param {Array<{ expiryDate: string }>} items
 * @returns {Array} Sorted copy of items
 */
export function sortPantryByExpiry(items) {
  return [...items].sort((a, b) => {
    const aCalc = calculateDaysUntilExpiry(a.expiryDate);
    const bCalc = calculateDaysUntilExpiry(b.expiryDate);
    return aCalc.days - bCalc.days;
  });
}

/**
 * Filters pantry items that have an expiry status of <= 2 days (urgent waste alert).
 *
 * @param {Array<{ name: string, expiryDate: string }>} items
 * @returns {Array<string>} Lowercase names of expiring ingredients
 */
export function getUrgentExpiringIngredients(items) {
  return items
    .filter(item => {
      const { days } = calculateDaysUntilExpiry(item.expiryDate);
      return days <= 2;
    })
    .map(item => item.name.trim().toLowerCase());
}

/**
 * Evaluates a list of recipes and applies a priority score boost (+25 points)
 * to recipes utilizing any ingredient with an expiry status of <= 2 days.
 *
 * @param {Array} recipes - Recipe objects
 * @param {Array<string>} expiringIngredients - Urgent expiring ingredient names
 * @returns {Array} Boosted and sorted recipes
 */
export function applyExpiryRecommendationBoost(recipes, expiringIngredients = []) {
  if (!expiringIngredients.length) return recipes;

  const normalizedExpiring = expiringIngredients.map(i => i.toLowerCase());

  const scored = recipes.map(recipe => {
    const ingredients = recipe.ingredients || [];
    const matchedExpiring = [];

    for (const ing of ingredients) {
      const ingLower = String(ing).toLowerCase();
      const match = normalizedExpiring.find(exp => ingLower.includes(exp) || exp.includes(ingLower));
      if (match && !matchedExpiring.includes(ing)) {
        matchedExpiring.push(ing);
      }
    }

    const usesExpiring = matchedExpiring.length > 0;
    const baseScore = recipe.match_score || 80;
    // Boost priority score by +25 points (capped at 100)
    const boostedScore = usesExpiring ? Math.min(100, baseScore + 25) : baseScore;

    return {
      ...recipe,
      match_score: boostedScore,
      raw_match_score: baseScore,
      uses_expiring_boost: usesExpiring,
      expiring_matched: matchedExpiring
    };
  });

  // Sort so boosted recipes appear first, followed by highest match score & rating
  return scored.sort((a, b) => {
    const aBoost = a.uses_expiring_boost ? 1 : 0;
    const bBoost = b.uses_expiring_boost ? 1 : 0;
    if (bBoost !== aBoost) return bBoost - aBoost;
    return (b.match_score || 0) - (a.match_score || 0) || (b.rating || 0) - (a.rating || 0);
  });
}
