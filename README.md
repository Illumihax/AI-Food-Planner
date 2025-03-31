# AI Food Planner

## General Idea

A Svelte 5 Frontend using shadcn, ApexCharts and svelte-flowbite to create a frontend showing recipes for each day.
The FastAPI Backend should be ablöe to call the gemini API to create Recipes, save them into a mysql DB (file I think), ...

## Step by Step Plan

### Backend
1. Set up the FastAPI framework.
2. Implement the Gemini API call for recipe generation.
3. Store generated recipes in a MySQL database.
4. Create endpoints to retrieve and update recipes.

### Frontend
1. Initialize a Svelte 5 project with shadcn, ApexCharts, and svelte-flowbite.
2. Fetch recipes from the backend and display them by day.
3. Provide UI elements for recipe selection and daily meal planning.
4. Integrate ApexCharts to visualize nutritional data.
