import { ListGroup, Button, Alert } from 'react-bootstrap';
import type { Recipe } from '@kitchensync/meal-model';

interface RecipeLibraryProps {
  readonly recipes: readonly Recipe[];
  readonly onSelect: (recipe: Recipe) => void;
  readonly onDelete: (recipeId: string) => void;
}

/**
 * Read-only list of persisted Recipes with load and delete actions.
 */
export function RecipeLibrary({ recipes, onSelect, onDelete }: RecipeLibraryProps) {
  if (recipes.length === 0) {
    return (
      <Alert variant="light" className="text-center text-muted border">
        No saved recipes yet. Create one from the Recipes page or save your current plan.
      </Alert>
    );
  }

  return (
    <ListGroup>
      {recipes.map(recipe => (
        <ListGroup.Item
          key={recipe.id}
          className="d-flex align-items-center gap-2"
        >
          <div className="flex-grow-1">
            <strong>{recipe.name}</strong>
            <span className="ms-2 text-muted">
              {recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="d-flex gap-1">
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => onSelect(recipe)}
            >
              Load
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => onDelete(recipe.id)}
            >
              Delete
            </Button>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
