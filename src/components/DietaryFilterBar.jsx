import React from 'react';
import './DietaryHealth.css';

/**
 * DietaryFilterBar Component
 *
 * Accessible health & nutrition filter controls for BachelorBite.
 * - Toggle 1: "🥗 Veg Only" (Hard Filter)
 * - Toggle 2: "💪 High Protein (20g+)" (Soft Boost)
 */
export default function DietaryFilterBar({
  isVegOnly,
  isHighProtein,
  onToggleVegOnly,
  onToggleHighProtein
}) {
  return (
    <div className="dietary-filter-bar" role="region" aria-label="Health and Nutrition Filters">
      <div className="dietary-filter-label">
        <span className="dietary-icon" aria-hidden="true">🥗</span>
        <span>Dietary & Health Filters</span>
      </div>

      <div className="dietary-toggle-group">
        {/* Toggle 1: Veg Only */}
        <button
          type="button"
          className={`health-toggle-pill veg-pill ${isVegOnly ? 'active' : ''}`}
          onClick={onToggleVegOnly}
          aria-pressed={isVegOnly}
          title="Filter to show 100% pure vegetarian recipes only"
        >
          <span className="pill-dot veg-dot" aria-hidden="true"></span>
          <span className="pill-text">🥗 Veg Only</span>
          {isVegOnly && <span className="pill-status-check">✓</span>}
        </button>

        {/* Toggle 2: High Protein (20g+) */}
        <button
          type="button"
          className={`health-toggle-pill protein-pill ${isHighProtein ? 'active' : ''}`}
          onClick={onToggleHighProtein}
          aria-pressed={isHighProtein}
          title="Prioritize recipes with 20 grams or more of muscle-building protein"
        >
          <span className="pill-dot protein-dot" aria-hidden="true"></span>
          <span className="pill-text">💪 High Protein (20g+)</span>
          {isHighProtein && <span className="pill-status-check">✓</span>}
        </button>
      </div>
    </div>
  );
}
