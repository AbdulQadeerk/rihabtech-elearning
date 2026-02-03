import { Search } from "lucide-react";
import { useEffect, useState, useRef, JSX } from "react";
import { courseApiService, SearchCourseResponse } from "../utils/courseApiService";

// Define types
interface SearchResult {
  type: 'course';
  course: SearchCourseResponse;
}

// Helper function to highlight matched text
const highlightText = (text: string, searchTerm: string): (string | JSX.Element)[] => {
  if (!searchTerm || !text) return [text];
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part: string, index: number) => 
    regex.test(part) ? 
      <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
      part
  );
};

export default function SearchWithPopup() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [searchTxt, setSearchtext] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial load - fetch all courses when component mounts
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        setLoading(true);
        const results = await courseApiService.searchCourses({});
        setFilteredResults(results.map(course => ({
          type: 'course' as const,
          course
        })));
      } catch (error) {
        console.error("Error loading courses:", error);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllCourses();
  }, []);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!searchTxt.trim()) {
      // If search is empty, show all courses
      const loadAllCourses = async () => {
        try {
          setLoading(true);
          const results = await courseApiService.searchCourses({});
          setFilteredResults(results.map(course => ({
            type: 'course' as const,
            course
          })));
        } catch (error) {
          console.error("Error loading courses:", error);
          setFilteredResults([]);
        } finally {
          setLoading(false);
        }
      };
      loadAllCourses();
      return;
    }

    // Perform search with searchText
    const searchCourses = async () => {
      try {
        setLoading(true);
        const results = await courseApiService.searchCourses({ searchText: searchTxt });
        setFilteredResults(results.map(course => ({
          type: 'course' as const,
          course
        })));
      } catch (error) {
        console.error("Error searching courses:", error);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchCourses();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchTxt]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchtext(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchtext(result.course.title || '');
    console.log('Navigating to course details for course ID:', result);
    window.location.href = `#/courseDetails?courseId=${result.course.id}`;
  };

  const handleClearSearch = () => {
    setSearchtext('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="hidden md:block relative flex-grow mb-4">
      <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-500 z-10" size={22} />
      <input
        ref={inputRef}
        type="text"
        value={searchTxt}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder="Search courses..."
        className="bg-neutral-100 border-none rounded-[27px] w-full pl-12 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      
      {/* Custom Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-auto z-50">
          {filteredResults.length > 0 ? (
            <>
              {/* Search Results Header */}
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <p className="text-sm text-gray-600">
                  {searchTxt ? `${filteredResults.length} results for "${searchTxt}"` : 'All courses'}
                </p>
                {searchTxt && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Clear search
                  </button>
                )}
              </div>
              
              {/* Results */}
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="mt-2 text-gray-600 text-sm">Searching...</p>
                </div>
              ) : (
                filteredResults.map((result, idx) => (
                  <div
                    key={`${result.course.id}-${idx}`}
                    className="flex items-start gap-4 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="w-24 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {result.course.thumbnailUrl ? (
                        <img
                          src={result.course.thumbnailUrl}
                          alt={result.course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/Logos/brand-icon.png';
                          }}
                        />
                      ) : (
                        <img
                          src='/Logos/brand-icon.png'
                          alt={result.course.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {highlightText(result.course.title || '', searchTxt)}
                      </h3>
                      
                      {result.course.description && (
                        <p 
                          className="text-xs text-gray-600 mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: result.course.description }}
                        />
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {result.course.category && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {result.course.category}
                          </span>
                        )}
                        {result.course.subCategory && (
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {result.course.subCategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <Search size={32} className="mx-auto" />
              </div>
              <p className="text-gray-600">
                {searchTxt ? `No courses found for "${searchTxt}"` : 'Start typing to search courses'}
              </p>
              {searchTxt && (
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  Clear search and browse all courses
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}