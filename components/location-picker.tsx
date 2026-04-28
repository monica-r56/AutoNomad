"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchLocations, type LocationResult } from "@/lib/location-search";

interface LocationPickerProps {
  value: string;
  onChange: (location: LocationResult) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search cities, airports...",
  label,
  icon,
  disabled = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      setShowResults(true);

      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await searchLocations(searchQuery);
        setResults(searchResults);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSelectLocation = (location: LocationResult) => {
    setQuery(location.displayName);
    setShowResults(false);
    onChange(location);
  };

  return (
    <div className="relative w-full">
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon || <MapPin className="size-4" />}
        </div>
        
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
          autoComplete="off"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {results.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors border-b last:border-b-0"
              >
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {location.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {location.country}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {showResults && query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No locations found. Try another search.
          </p>
        </div>
      )}
    </div>
  );
}
