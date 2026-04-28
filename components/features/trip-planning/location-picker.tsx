"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click away listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query === value && query !== "") return; // Don't search if it's the current selected value

    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        // setShowResults(false); // Keep open if we want to show popular/recent later
        return;
      }

      setIsSearching(true);
      setShowResults(true);
      try {
        const searchResults = await searchLocations(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Location search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelectLocation = (location: LocationResult) => {
    setQuery(location.displayName);
    setShowResults(false);
    onChange(location);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon || <MapPin className="size-4" />}
        </div>
        
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-10"
          autoComplete="off"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {query && !isSearching && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              type="button"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[320px] overflow-y-auto py-2">
            {isSearching && results.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="size-8 animate-spin mx-auto mb-3 opacity-20" />
                <p>Searching for locations...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors group flex items-start gap-3.5"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight mb-1">
                      {location.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {location.displayName}
                    </p>
                  </div>
                </button>
              ))
            ) : !isSearching && query.length >= 2 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                  <MapPin className="size-6 opacity-20" />
                </div>
                <p className="font-medium text-foreground mb-1">No locations found</p>
                <p className="text-xs">Try searching for a different city or airport.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
