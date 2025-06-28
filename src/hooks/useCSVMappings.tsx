
import { useState, useEffect } from 'react';

interface ColumnMapping {
  [internalField: string]: string;
}

interface SavedMapping {
  id: string;
  name: string;
  mapping: ColumnMapping;
  headers: string[];
  createdAt: string;
}

export const useCSVMappings = () => {
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);

  useEffect(() => {
    // Load saved mappings from localStorage
    const saved = localStorage.getItem('aurax-csv-mappings');
    if (saved) {
      try {
        setSavedMappings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved mappings:', error);
      }
    }
  }, []);

  const saveMapping = (name: string, mapping: ColumnMapping, headers: string[]) => {
    const newMapping: SavedMapping = {
      id: Date.now().toString(),
      name,
      mapping,
      headers,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedMappings.filter(m => m.name !== name), newMapping];
    setSavedMappings(updated);
    localStorage.setItem('aurax-csv-mappings', JSON.stringify(updated));
  };

  const loadMapping = (id: string): SavedMapping | null => {
    return savedMappings.find(m => m.id === id) || null;
  };

  const deleteMapping = (id: string) => {
    const updated = savedMappings.filter(m => m.id !== id);
    setSavedMappings(updated);
    localStorage.setItem('aurax-csv-mappings', JSON.stringify(updated));
  };

  const findSimilarMapping = (headers: string[]): SavedMapping | null => {
    // Find a mapping with similar headers (at least 70% match)
    for (const mapping of savedMappings) {
      const commonHeaders = headers.filter(h => mapping.headers.includes(h));
      const similarity = commonHeaders.length / Math.max(headers.length, mapping.headers.length);
      
      if (similarity >= 0.7) {
        return mapping;
      }
    }
    return null;
  };

  return {
    savedMappings,
    saveMapping,
    loadMapping,
    deleteMapping,
    findSimilarMapping
  };
};
