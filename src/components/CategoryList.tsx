import React, { useEffect, useState } from "react";
import { courseApiService, Category, SubCategory } from "../utils/courseApiService";

const CategoryList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    courseApiService.getAllCategories().then((data) => setCategories(data));
    courseApiService.getAllSubCategories().then((data) => setSubCategories(data));
  }, []);

  // Helper to get category name by id
  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id.toString() === id);
    return cat ? cat.title : id;
  };

  return (
    <div>
      <h2>Categories</h2>
      <ul>
        {categories.map(cat => (
          <li key={cat.id}>{cat.title}</li>
        ))}
      </ul>
      <h2>Subcategories</h2>
      <ul>
        {subCategories.map(sub => (
          <li key={sub.id}>
            {sub.name || sub.title || sub.subCategoryName || 'Unknown'} (Category: {getCategoryName(sub.categoryId.toString())})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
