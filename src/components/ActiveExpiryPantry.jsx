import React, { useState, useEffect, useMemo } from 'react';
import {
  calculateDaysUntilExpiry,
  sortPantryByExpiry,
  getUrgentExpiringIngredients,
  applyExpiryRecommendationBoost
} from '../utils/expiryCalculator';
import './ActiveExpiryPantry.css';

/**
 * Active Expiry Tracking & Alerts Component for BachelorBite
 *
 * Core Features:
 * 1. Expiry Date Input: type="date" picker alongside ingredient name & quantity.
 * 2. Status Calculation: Categorizes items into Expired (<=0d), Expiring Soon (1-3d), Fresh (>3d).
 * 3. Pantry Dashboard: Displays color-coded badges, sorted so soonest-to-expire are at top.
 * 4. Recommendation Engine Integration: Boosts recipe score for items <= 2 days from expiry
 *    and displays "💡 Uses your expiring [Ingredient] first!".
 */
export default function ActiveExpiryPantry({
  onExpiringChange,
  onSelectedIngredientsChange,
  recipes = [],
  onRecipesBoosted
}) {
  // Helper to generate future date string (YYYY-MM-DD)
  const getFutureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // State management for tracked pantry items (persisted to localStorage)
  const [pantryItems, setPantryItems] = useState(() => {
    const saved = localStorage.getItem('bachelorBite_pantry_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved pantry items:', e);
      }
    }
    // Default initial items showing all 3 dynamic status tiers
    return [
      { id: '1', name: 'Milk', quantity: '500 ml', expiryDate: getFutureDate(0), active: true },
      { id: '2', name: 'Bread', quantity: '1 loaf (4 slices left)', expiryDate: getFutureDate(1), active: true },
      { id: '3', name: 'Eggs', quantity: '4 eggs', expiryDate: getFutureDate(2), active: true },
      { id: '4', name: 'Cheese', quantity: '200g block', expiryDate: getFutureDate(4), active: true },
      { id: '5', name: 'Pasta', quantity: '1 pack', expiryDate: getFutureDate(12), active: false }
    ];
  });

  // State for new item addition form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1 pack');
  const [newItemExpiry, setNewItemExpiry] = useState(() => getFutureDate(3));

  // Sync to localStorage whenever pantryItems changes
  useEffect(() => {
    localStorage.setItem('bachelorBite_pantry_items', JSON.stringify(pantryItems));
  }, [pantryItems]);

  // Requirement 3: Automatically sort pantry list so items closest to expiration appear at the top
  const sortedPantryItems = useMemo(() => {
    return sortPantryByExpiry(pantryItems);
  }, [pantryItems]);

  // Dynamic Tier Summary Counters
  const summaryStats = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    let fresh = 0;

    pantryItems.forEach(item => {
      const calc = calculateDaysUntilExpiry(item.expiryDate);
      if (calc.status === 'expired') expired++;
      else if (calc.status === 'expiring-soon') expiringSoon++;
      else fresh++;
    });

    return { expired, expiringSoon, fresh, total: pantryItems.length };
  }, [pantryItems]);

  // Requirement 4: Urgent expiring ingredients (<= 2 days)
  const urgentExpiringNames = useMemo(() => {
    return getUrgentExpiringIngredients(pantryItems);
  }, [pantryItems]);

  // Notify parent component of expiring ingredients changes
  useEffect(() => {
    if (onExpiringChange) {
      onExpiringChange(urgentExpiringNames);
    }
    if (onSelectedIngredientsChange) {
      const activeIngredients = pantryItems.filter(i => i.active).map(i => i.name);
      onSelectedIngredientsChange(activeIngredients);
    }
    if (onRecipesBoosted && recipes.length > 0) {
      const boosted = applyExpiryRecommendationBoost(recipes, urgentExpiringNames);
      onRecipesBoosted(boosted);
    }
  }, [pantryItems, urgentExpiringNames, recipes, onExpiringChange, onSelectedIngredientsChange, onRecipesBoosted]);

  // Handle addition of new pantry item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemExpiry) return;

    const newItem = {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQty.trim() || '1 item',
      expiryDate: newItemExpiry,
      active: true
    };

    setPantryItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQty('1 pack');
    setNewItemExpiry(getFutureDate(3));
  };

  // Toggle active selection for recipe matching
  const handleToggleItem = (id) => {
    setPantryItems(prev =>
      prev.map(item => item.id === id ? { ...item, active: !item.active } : item)
    );
  };

  // Delete / Mark consumed
  const handleDeleteItem = (id) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  // Reset to sample items
  const handleResetSample = () => {
    const sample = [
      { id: '1', name: 'Milk', quantity: '500 ml', expiryDate: getFutureDate(0), active: true },
      { id: '2', name: 'Bread', quantity: '1 loaf (4 slices left)', expiryDate: getFutureDate(1), active: true },
      { id: '3', name: 'Eggs', quantity: '4 eggs', expiryDate: getFutureDate(2), active: true },
      { id: '4', name: 'Cheese', quantity: '200g block', expiryDate: getFutureDate(4), active: true },
      { id: '5', name: 'Pasta', quantity: '1 pack', expiryDate: getFutureDate(12), active: false }
    ];
    setPantryItems(sample);
  };

  return (
    <div className="expiry-dashboard-container">
      {/* Dashboard Header */}
      <div className="expiry-dashboard-header">
        <div className="expiry-title-area">
          <div className="expiry-pulse-icon" aria-hidden="true">⏰</div>
          <div>
            <h3>Active Expiry Tracking & Waste Alerts</h3>
            <p>Track perishable ingredients by date to prioritize zero-waste 12-minute recipes.</p>
          </div>
        </div>

        {/* Dynamic Status Tier Counters */}
        <div className="expiry-status-counters">
          <div className="tier-counter-chip expired" title="<= 0 days remaining">
            <span className="tier-dot"></span>
            <span>{summaryStats.expired} Expired</span>
          </div>
          <div className="tier-counter-chip expiring-soon" title="1 to 3 days remaining">
            <span className="tier-dot"></span>
            <span>{summaryStats.expiringSoon} Expiring Soon</span>
          </div>
          <div className="tier-counter-chip fresh" title="> 3 days remaining">
            <span className="tier-dot"></span>
            <span>{summaryStats.fresh} Fresh</span>
          </div>
        </div>
      </div>

      {/* Dynamic Zero-Waste Alert Banner */}
      {urgentExpiringNames.length > 0 && (
        <div className="expiry-alert-callout">
          <span className="callout-icon">🚨</span>
          <div>
            <strong>Zero-Waste Alert:</strong> You have {urgentExpiringNames.length} ingredient(s) expiring within 48 hours ({urgentExpiringNames.join(', ')})! Recipes to rescue them first are boosted below.
          </div>
        </div>
      )}

      {/* Requirement 1: Expiry Date Input Form with type="date" */}
      <form className="pantry-add-form" onSubmit={handleAddItem}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="pantryNameInput">Ingredient Name</label>
            <input
              id="pantryNameInput"
              type="text"
              placeholder="e.g. Bread, Eggs, Milk, Spinach"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pantryQtyInput">Quantity</label>
            <input
              id="pantryQtyInput"
              type="text"
              placeholder="e.g. 1 loaf, 6 pcs"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pantryExpiryInput">Expiry Date</label>
            <input
              id="pantryExpiryInput"
              type="date"
              value={newItemExpiry}
              onChange={(e) => setNewItemExpiry(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-submit-item">
            <span>+ Add to Pantry</span>
          </button>
        </div>
      </form>

      {/* Requirement 3: Pantry Dashboard Cards Grid (Sorted: Closest to expiration at top) */}
      <div className="pantry-list-section">
        <div className="pantry-list-header">
          <h4>
            <span>📦 Tracked Fridge & Pantry Items</span>
            <span className="sort-hint-tag">⚡ Auto-sorted: Closest to Expiry First</span>
          </h4>
          <button type="button" className="btn-delete-item" onClick={handleResetSample}>
            ↺ Reset Sample Pantry
          </button>
        </div>

        <div className="pantry-cards-grid">
          {sortedPantryItems.map(item => {
            const { days, status, label, badgeClass } = calculateDaysUntilExpiry(item.expiryDate);
            return (
              <div key={item.id} className={`pantry-ingredient-card tier-${status}`}>
                <div className="item-main-info">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-qty">Qty: {item.quantity} • Exp: {item.expiryDate}</div>
                  </div>
                  {/* Dynamic Color-Coded Expiry Badge */}
                  <span className={`expiry-status-badge ${badgeClass}`}>
                    {status === 'expired' && '🚨 '}
                    {status === 'expiring-soon' && '⚠️ '}
                    {status === 'fresh' && '🍏 '}
                    {label}
                  </span>
                </div>

                <div className="item-card-actions">
                  <button
                    type="button"
                    className={`btn-toggle-match ${item.active ? 'active' : ''}`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    {item.active ? '✓ Matching Recipes' : '+ Tap to Match'}
                  </button>
                  <button
                    type="button"
                    className="btn-delete-item"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Mark item consumed or remove"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Requirement 4: Visual Highlight Tag for Recipe Cards
 */
export function RecipeExpiryRescueTag({ matchedExpiring = [] }) {
  if (!matchedExpiring || matchedExpiring.length === 0) return null;
  return (
    <div className="expiry-rescue-pill" title="Prioritized recipe to prevent ingredient waste">
      <span className="expiry-pill-icon">💡</span>
      <span>Uses your expiring <strong>{matchedExpiring.join(', ')}</strong> first!</span>
    </div>
  );
}
