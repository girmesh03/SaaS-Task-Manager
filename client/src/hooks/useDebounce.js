/**
 * useDebounce Hook - Debounce Hook
 *
 * Custom hook for debouncing values.
 * Delays updating the value until after the specified delay.
 *
 * Useful for:
 * - Search inputs (wait for user to stop typing)
 * - Filter inputs (reduce API calls)
 * - Resize handlers (reduce re-renders)
 *
 * Requirements: 16.1, 23.8
 */

import { useState, useEffect } from "react";

/**
 * useDebounce hook
 *
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 *
 * @returns {any} Debounced value
 *
 * @example
 * // Basic usage with search input
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after user stops typing
 *   if (debouncedSearchTerm) {
 *     fetchSearchResults(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 *
 * return (
 *   <input
 *     value={searchTerm}
 *     onChange={(e) => setSearchTerm(e.target.value)}
 *     placeholder="Search..."
 *   />
 * );
 *
 * @example
 * // With filter component
 * const FilterTextField = ({ onChange }) => {
 *   const [value, setValue] = useState("");
 *   const debouncedValue = useDebounce(value, 300);
 *
 *   useEffect(() => {
 *     // Emit onChange only after user stops typing
 *     onChange(debouncedValue);
 *   }, [debouncedValue, onChange]);
 *
 *   return (
 *     <TextField
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *     />
 *   );
 * };
 *
 * @example
 * // With custom delay
 * const [windowWidth, setWindowWidth] = useState(window.innerWidth);
 * const debouncedWidth = useDebounce(windowWidth, 500);
 *
 * useEffect(() => {
 *   const handleResize = () => setWindowWidth(window.innerWidth);
 *   window.addEventListener("resize", handleResize);
 *   return () => window.removeEventListener("resize", handleResize);
 * }, []);
 *
 * useEffect(() => {
 *   // This will only run 500ms after user stops resizing
 *   console.log("Window width:", debouncedWidth);
 * }, [debouncedWidth]);
 *
 * @example
 * // With API call
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 *
 * const { data, isLoading } = useGetTasksQuery(
 *   { search: debouncedQuery },
 *   { skip: !debouncedQuery }
 * );
 *
 * // API call only happens 300ms after user stops typing
 */
const useDebounce = (value, delay = 300) => {
  // State to store debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel timeout if value changes before delay
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
};

export default useDebounce;
