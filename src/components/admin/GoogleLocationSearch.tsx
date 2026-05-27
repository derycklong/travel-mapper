"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface GoogleLocationSearchProps {
  token: string | null;
  onSelectResult: (result: { name: string; address: string; latitude: number; longitude: number }) => void;
}

export default function GoogleLocationSearch({ token, onSelectResult }: GoogleLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const doSearchRef = useRef(doSearch);
  doSearchRef.current = doSearch;

  const doSearch = useCallback(async () => {
    if (!query.trim() || !token) return;
    setIsSearching(true);
    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({ q: query.trim() });
      if (region.trim()) params.set("region", region.trim());
      const res = await fetch(`/api/admin/location-search?${params}`, { headers, signal: abortControllerRef.current.signal });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Location search failed" }));
        toast.error(data.error || "Location search failed");
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      toast.error("Network error — could not reach the server");
    } finally {
      setIsSearching(false);
    }
  }, [query, region, token]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearchRef.current();
    }, 500);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearchRef.current();
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Google Maps..."
            aria-label="Search location"
            className="h-9 w-full pl-3 pr-9 rounded-xl border text-sm"
            style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Region"
          aria-label="Filter by region"
          className="h-9 w-20 rounded-xl border text-sm px-3"
          style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="h-9 px-3 rounded-xl bg-[#4285F4] text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors hover:bg-[#3367d6]"
          aria-label="Search"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border divide-y text-xs" style={{ borderColor: "var(--color-border)" }}>
          {results.map((result, i) => (
            <button
              key={`${result.latitude}-${result.longitude}-${result.name}`}
              onClick={() => onSelectResult(result)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <p className="font-medium" style={{ color: "var(--color-text)" }}>{result.name}</p>
              <p className="text-gray-500 truncate">{result.address}</p>
              <p className="text-gray-400 text-[10px]">{result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
