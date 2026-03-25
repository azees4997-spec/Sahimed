
'use client';

import { useState, useEffect } from 'react';

export function useMongoDBCollection<T = any>(options: { 
  limit?: number; 
  category?: string; 
  q?: string;
  moleculeId?: string;
  isGeneric?: boolean;
} = {}) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.category) params.append('category', options.category);
        if (options.moleculeId) params.append('moleculeId', options.moleculeId);
        if (options.isGeneric !== undefined) params.append('isGeneric', options.isGeneric.toString());
        if (options.q) params.append('q', options.q);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const json = await res.json();
        const normalized = json.map((item: any) => ({
          ...item,
          id: item._id || item.id
        }));
        setData(normalized);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [options.limit, options.category, options.q, options.moleculeId, refreshKey]);

  return { data, isLoading, error, refetch: () => setRefreshKey(k => k + 1) };
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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            const errorInfo = await res.json();
            console.error("[useMongoDBDoc 404 Detail]", errorInfo);
          }
          throw new Error(`Failed to fetch product (Status: ${res.status})`);
        }
        const json = await res.json();
        setData({ ...json, id: json._id || json.id });
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, refreshKey]);

  return { data, isLoading, error, refetch: () => setRefreshKey(k => k + 1) };
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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/molecules/${id}`);
        if (!res.ok) throw new Error('Failed to fetch molecule');
        const json = await res.json();
        setData({ ...json, id: json._id || json.id });
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, refreshKey]);

  return { data, isLoading, error, refetch: () => setRefreshKey(k => k + 1) };
}
