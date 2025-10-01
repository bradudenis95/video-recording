"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Edit2, Save, X, ChevronUp, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Position {
  id: string
  name: string
  display_order: number
  created_at: string
}

interface SkillCategory {
  id: string
  name: string
  display_order: number
  created_at: string
}

interface Skill {
  id: string
  name: string
  category_id: string
  created_at: string
  category_name?: string
}

export default function AdminPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<{ type: string; id: string; value: string } | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newSkillCategory, setNewSkillCategory] = useState("")
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: positionsData, error: positionsError } = await supabase
        .from("positions")
        .select("*")
        .order("display_order")

      if (positionsError) throw positionsError
      setPositions(positionsData || [])

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("skill_categories")
        .select("*")
        .order("display_order")

      if (categoriesError) throw categoriesError
      setSkillCategories(categoriesData || [])

      // Fetch skills with category names
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select(`
          *,
          skill_categories!inner(name)
        `)
        .order("name")

      if (skillsError) throw skillsError

      const skillsWithCategoryNames =
        skillsData?.map((skill) => ({
          ...skill,
          category_name: skill.skill_categories.name,
        })) || []

      setSkills(skillsWithCategoryNames)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addPosition = async () => {
    if (!newItemName.trim()) return

    try {
      const { data: maxOrderData } = await supabase
        .from("positions")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)

      const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order + 1 : 1

      const { error } = await supabase.from("positions").insert([
        {
          name: newItemName.trim(),
          display_order: nextOrder,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Position added successfully",
      })

      setNewItemName("")
      fetchData()
    } catch (error) {
      console.error("Error adding position:", error)
      toast({
        title: "Error",
        description: "Failed to add position",
        variant: "destructive",
      })
    }
  }

  const addSkillCategory = async () => {
    if (!newItemName.trim()) return

    try {
      const { data: maxOrderData } = await supabase
        .from("skill_categories")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)

      const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order + 1 : 1

      const { error } = await supabase.from("skill_categories").insert([
        {
          name: newItemName.trim(),
          display_order: nextOrder,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Skill category added successfully",
      })

      setNewItemName("")
      fetchData()
    } catch (error) {
      console.error("Error adding skill category:", error)
      toast({
        title: "Error",
        description: "Failed to add skill category",
        variant: "destructive",
      })
    }
  }

  const addSkill = async () => {
    if (!newItemName.trim() || !newSkillCategory) return

    try {
      const { error } = await supabase.from("skills").insert([
        {
          name: newItemName.trim(),
          category_id: newSkillCategory,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Skill added successfully",
      })

      setNewItemName("")
      setNewSkillCategory("")
      fetchData()
    } catch (error) {
      console.error("Error adding skill:", error)
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive",
      })
    }
  }

  const updateItem = async (table: string, id: string, name: string) => {
    if (!name.trim()) return

    try {
      const { error } = await supabase.from(table).update({ name: name.trim() }).eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Item updated successfully",
      })

      setEditingItem(null)
      fetchData()
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await supabase.from(table).delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })

      fetchData()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const moveCategoryUp = async (categoryId: string, currentOrder: number) => {
    try {
      // Find the category with the previous order
      const { data: prevCategory } = await supabase
        .from("skill_categories")
        .select("id, display_order")
        .lt("display_order", currentOrder)
        .order("display_order", { ascending: false })
        .limit(1)

      if (!prevCategory || prevCategory.length === 0) return

      // Swap the orders
      await supabase.from("skill_categories").update({ display_order: currentOrder }).eq("id", prevCategory[0].id)
      await supabase
        .from("skill_categories")
        .update({ display_order: prevCategory[0].display_order })
        .eq("id", categoryId)

      fetchData()
    } catch (error) {
      console.error("Error moving category up:", error)
      toast({
        title: "Error",
        description: "Failed to reorder category",
        variant: "destructive",
      })
    }
  }

  const moveCategoryDown = async (categoryId: string, currentOrder: number) => {
    try {
      // Find the category with the next order
      const { data: nextCategory } = await supabase
        .from("skill_categories")
        .select("id, display_order")
        .gt("display_order", currentOrder)
        .order("display_order", { ascending: true })
        .limit(1)

      if (!nextCategory || nextCategory.length === 0) return

      // Swap the orders
      await supabase.from("skill_categories").update({ display_order: currentOrder }).eq("id", nextCategory[0].id)
      await supabase
        .from("skill_categories")
        .update({ display_order: nextCategory[0].display_order })
        .eq("id", categoryId)

      fetchData()
    } catch (error) {
      console.error("Error moving category down:", error)
      toast({
        title: "Error",
        description: "Failed to reorder category",
        variant: "destructive",
      })
    }
  }

  const movePositionUp = async (positionId: string, currentOrder: number) => {
    try {
      // Find the position with the previous order
      const { data: prevPosition } = await supabase
        .from("positions")
        .select("id, display_order")
        .lt("display_order", currentOrder)
        .order("display_order", { ascending: false })
        .limit(1)

      if (!prevPosition || prevPosition.length === 0) return

      // Swap the orders
      await supabase.from("positions").update({ display_order: currentOrder }).eq("id", prevPosition[0].id)
      await supabase.from("positions").update({ display_order: prevPosition[0].display_order }).eq("id", positionId)

      fetchData()
    } catch (error) {
      console.error("Error moving position up:", error)
      toast({
        title: "Error",
        description: "Failed to reorder position",
        variant: "destructive",
      })
    }
  }

  const movePositionDown = async (positionId: string, currentOrder: number) => {
    try {
      // Find the position with the next order
      const { data: nextPosition } = await supabase
        .from("positions")
        .select("id, display_order")
        .gt("display_order", currentOrder)
        .order("display_order", { ascending: true })
        .limit(1)

      if (!nextPosition || nextPosition.length === 0) return

      // Swap the orders
      await supabase.from("positions").update({ display_order: currentOrder }).eq("id", nextPosition[0].id)
      await supabase.from("positions").update({ display_order: nextPosition[0].display_order }).eq("id", positionId)

      fetchData()
    } catch (error) {
      console.error("Error moving position down:", error)
      toast({
        title: "Error",
        description: "Failed to reorder position",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage positions, skill categories, and skills for the questionnaire
        </p>
      </div>

      <Tabs defaultValue="positions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="categories">Skill Categories</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
              <CardDescription>Manage available positions for candidates (use arrows to reorder)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter position name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addPosition()}
                />
                <Button onClick={addPosition} disabled={!newItemName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Position
                </Button>
              </div>

              <div className="space-y-2">
                {positions.map((position, index) => (
                  <div key={position.id} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingItem?.type === "positions" && editingItem.id === position.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          onKeyPress={(e) =>
                            e.key === "Enter" && updateItem("positions", position.id, editingItem.value)
                          }
                        />
                        <Button size="sm" onClick={() => updateItem("positions", position.id, editingItem.value)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{position.name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => movePositionUp(position.id, position.display_order)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => movePositionDown(position.id, position.display_order)}
                            disabled={index === positions.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem({ type: "positions", id: position.id, value: position.name })}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem("positions", position.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {positions.length === 0 && <p className="text-muted-foreground text-center py-8">No positions found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Skill Categories</CardTitle>
              <CardDescription>Manage skill categories for organizing skills (drag to reorder)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter category name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkillCategory()}
                />
                <Button onClick={addSkillCategory} disabled={!newItemName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>

              <div className="space-y-2">
                {skillCategories.map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingItem?.type === "skill_categories" && editingItem.id === category.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          onKeyPress={(e) =>
                            e.key === "Enter" && updateItem("skill_categories", category.id, editingItem.value)
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() => updateItem("skill_categories", category.id, editingItem.value)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{category.name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveCategoryUp(category.id, category.display_order)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveCategoryDown(category.id, category.display_order)}
                            disabled={index === skillCategories.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingItem({ type: "skill_categories", id: category.id, value: category.name })
                            }
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItem("skill_categories", category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {skillCategories.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No skill categories found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Manage individual skills within categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter skill name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  className="flex-1"
                />
                <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSkill} disabled={!newItemName.trim() || !newSkillCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>

              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingItem?.type === "skills" && editingItem.id === skill.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          onKeyPress={(e) => e.key === "Enter" && updateItem("skills", skill.id, editingItem.value)}
                        />
                        <Button size="sm" onClick={() => updateItem("skills", skill.id, editingItem.value)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({skill.category_name})</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem({ type: "skills", id: skill.id, value: skill.name })}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem("skills", skill.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {skills.length === 0 && <p className="text-muted-foreground text-center py-8">No skills found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
