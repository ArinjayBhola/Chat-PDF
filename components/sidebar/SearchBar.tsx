// UI REDESIGN
import React, { memo } from "react";
import { LuSearch, LuX } from "react-icons/lu";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const SearchBar = memo(({ value, onChange }: Props) => (
  <div className="relative mb-3">
    <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
    <input
      type="text"
      placeholder="Search chats..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <LuX className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
));

SearchBar.displayName = "SearchBar";
export default SearchBar;
