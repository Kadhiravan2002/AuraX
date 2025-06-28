
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

  const saveMapping = async (mappingData: { name: string; mapping: ColumnMapping; headers: string[] }): Promise<boolean> => {
    try {
      const newMapping: SavedMapping = {
        id: Date.now().toString(),
        name: mappingData.name,
        mapping: mappingData.mapping,
        headers: mappingData.headers,
        createdAt: new Date().toISOString()
      };

      const updated = [...savedMappings.filter(m => m.name !== mappingData.name), newMapping];
      setSavedMappings(updated);
      localStorage.setItem('aurax-csv-mappings', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save mapping:', error);
      return false;
    }
  };

  const loadMapping = async (id: string): Promise<SavedMapping | null> => {
    return savedMappings.find(m => m.id === id) || null;
  };

  const deleteMapping = async (id: string): Promise<boolean> => {
    try {
      const updated = savedMappings.filter(m => m.id !== id);
      setSavedMappings(updated);
      localStorage.setItem('aurax-csv-mappings', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      return false;
    }
  };

  const findSimilarMapping = async (headers: string[]): Promise<SavedMapping | null> => {
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
