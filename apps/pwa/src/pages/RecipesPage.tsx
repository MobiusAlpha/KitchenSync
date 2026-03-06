import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from 'react-bootstrap';
import type { Recipe } from '@kitchensync/meal-model';
import { RecipeLibrary } from '../components/RecipeLibrary.js';
import { RecipeEditor } from '../components/RecipeEditor.js';
import { RecipeRepository } from '../storage/RecipeRepository.js';

type View = 'library' | 'create' | 'edit';

/**
 * US2: Recipe library + inline recipe editor.
 * Supports create, edit, delete flows.
 */
export function RecipesPage() {
  const [view, setView] = useState<View>('library');
  const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const loadRecipes = useCallback(async () => {
    const all = await RecipeRepository.getAll();
    setRecipes(all);
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  const handleSave = useCallback(async (recipe: Recipe) => {
    if (editingRecipe) {
      await RecipeRepository.update(recipe.id, {
        name: recipe.name,
        description: recipe.description,
        steps: recipe.steps,
      });
    } else {
      await RecipeRepository.create({
        name: recipe.name,
        description: recipe.description,
        steps: recipe.steps,
      });
    }
    await loadRecipes();
    setView('library');
    setEditingRecipe(null);
  }, [editingRecipe, loadRecipes]);

  const handleDelete = useCallback(async (id: string) => {
    await RecipeRepository.delete(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

  const startEdit = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setView('edit');
  }, []);

  const handleCancel = useCallback(() => {
    setView('library');
    setEditingRecipe(null);
  }, []);

  return (
    <div className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Recipes</h1>
        {view === 'library' && (
          <Button variant="success" onClick={() => setView('create')}>
            + New Recipe
          </Button>
        )}
      </div>

      {view === 'library' && (
        <RecipeLibrary
          recipes={recipes}
          onSelect={startEdit}
          onDelete={id => void handleDelete(id)}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <Card>
          <Card.Header>{view === 'edit' ? 'Edit Recipe' : 'New Recipe'}</Card.Header>
          <Card.Body>
            <RecipeEditor
              recipe={editingRecipe}
              onSave={recipe => void handleSave(recipe)}
              onCancel={handleCancel}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
