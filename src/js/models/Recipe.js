import axios from 'axios';
import { key, proxy } from '../config';

export default class Recipe {
  constructor(id) {
    this.id = id;
  }

  async getRecipe() {
    try {
      const res = await axios(
        `${proxy}https://www.food2fork.com/api/get?key=${key}&rId=${this.id}`
      );
      this.title = res.data.recipe.title;
      this.author = res.data.recipe.publisher;
      this.img = res.data.recipe.image_url;
      this.url = res.data.recipe.source_url;
      this.ingredients = res.data.recipe.ingredients;
    } catch (error) {
      console.log(error);
      alert('Something went wrong :(');
    }
  }

  calcTime() {
    //Assuming that we need 15min for each 3 ingredients
    const numIng = this.ingredients.length;
    const periods = Math.ceil(numIng / 3);
    this.time = periods * 15;
  }

  calcServings() {
    this.servings = 4;
  }

  parseIngredients() {
    const unitsLong = [
      'tablespoons',
      'tablespoon',
      'ounces',
      'ounce',
      'teaspoons',
      'teaspoon',
      'cups',
      'pounds',
      'pound'
    ];
    const unitsShort = [
      'tbsp',
      'tbsp',
      'oz',
      'oz',
      'tsp',
      'tsp',
      'cup',
      'lbs',
      'lb'
    ];
    const units = [...unitsShort, 'kg', 'g'];

    const newIngredients = this.ingredients.map(el => {
      // 1) Standardized units
      let ingredient = el.toLowerCase();
      unitsLong.forEach((unit, i) => {
        ingredient = ingredient.replace(unit, unitsShort[i]);
      });

      //2) Remove Brackets
      ingredient = ingredient.replace(/ *\([^)]*\) */g, '');

      //3) Parse ingredients into count, unit and ingredient
      const arrIngredients = ingredient.split(' ');
      const unitIndx = arrIngredients.findIndex(el2 => units.includes(el2));

      let objIngredient;
      if (unitIndx > -1) {
        /** unit exist
         *  E.g. 4 1/2 cups, arrCount is [4, 1/2] -> eval("4+1/2") -> 4.5
         *  E.g. 4 cups, arrCount is 4
         **/
        const arrCount = arrIngredients.slice(0, unitIndx);

        let count;
        if (arrCount.length === 1) {
          count = eval(arrIngredients[0].replace('-', '+'));
        } else {
          count = eval(arrIngredients.slice(0, unitIndx).join('+'));
        }

        objIngredient = {
          count,
          unit: arrIngredients[unitIndx],
          ingredient: arrIngredients.slice(unitIndx + 1).join(' ')
        };
      } else if (parseInt(arrIngredients[0], 10)) {
        // No unit, but first element is integer/number
        objIngredient = {
          count: parseInt(arrIngredients[0], 10),
          unit: ' ',
          ingredient: arrIngredients.slice(1).join(' ')
        };
      } else if (unitIndx === -1) {
        // No unit and number exist in first position
        objIngredient = {
          count: 1,
          unit: ' ',
          ingredient
        };
      }

      return objIngredient;
    });
    this.ingredients = newIngredients;
  }
}
