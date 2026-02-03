"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { Input } from "./input"
import * as ReactDOM from "react-dom"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  onBlur?: () => void
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  disabled = false,
  onBlur,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [contentWidth, setContentWidth] = React.useState<number | undefined>(undefined)

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  React.useEffect(() => {
    if (open && triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  return (
    <div className="w-full relative overflow-visible">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between rounded-none bg-white z-10 relative",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            onBlur={onBlur}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* Render PopoverContent into a portal to prevent clipping */}
        {open &&
          ReactDOM.createPortal(
            <div
              className="absolute"
              style={{
                position: "absolute",
                zIndex: 99999,
                width: contentWidth || "auto",
                top:
                  triggerRef.current?.getBoundingClientRect().bottom ?? 0,
                left: triggerRef.current?.getBoundingClientRect().left ?? 0,
              }}
            >
              <PopoverContent
                className="p-0 w-full shadow-lg border border-gray-200 bg-white rounded-md"
                align="start"
                side="bottom"
                sideOffset={4}
                style={{
                  width: contentWidth ? `${contentWidth}px` : undefined,
                  maxWidth: contentWidth ? `${contentWidth}px` : undefined,
                  minWidth: contentWidth ? `${contentWidth}px` : undefined,
                }}
              >
                <div className="p-2">
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto overflow-x-hidden w-full">
                  {filteredOptions.length > 0 ? (
                    <div className="p-1 w-full">
                      {filteredOptions.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full",
                            value === option.value && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => {
                            onValueChange?.(option.value)
                            setSearchValue("")
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              value === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate flex-1">{option.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm text-center w-full">
                      {options.length === 0 ? "No options available" : "No options found"}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </div>,
            document.body
          )}
      </Popover>
    </div>
  )
}
