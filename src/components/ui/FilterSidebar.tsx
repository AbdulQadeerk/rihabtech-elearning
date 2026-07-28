import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "./checkbox";
import { courseApiService, SubCategory } from "../../utils/courseApiService";

type FilterAccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function FilterAccordion({ title, children, defaultOpen = true }: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <ChevronDown 
          className={`transform transition-transform duration-200 text-gray-600 ${isOpen ? 'rotate-180' : ''}`} 
          size={18} 
        />
      </button>
      
      <div className={`transition-all duration-300 ${isOpen ? 'mt-4 max-h-96 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {children}
      </div>
    </div>
  );
}

// Filter Content Component with Accordions
export function FilterSidebar({ 
  categoryId,
  selectedCategories,
  setSelectedCategories,
  selectedRatings, 
  setSelectedRatings, 
  selectedPrice, 
  setSelectedPrice, 
  selectedDuration, 
  setSelectedDuration, 
  selectedTopics, 
  setSelectedTopics,
  hideCategories = false
}: {
  categoryId?: string;
  selectedCategories: string[];
  setSelectedCategories: (value: string[]) => void;
  selectedRatings: string[];
  setSelectedRatings: (value: string[]) => void;
  selectedPrice: string[];
  setSelectedPrice: (value: string[]) => void;
  selectedDuration: string[];
  setSelectedDuration: (value: string[]) => void;
  selectedTopics: string[];
  setSelectedTopics: (value: string[]) => void;
  hideCategories?: boolean;
}) {
  // State for expanded sections
  const [showMoreDuration, setShowMoreDuration] = useState(false);
  const [showMoreTopics, setShowMoreTopics] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [additionalTopics, setadditionalTopics] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Additional items that will show when "Show more" is clicked
  const additionalDurations = [
    { id: "duration-17-plus", label: "17+ Hours" },
    { id: "duration-all", label: "All Durations" }
  ];

  useEffect(() => {
    courseApiService.getPublicCategories().then(data => setCategories(data));
  }, []);

  useEffect(() => {
    // Simulate fetching additional topics from an API or data source
    const fetchAdditionalTopics = async () => {
      // Replace this with actual data fetching logic if needed 
      courseApiService.getPublicSubCategories().then((data) => {
        let filteredData = data;
        if (selectedCategories && selectedCategories.length > 0) {
          filteredData = data.filter(c => selectedCategories.includes(String(c.categoryId)));
        } else if (categoryId) {
          filteredData = data.filter(c => c.categoryId === parseInt(categoryId, 10));
        }
        setadditionalTopics(filteredData as any);
      });
    }
    fetchAdditionalTopics();
  }, [selectedCategories, categoryId]);


  // Handle price filter changes
  const handlePriceChange = (priceType: string, checked: boolean) => {
    if (checked) {
      setSelectedPrice([...selectedPrice, priceType]);
    } else {
      setSelectedPrice(selectedPrice.filter(p => p !== priceType));
    }
  };

  // Handle duration filter changes
  const handleDurationChange = (durationId: string, checked: boolean) => {
    if (checked) {
      setSelectedDuration([...selectedDuration, durationId]);
    } else {
      setSelectedDuration(selectedDuration.filter(d => d !== durationId));
    }
  };

  // Handle topic filter changes
  const handleTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topicId]);
    } else {
      setSelectedTopics(selectedTopics.filter(t => t !== topicId));
    }
  };

  // Handle category filter changes
  const handleCategoryChange = (catId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([catId]); // API currently supports one category, so overwrite
      setSelectedTopics([]); // Reset subcategories when category changes
    } else {
      setSelectedCategories([]);
      setSelectedTopics([]);
    }
  };

  return (
    <div className="space-y-1 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
      
      {/* Category Filter */}
      {!hideCategories && (
      <FilterAccordion title="Category">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {categories.length > 0 && (
            <>
              {categories.map((cat: any, index: number) => {
                if (!showMoreCategories && index > 4) {
                  return null;
                }
                return (
                  <div key={cat.id} className="flex items-center">
                    <Checkbox 
                      id={`cat-${cat.id}`} 
                      className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      checked={selectedCategories.includes(String(cat.id))}
                      onCheckedChange={(checked) => handleCategoryChange(String(cat.id), checked as boolean)}
                    />
                    <label htmlFor={`cat-${cat.id}`} className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none truncate max-w-[200px]">{cat.title}</label>
                  </div>
                );
              })}
            </>
          )}
        </div>
        {categories.length > 5 && (
          <button 
            className="text-primary mt-3 text-sm font-medium hover:underline focus:outline-none"
            onClick={() => setShowMoreCategories(!showMoreCategories)}
          >
            {showMoreCategories ? "Show less" : "Show more"}
          </button>
        )}
      </FilterAccordion>
      )}

      {/* Topic Filter */}
      {!hideCategories && (
      <FilterAccordion title="Sub Category">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {additionalTopics.length === 0 && (
             <p className="text-[#666666] text-[13px] font-normal italic">
                {selectedCategories.length > 0 || categoryId ? 'No subcategories found' : 'Select a category to see subcategories'}
              </p>
          )}
          {additionalTopics.length > 0 && (
            <>
              {additionalTopics.map((topic: any, index: number) => {
                // Show first 5 topics always, others only when "Show more" is clicked
                if (!showMoreTopics && index > 4) {
                  return null;
                }
                return (
                  <div key={topic.id} className="flex items-center">
                    <Checkbox 
                      id={String(topic.id)} 
                      className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      checked={selectedTopics.includes(String(topic.id))}
                      onCheckedChange={(checked) => handleTopicChange(String(topic.id), checked as boolean)}
                    />
                    <label htmlFor={String(topic.id)} className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none truncate max-w-[200px]">{topic.title || topic.name || topic.subCategoryName}</label>
                  </div>
                );
              })}
            </>
          )}
        </div>
        {additionalTopics.length > 5 && (
          <button 
            className="text-primary mt-3 text-sm font-medium hover:underline focus:outline-none"
            onClick={() => setShowMoreTopics(!showMoreTopics)}
          >
            {showMoreTopics ? "Show less" : "Show more"}
          </button>
        )}
      </FilterAccordion>
      )}

      {/* Price Filter */}
      <FilterAccordion title="Price">
        <div className="space-y-3">
          <div className="flex items-center">
            <Checkbox 
              id="free" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedPrice.includes('free')}
              onCheckedChange={(checked) => handlePriceChange('free', checked as boolean)}
            />
            <label htmlFor="free" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">Free</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="paid" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedPrice.includes('paid')}
              onCheckedChange={(checked) => handlePriceChange('paid', checked as boolean)}
            />
            <label htmlFor="paid" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">Paid</label>
          </div>
        </div>
      </FilterAccordion>

      {/* Video Duration Filter */}
      <FilterAccordion title="Video Duration">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <div className="flex items-center">
            <Checkbox 
              id="duration-0-1" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedDuration.includes('duration-0-1')}
              onCheckedChange={(checked) => handleDurationChange('duration-0-1', checked as boolean)}
            />
            <label htmlFor="duration-0-1" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">0-1 Hour</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-1-3" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedDuration.includes('duration-1-3')}
              onCheckedChange={(checked) => handleDurationChange('duration-1-3', checked as boolean)}
            />
            <label htmlFor="duration-1-3" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">1-3 Hours</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-3-6" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedDuration.includes('duration-3-6')}
              onCheckedChange={(checked) => handleDurationChange('duration-3-6', checked as boolean)}
            />
            <label htmlFor="duration-3-6" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">3-6 Hours</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-6-17" 
              className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
              checked={selectedDuration.includes('duration-6-17')}
              onCheckedChange={(checked) => handleDurationChange('duration-6-17', checked as boolean)}
            />
            <label htmlFor="duration-6-17" className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">6-17 Hours</label>
          </div>
          
          {showMoreDuration && additionalDurations.map((duration) => (
            <div key={duration.id} className="flex items-center">
              <Checkbox 
                id={duration.id} 
                className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                checked={selectedDuration.includes(duration.id)}
                onCheckedChange={(checked) => handleDurationChange(duration.id, checked as boolean)}
              />
              <label htmlFor={duration.id} className="text-[#666666] text-[15px] font-normal leading-snug cursor-pointer select-none">{duration.label}</label>
            </div>
          ))}
        </div>
        
        <button 
          className="text-primary mt-3 text-sm font-medium hover:underline focus:outline-none"
          onClick={() => setShowMoreDuration(!showMoreDuration)}
        >
          {showMoreDuration ? "Show less" : "Show more"}
        </button>
      </FilterAccordion>

      {/* Ratings Filter */}
      <FilterAccordion title="Ratings">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {[4.5, 4.0, 3.5, 3.0].map((rating) => (
            <div key={`rating-${rating}`} className="flex items-center">
              <Checkbox 
                id={`rating-${rating}`} 
                className="mr-3 rounded-[4px] border-[#e6e6e6] data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                checked={selectedRatings.includes(String(rating))}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedRatings([...selectedRatings, String(rating)]);
                  } else {
                    setSelectedRatings(selectedRatings.filter(r => r !== String(rating)));
                  }
                }}
              />
              <label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer select-none text-[#666666] text-[15px] font-normal">
                <span className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </span>
                {rating} & up
              </label>
            </div>
          ))}
        </div>
      </FilterAccordion>
    </div>
  );
}