# AI Food Planner

A Meal planning app to help me manage a food plan for the next week, save recipes, keep in check my macrtos and also as a feature for the future include stuff like genrating a whole wheek worth of meals via an AI (only a future plan, nothing concrete yet)
Basic infrastructure:
- Backend: python and a database which is a file (sqlite i think) and also use this openfoodfacts python package (https://pypi.org/project/openfoodfacts/) for getting food information (macros, ...)
- Frontend: node (probably like a very known framework for web dev). Pages:
    - like starting page (do whatever there)
    - a page for my like recipes (here basically show all the recipes from the backend and on click make a popup with the full recipe, where i can edit it, it shows all the ingreients, ...)
    - a page for ingredients where i can basically search for ingredients in the food api and then i can CRUD them in this page.
    - a page which is the main thing for a weekly plan. Here i need basically a weeks overview with 4 meals per day (breakfast, lunch, snack and dinner) where i can add recipes (name + macros or the direct link to a recipe)
    - a settings option for my daily carbs, proteins, calories, fats, ... to then on the weekly page see if i hit my daily limits / overshoot / ...