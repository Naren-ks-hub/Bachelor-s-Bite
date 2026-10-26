import React, { useState, useEffect, useMemo } from 'react';
import {
  generateMissingGroceryList,
  categorizeIngredient,
  getEstimatedCost,
  mergeGroceryItems
} from '../utils/groceryEngine';
import './AutomatedGroceryList.css';

/**
 * AutomatedGroceryList Component for BachelorBite
 *
 * Core Features:
 * 1. Recipe-to-Pantry Comparison: Isolates missing items automatically.
 * 2. Logical Category Grouping: Dairy, Produce, Staples, Spices.
 * 3. Budget-Aware Planning: Calculates total and per-item estimated costs.
 * 4. Interactive Checklist: Check as bought, clear bought, add custom items.
 * 5. Transfer to Pantry: Moves bought items directly into user's active fridge pantry.
 */
export default function AutomatedGroceryList({
  pantryItems = [],
  selectedRecipe = null,
  onTransferToPantry,
  onItemCountChange
}) {
  // State for grocery items (persisted in localStorage)
  const [groceryItems, setGroceryItems] = useState(() => {
    const saved = localStorage.getItem('bachelorBite_grocery_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Default initial list if empty
    return [
      { id: 'g1', name: 'Eggs', category: 'Dairy & Protein', estimatedCost: 15, checked: false, recipeSource: 'Quick 10-Minute Breakfast' },
      { id: 'g2', name: 'Garlic', category: 'Fresh Produce', estimatedCost: 10, checked: false, recipeSource: 'Garlic Butter Noodles' },
      { id: 'g3', name: 'Cheese Slices', category: 'Dairy & Protein', estimatedCost: 25, checked: false, recipeSource: 'Cheese Pan Melt' },
      { id: 'g4', name: 'Soy Sauce', category: 'Spices & Sauces', estimatedCost: 15, checked: false, recipeSource: 'Chili Noodles' }
    ];
  });

  // Form state for adding custom items
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Pantry Staples');
  const [customCost, setCustomCost] = useState('20');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bachelorBite_grocery_items', JSON.stringify(groceryItems));
    if (onItemCountChange) {
      onItemCountChange(groceryItems.filter(i => !i.checked).length);
    }
  }, [groceryItems, onItemCountChange]);

  // When a new recipe is selected, auto-generate missing items
  useEffect(() => {
    if (selectedRecipe) {
      const { missingItems } = generateMissingGroceryList(selectedRecipe, pantryItems);
      if (missingItems.length > 0) {
        setGroceryItems(prev => mergeGroceryItems(prev, missingItems));
      }
    }
  }, [selectedRecipe, pantryItems]);

  // Toggle item checked / bought
  const toggleItemBought = (id) => {
    setGroceryItems(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  // Remove individual item
  const removeItem = (id) => {
    setGroceryItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear bought items
  const clearBoughtItems = () => {
    setGroceryItems(prev => prev.filter(item => !item.checked));
  };

  // Transfer bought items back to pantry
  const handleTransferToPantry = () => {
    const boughtItems = groceryItems.filter(i => i.checked);
    if (boughtItems.length === 0) return;

    if (onTransferToPantry) {
      onTransferToPantry(boughtItems);
    }

    // Remove transferred items from grocery list
    setGroceryItems(prev => prev.filter(item => !item.checked));
  };

  // Add custom item
  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      category: customCategory || categorizeIngredient(customName),
      estimatedCost: Number(customCost) || getEstimatedCost(customName),
      checked: false,
      recipeSource: 'Custom Added'
    };

    setGroceryItems(prev => [...prev, newItem]);
    setCustomName('');
    setCustomCost('20');
  };

  // Budget calculations
  const totalBudget = useMemo(() => {
    return groceryItems
      .filter(item => !item.checked)
      .reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
  }, [groceryItems]);

  const boughtCount = useMemo(() => {
    return groceryItems.filter(item => item.checked).length;
  }, [groceryItems]);

  // Group items by category
  const groupedGroceryItems = useMemo(() => {
    const groups = {
      'Dairy & Protein': [],
      'Fresh Produce': [],
      'Pantry Staples': [],
      'Spices & Sauces': []
    };

    groceryItems.forEach(item => {
      const cat = item.category || 'Pantry Staples';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return groups;
  }, [groceryItems]);

  return (
    <div className="grocery-list-container" id="automatedGroceryListSection">
      {/* Header with Title & Budget Pill */}
      <div className="grocery-header">
        <div className="grocery-title-wrap">
          <div className="grocery-icon-badge" aria-hidden="true">🛒</div>
          <div>
            <h3>Automated Grocery List & Budget Planner</h3>
            <p>Smart missing-item shopping list automatically synchronized with your pantry.</p>
          </div>
        </div>

        {/* Budget-Aware Total Estimator */}
        <div className="grocery-budget-pill">
          <span className="budget-subtext">Estimated Missing Cost</span>
          <span className="budget-amount">₹{totalBudget}</span>
        </div>
      </div>

      {/* Manual Add Custom Item Form */}
      <form className="grocery-add-form" onSubmit={handleAddCustom}>
        <input
          type="text"
          className="grocery-input"
          placeholder="Add custom item (e.g. Milk, Onions, Chai Patti)..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          required
        />
        <select
          className="grocery-input"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        >
          <option value="Dairy & Protein">Dairy & Protein</option>
          <option value="Fresh Produce">Fresh Produce</option>
          <option value="Pantry Staples">Pantry Staples</option>
          <option value="Spices & Sauces">Spices & Sauces</option>
        </select>
        <input
          type="number"
          className="grocery-input"
          placeholder="₹ Cost"
          value={customCost}
          onChange={(e) => setCustomCost(e.target.value)}
          min="5"
          max="1000"
        />
        <button type="submit" className="btn-add-grocery">+ Add Item</button>
      </form>

      {/* Action Toolbar */}
      <div className="grocery-action-bar">
        <div className="grocery-counter-info">
          <span>{groceryItems.length - boughtCount} to buy</span>
          {boughtCount > 0 && <span> • {boughtCount} bought</span>}
        </div>

        <div className="grocery-batch-buttons">
          {boughtCount > 0 && (
            <>
              <button
                type="button"
                className="btn-transfer-pantry"
                onClick={handleTransferToPantry}
                title="Move bought items into your active fridge pantry"
              >
                <span>📦 Transfer {boughtCount} Bought to Pantry</span>
              </button>
              <button
                type="button"
                className="btn-clear-bought"
                onClick={clearBoughtItems}
              >
                Clear Bought
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {groceryItems.length === 0 ? (
        <div className="grocery-empty-state">
          <div className="empty-icon">🎉</div>
          <h4>Your Grocery List is Empty!</h4>
          <p>Select any recipe above to automatically isolate missing ingredients.</p>
        </div>
      ) : (
        /* Categorized Checklist Groups */
        <div className="grocery-categories-wrapper">
          {Object.entries(groupedGroceryItems).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={category} className="grocery-category-section">
                <div className="category-group-header">
                  <span>{category}</span>
                  <span className="category-badge-chip">{items.length}</span>
                </div>

                <div className="grocery-items-list">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`grocery-checklist-item ${item.checked ? 'bought' : ''}`}
                    >
                      <label className="grocery-item-left" htmlFor={`item_${item.id}`}>
                        <input
                          type="checkbox"
                          id={`item_${item.id}`}
                          className="grocery-checkbox"
                          checked={item.checked}
                          onChange={() => toggleItemBought(item.id)}
                        />
                        <span className="grocery-item-title">{item.name}</span>
                        {item.recipeSource && (
                          <span className="grocery-source-tag">{item.recipeSource}</span>
                        )}
                      </label>

                      <div className="grocery-item-right">
                        <span className="grocery-cost-tag">₹{item.estimatedCost}</span>
                        <button
                          type="button"
                          className="btn-remove-grocery"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
