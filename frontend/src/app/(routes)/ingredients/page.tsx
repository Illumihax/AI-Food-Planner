"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ingredient, IngredientCreate } from "@/lib/types";
import { listIngredients, createIngredient, deleteIngredient } from "@/lib/api/ingredients";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<IngredientCreate>({ name: "", brand: "", source: "manual" });
  const [query, setQuery] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listIngredients();
      setIngredients(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: IngredientCreate = {
        name: form.name.trim(),
        brand: form.brand?.trim() || undefined,
        source: form.source || "manual",
        calories: form.calories ? Number(form.calories) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        fats: form.fats ? Number(form.fats) : undefined,
      };
      await createIngredient(payload);
      setForm({ name: "", brand: "", source: "manual" });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteIngredient(id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) =>
      [i.name, i.brand ?? ""].some((v) => v?.toLowerCase().includes(q))
    );
  }, [ingredients, query]);

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold">Ingredients</h1>
          <p className="opacity-80">Manage your ingredient library and macros per 100g.</p>
        </div>
        <div className="w-full sm:w-80">
          <Input placeholder="Search ingredients..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Ingredient</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <Label>Calories/100g</Label>
              <Input
                type="number"
                step="any"
                value={(form.calories as number | undefined) ?? ""}
                onChange={(e) => setForm({ ...form, calories: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label>Carbs/100g</Label>
              <Input
                type="number"
                step="any"
                value={(form.carbs as number | undefined) ?? ""}
                onChange={(e) => setForm({ ...form, carbs: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label>Protein/100g</Label>
              <Input
                type="number"
                step="any"
                value={(form.protein as number | undefined) ?? ""}
                onChange={(e) => setForm({ ...form, protein: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label>Fats/100g</Label>
              <Input
                type="number"
                step="any"
                value={(form.fats as number | undefined) ?? ""}
                onChange={(e) => setForm({ ...form, fats: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Ingredient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="opacity-70">No ingredients found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((ing) => (
            <Card key={ing.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{ing.name}</CardTitle>
                {ing.brand && <Badge variant="muted">{ing.brand}</Badge>}
              </CardHeader>
              <CardContent>
                <div className="text-sm opacity-90">
                  {[
                    ing.calories != null ? `${ing.calories} kcal` : null,
                    ing.carbs != null ? `${ing.carbs}g C` : null,
                    ing.protein != null ? `${ing.protein}g P` : null,
                    ing.fats != null ? `${ing.fats}g F` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete ${ing.name}?`)) onDelete(ing.id);
                  }}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


