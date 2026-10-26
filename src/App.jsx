import React, { useState } from 'react';
import ActiveExpiryPantry, { RecipeExpiryRescueTag } from './components/ActiveExpiryPantry';

export default function App() {
  const [expiringIngredients, setExpiringIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <ActiveExpiryPantry
        onExpiringChange={setExpiringIngredients}
        onSelectedIngredientsChange={setSelectedIngredients}
      />
    </div>
  );
}
