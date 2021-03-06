import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search Object
 * - Current recipe object
 * - Shopping list object
 * - liked recipes
 */
const state = {};
window.state = state;

/** SEARCH CONTROLLER **/
const controlSearch = async () => {
  // 1) get query from view
  const query = searchView.getInput();

  if (query) {
    // 2) New search obj and add to state
    state.search = new Search(query);

    // 3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchResults);

    try {
      // 4) Search for recipes
      await state.search.getResults();

      // 5) render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert('Something wrong with search...');
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/** RECIPE CONTROLLER **/
const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');
  console.log(id);

  if (id) {
    //Prepare for UI changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    //Create new recipe object
    state.recipe = new Recipe(id);

    try {
      //get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      alert('Error processing recipe');
    }
  }
};

['hashchange', 'load'].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/** SHOPPING LIST CONTROLLER **/
const controlList = () => {
  //Create a new list IF none exist yet
  if (!state.list) state.list = new List();

  //Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle Delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Delete Button
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);
    //Delete from UI
    listView.deleteItem(id);

    //Update items from list
  } else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/** LIKES CONTROLLER **/

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const curID = state.recipe.id;

  // user HAS NOT yet liked current recipe
  if (!state.likes.isLiked(curID)) {
    // add like to the state
    const newLike = state.likes.addLike(
      curID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // toggle the like button
    likesView.toggleLikeBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);

    // user HAS liked current recipe
  } else {
    // remove like to the state
    state.likes.deleteLike(curID);

    // toggle the like button
    likesView.toggleLikeBtn(false);

    //remove like from UI list
    likesView.deleteLike(curID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();

  //Retrieve liked recipes from localStorage
  state.likes.readStorage();

  // Toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Render existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease button is selected
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    // Increase button is selected
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Like controller
    controlLike();
  }
});

window.l = new List();
