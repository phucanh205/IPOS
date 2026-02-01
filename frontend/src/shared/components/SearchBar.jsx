import { useState } from "react";

function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    return (
        <div className="flex-1 max-w-md">
            <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                    🔍
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Tìm kiếm sản phẩm, mã vạch..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    );
}

export default SearchBar;
