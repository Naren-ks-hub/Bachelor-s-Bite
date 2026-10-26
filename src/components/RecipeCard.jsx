import React from 'react';
import './DietaryHealth.css';

/**
 * RecipeCard Component
 *
 * Displays rich recipe details including:
 * - Direct compact nutritional tags alongside Price & Time:
 *   * Veg/Non-Veg dot indicator badge
 *   * Price ("₹45") & Time ("12m")
 *   * Calorie Tag ("🔥 420 kcal")
 *   * Protein Tag ("💪 34g Protein")
 * - Macro chips (Calories, Protein, Fiber, Pan)
 * - Waste prevention rescue tag
 */
export default function RecipeCard({
  recipe,
  onOpenModal,
  onStartCook,
  onToggleFavorite,
  isFavorite = false
}) {
  const nut = recipe.nutrition || {};
  const calories = recipe.calories || nut.calories || 380;
  const protein = recipe.protein || nut.protein_g || 14;
  const fiber = recipe.fiber_g || nut.fiber_g || 4;
  const isVeg = recipe.isVeg !== undefined ? recipe.isVeg : (recipe.is_veg !== undefined ? recipe.is_veg : true);

  return (
    <div className="recipe-card-box">
      {/* Top Banner Image with Cook Time & Favorite Button */}
      <div className="recipe-thumb-container">
        <img src={recipe.image} alt={recipe.title} loading="lazy" />
        <span className="recipe-category-pill">{recipe.badge}</span>
        <button
          type="button"
          className={`favorite-heart-button ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(recipe.slug);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="recipe-info-content">
        {/* Compact Nutritional Tags Directly Alongside Price & Time */}
        <div className="nutritional-meta-row">
          {/* Veg / Non-Veg Indicator Symbol Tag */}
          <span
            className={`food-type-tag ${isVeg ? 'veg-type' : 'non-veg-type'}`}
            title={isVeg ? '100% Pure Vegetarian' : 'Contains Non-Vegetarian Ingredients (Chicken/Egg)'}
          >
            <span className="food-symbol-square">
              <span className="food-symbol-circle"></span>
            </span>
            <span className="food-type-text">{isVeg ? 'Veg' : 'Non-Veg'}</span>
          </span>

          {/* Price Indicator */}
          <span className="meta-compact-badge price-badge">₹{recipe.budget_inr}</span>

          {/* Time Indicator */}
          <span className="meta-compact-badge time-badge">⏱️ {recipe.cook_time_min}m</span>

          {/* Calorie Tag */}
          <span className="meta-compact-badge calorie-badge">🔥 {calories} kcal</span>

          {/* Protein Tag */}
          <span className={`meta-compact-badge protein-badge ${protein >= 20 ? 'high-protein' : ''}`}>
            💪 {protein}g Protein
          </span>
        </div>

        {/* Recipe Title & Short Description */}
        <h3 className="recipe-headline">{recipe.title}</h3>
        <p className="recipe-summary-text">{recipe.description}</p>

        {/* Full Nutritional Macro Chips */}
        <div className="nutrition-macro-chips">
          <span className="nutri-chip">🔥 {calories} kcal</span>
          <span className="nutri-chip">💪 {protein}g Protein</span>
          <span className="nutri-chip">🌾 {fiber}g Fiber</span>
          <span className="nutri-chip">🍳 {recipe.single_pan ? '1 Pan' : 'Standard'}</span>
        </div>

        {/* Zero-Waste Expiring Rescue Pill */}
        {recipe.uses_expiring_boost && recipe.expiring_matched && recipe.expiring_matched.length > 0 && (
          <div className="expiry-rescue-pill" title="Prioritized recipe to prevent ingredient waste">
            <span className="expiry-pill-icon">💡</span>
            <span>Uses your expiring <strong>{recipe.expiring_matched.join(', ')}</strong> first!</span>
          </div>
        )}

        {/* Match Percentage Bar */}
        <div className="match-score-section">
          <div className="match-score-labels">
            <span>Ingredient Match</span>
            <span className="match-percent-value">
              {recipe.match_score || 85}% Match
              {recipe.is_high_protein && <span className="protein-boost-flag"> (Protein Boosted)</span>}
            </span>
          </div>
          <div className="match-progress-track">
            <div
              className="match-progress-indicator"
              style={{ width: `${recipe.match_score || 85}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="recipe-card-btn-row">
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => onOpenModal && onOpenModal(recipe.slug)}
          >
            View Recipe →
          </button>
          <button
            type="button"
            className="btn-cook-mode-action"
            onClick={() => onStartCook && onStartCook(recipe.slug)}
            title="Open step-by-step interactive cooking mode"
          >
            👨‍🍳 Cook Mode
          </button>
        </div>
      </div>
    </div>
  );
}
