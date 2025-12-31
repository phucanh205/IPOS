function CategoryFilters({ categories, selectedCategory, onCategoryChange }) {
  const getCategoryId = (category) => {
    if (category._id === 'all' || category.name === 'All Items' || category.name === 'Tất cả') return 'all';
    return category._id || category.slug || 'all';
  };

  return (
    <div className="flex gap-2 overflow-x-auto">
      {categories.map((category) => {
        const categoryId = getCategoryId(category);
        const isActive = selectedCategory === categoryId;
        return (
          <button
            key={category._id || category.slug || category.name}
            onClick={() => onCategoryChange(categoryId)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilters;

