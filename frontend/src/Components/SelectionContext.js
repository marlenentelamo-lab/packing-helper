import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = "packing-helper-selection";

const SelectionContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SelectionProvider({ children }) {
  const [selected, setSelected] = useState(readStored);

  useEffect(() => {
    try {
      if (selected) localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }, [selected]);

  return (
    <SelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used inside <SelectionProvider>");
  return ctx;
}

export default SelectionContext;