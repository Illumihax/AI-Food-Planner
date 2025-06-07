from sqlalchemy.orm import Session
from app.db import models, schemas
from app.services.recipe_service import RecipeService
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict

class MealPlanService:
    @staticmethod
    def create_meal_plan(db: Session, meal_plan: schemas.MealPlanCreate, user_id: int) -> models.MealPlan:
        """Create a new meal plan"""
        db_meal_plan = models.MealPlan(
            name=meal_plan.name,
            start_date=meal_plan.start_date,
            end_date=meal_plan.end_date,
            user_id=user_id
        )
        db.add(db_meal_plan)
        db.commit()
        db.refresh(db_meal_plan)
        
        # Add entries if provided
        if meal_plan.entries:
            for entry in meal_plan.entries:
                db_entry = models.MealPlanEntry(
                    meal_plan_id=db_meal_plan.id,
                    date=entry.date,
                    meal_type=entry.meal_type,
                    recipe_id=entry.recipe_id,
                    servings=entry.servings,
                    notes=entry.notes
                )
                db.add(db_entry)
        
        db.commit()
        db.refresh(db_meal_plan)
        return db_meal_plan
    
    @staticmethod
    def update_meal_plan(db: Session, meal_plan_id: int, meal_plan_update: schemas.MealPlanUpdate) -> Optional[models.MealPlan]:
        """Update an existing meal plan"""
        meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
        if not meal_plan:
            return None
        
        update_data = meal_plan_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(meal_plan, field, value)
        
        db.commit()
        db.refresh(meal_plan)
        return meal_plan
    
    @staticmethod
    def delete_meal_plan(db: Session, meal_plan_id: int) -> bool:
        """Delete a meal plan"""
        meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
        if not meal_plan:
            return False
        
        db.delete(meal_plan)
        db.commit()
        return True
    
    @staticmethod
    def add_meal_plan_entry(db: Session, meal_plan_id: int, entry: schemas.MealPlanEntryCreate) -> models.MealPlanEntry:
        """Add an entry to a meal plan"""
        db_entry = models.MealPlanEntry(
            meal_plan_id=meal_plan_id,
            date=entry.date,
            meal_type=entry.meal_type,
            recipe_id=entry.recipe_id,
            servings=entry.servings,
            notes=entry.notes
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    @staticmethod
    def update_meal_plan_entry(db: Session, entry_id: int, entry_update: schemas.MealPlanEntryUpdate) -> Optional[models.MealPlanEntry]:
        """Update a meal plan entry"""
        entry = db.query(models.MealPlanEntry).filter(models.MealPlanEntry.id == entry_id).first()
        if not entry:
            return None
        
        update_data = entry_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(entry, field, value)
        
        db.commit()
        db.refresh(entry)
        return entry
    
    @staticmethod
    def delete_meal_plan_entry(db: Session, entry_id: int) -> bool:
        """Delete a meal plan entry"""
        entry = db.query(models.MealPlanEntry).filter(models.MealPlanEntry.id == entry_id).first()
        if not entry:
            return False
        
        db.delete(entry)
        db.commit()
        return True
    
    @staticmethod
    def calculate_meal_plan_nutrition(db: Session, meal_plan_id: int) -> Optional[schemas.WeeklyNutrition]:
        """Calculate nutrition summary for a meal plan"""
        meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
        if not meal_plan:
            return None
        
        # Get all entries for this meal plan
        entries = db.query(models.MealPlanEntry).filter(
            models.MealPlanEntry.meal_plan_id == meal_plan_id
        ).all()
        
        # Group entries by date
        daily_nutrition = defaultdict(lambda: {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0})
        
        for entry in entries:
            # Calculate nutrition for this entry
            nutrition = RecipeService.calculate_nutrition(db, entry.recipe_id, entry.servings)
            if nutrition:
                date_str = entry.date.strftime("%Y-%m-%d")
                daily_nutrition[date_str]["calories"] += nutrition.calories
                daily_nutrition[date_str]["protein"] += nutrition.protein
                daily_nutrition[date_str]["carbs"] += nutrition.carbs
                daily_nutrition[date_str]["fat"] += nutrition.fat
                daily_nutrition[date_str]["fiber"] += nutrition.fiber
        
        # Create daily nutrition objects
        days = []
        total_calories = total_protein = total_carbs = total_fat = total_fiber = 0
        
        # Generate all dates in the meal plan range
        current_date = meal_plan.start_date.date()
        end_date = meal_plan.end_date.date()
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            day_data = daily_nutrition.get(date_str, {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0})
            
            days.append(schemas.DayNutrition(
                date=date_str,
                calories=round(day_data["calories"], 2),
                protein=round(day_data["protein"], 2),
                carbs=round(day_data["carbs"], 2),
                fat=round(day_data["fat"], 2),
                fiber=round(day_data["fiber"], 2)
            ))
            
            total_calories += day_data["calories"]
            total_protein += day_data["protein"]
            total_carbs += day_data["carbs"]
            total_fat += day_data["fat"]
            total_fiber += day_data["fiber"]
            
            current_date += timedelta(days=1)
        
        # Calculate averages
        num_days = len(days)
        weekly_totals = schemas.DayNutrition(
            date="Total",
            calories=round(total_calories, 2),
            protein=round(total_protein, 2),
            carbs=round(total_carbs, 2),
            fat=round(total_fat, 2),
            fiber=round(total_fiber, 2)
        )
        
        weekly_averages = schemas.DayNutrition(
            date="Average",
            calories=round(total_calories / num_days if num_days > 0 else 0, 2),
            protein=round(total_protein / num_days if num_days > 0 else 0, 2),
            carbs=round(total_carbs / num_days if num_days > 0 else 0, 2),
            fat=round(total_fat / num_days if num_days > 0 else 0, 2),
            fiber=round(total_fiber / num_days if num_days > 0 else 0, 2)
        )
        
        return schemas.WeeklyNutrition(
            days=days,
            weekly_totals=weekly_totals,
            weekly_averages=weekly_averages
        ) 