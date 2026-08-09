
'use client';

import { useState, useEffect, useCallback } from 'react';

// GLOBAL MEMORY CACHE
// Reduces API calls by storing results for 2 minutes
// LRU-style: max 50 entries — oldest evicted to prevent memory growth on long sessions
const MAX_CACHE_ENTRIES = 50;
const queryCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 120 * 1000; // 2 minutes

function setCacheEntry(key: string, data: any) {
  // Evict oldest entries when over limit
  if (queryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) queryCache.delete(oldestKey);
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

export function useMongoDBCollection<T = any>(options: { 
  limit?: number; 
  category?: string; 
  q?: string;
  moleculeId?: string;
  isGeneric?: boolean;
  isBestSeller?: string | boolean;
  minPrice?: string;
  maxPrice?: string;
  marketerName?: string;
  dosageForm?: string;
  showDisabled?: boolean;
} = {}) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.category) params.append('category', options.category);
      if (options.moleculeId) params.append('moleculeId', options.moleculeId);
      if (options.isGeneric !== undefined) params.append('isGeneric', options.isGeneric.toString());
      if (options.isBestSeller !== undefined) params.append('isBestSeller', options.isBestSeller.toString());
      if (options.q) params.append('q', options.q);
      if (options.minPrice) params.append('minPrice', options.minPrice);
      if (options.maxPrice) params.append('maxPrice', options.maxPrice);
      if (options.marketerName) params.append('marketerName', options.marketerName);
      if (options.dosageForm) params.append('dosageForm', options.dosageForm);
      if (options.showDisabled) params.append('showDisabled', 'true');

      const cacheKey = `products_${params.toString()}`;
      const cached = queryCache.get(cacheKey);

      // Return cached if fresh and non-empty
      if (cached && cached.data?.length > 0 && (Date.now() - cached.timestamp < CACHE_TTL) && refreshKey === 0) {
        if (!cancelled) { setData(cached.data); setIsLoading(false); }
        return;
      }

      if (!cancelled) setIsLoading(true);
      try {
        const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch products');
        
        const normalized = Array.isArray(json) ? json.map((item: any) => ({ ...item, id: item._id || item.id })) : [];
        
        // Save to cache ONLY if results are non-empty (LRU eviction handled inside setCacheEntry)
        if (normalized.length > 0) {
          setCacheEntry(cacheKey, normalized);
        }
        if (!cancelled) setData(normalized);
      } catch (err: any) {
        if (!cancelled && err.name !== 'AbortError') setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; controller.abort(); };
  }, [options.limit, options.category, options.q, options.moleculeId, options.isBestSeller, options.minPrice, options.maxPrice, options.marketerName, options.dosageForm, options.showDisabled, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return { data, isLoading, error, refetch };
}

export function useMongoDBDoc<T = any>(id: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const cacheKey = `doc_${id}`;
    const cached = queryCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && refreshKey === 0) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!cancelled) setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch product (Status: ${res.status})`);
        const json = await res.json();
        const normalized = { ...json, id: json._id || json.id };
        
        setCacheEntry(cacheKey, normalized);
        if (!cancelled) setData(normalized);
      } catch (err: any) {
        if (!cancelled && err.name !== 'AbortError') setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; controller.abort(); };
  }, [id, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return { data, isLoading, error, refetch };
}

export function useMongoDBMolecule<T = any>(id: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const cacheKey = `molecule_${id}`;
    const cached = queryCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && refreshKey === 0) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!cancelled) setIsLoading(true);
      try {
        const res = await fetch(`/api/molecules/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch molecule');
        const json = await res.json();
        const normalized = { ...json, id: json._id || json.id };
        
        queryCache[cacheKey] = { data: normalized, timestamp: Date.now() };
        if (!cancelled) setData(normalized);
      } catch (err: any) {
        if (!cancelled && err.name !== 'AbortError') setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; controller.abort(); };
  }, [id, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
