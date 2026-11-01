"use client"

import { useState, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface PageItem {
  url: string
  title?: string
  lastmod?: string
}

interface SitemapSelectorProps {
  pages: PageItem[]
  selectedUrls: Set<string>
  onSelectionChange: (urls: Set<string>) => void
  autoAddFuture: boolean
  onAutoAddChange: (enabled: boolean) => void
  isLoading?: boolean
}

export function SitemapSelector({ pages, selectedUrls, onSelectionChange, autoAddFuture, onAutoAddChange, isLoading = false }: SitemapSelectorProps) 
{  
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPages = useMemo(() => 
  {
    if (!searchQuery.trim()) 
    {
      return pages
    }

    const query = searchQuery.toLowerCase()
    return pages.filter( (page) => page.url.toLowerCase().includes(query) || (page.title && page.title.toLowerCase().includes(query)) )
  }, [pages, searchQuery])

  const handleToggleAll = () => 
  {
    if (selectedUrls.size === filteredPages.length) 
    {
      onSelectionChange(new Set())
    } 
    
    else 
    {
      onSelectionChange(new Set(filteredPages.map((p) => p.url)))
    }
  }

  const handleInvertSelection = () => 
  {
    const newSelection = new Set(selectedUrls)
    filteredPages.forEach((page) => 
    {
      if (newSelection.has(page.url)) 
      {
        newSelection.delete(page.url)
      } 
      
      else 
      {
        newSelection.add(page.url)
      }
    })
    onSelectionChange(newSelection)
  }

  const handleClear = () => 
  {
    onSelectionChange(new Set())
  }

  const handleTogglePage = (url: string) => 
  {
    const newSelection = new Set(selectedUrls)
    if (newSelection.has(url)) 
    {
      newSelection.delete(url)
    } 
    
    else 
    {
      newSelection.add(url)
    }
    onSelectionChange(newSelection)
  }

  const selectedCount = selectedUrls.size
  const filteredCount = filteredPages.length

  return (
    <div className="space-y-4">
      {}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="h-8 text-xs px-3"
              disabled={isLoading || filteredPages.length === 0}
            >
              {selectedUrls.size === filteredPages.length && filteredPages.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInvertSelection}
              className="h-8 text-xs px-3"
              disabled={isLoading || filteredPages.length === 0}
            >
              Invert Selection
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs px-3"
              disabled={isLoading || selectedUrls.size === 0}
            >
              Clear
            </Button>
          </div>
          <div className="text-xs text-gray-600">
            {selectedCount > 0 ? `${selectedCount} selected` : "0 items selected"} / {filteredCount} items
          </div>
        </div>
      </div>

      {}
      <div className="border border-gray-200 rounded-md max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Discovering pages...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {searchQuery ? "No pages found matching your search" : "No pages available"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPages.map((page) => {
              const isSelected = selectedUrls.has(page.url)
              return (
                <div
                  key={page.url}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleTogglePage(page.url)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {page.title || page.url}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {page.url}
                    </div>
                    {page.lastmod && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Last modified: {new Date(page.lastmod).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
        <Checkbox
          checked={autoAddFuture}
          onCheckedChange={(checked) => onAutoAddChange(checked === true)}
          disabled={isLoading}
          id="auto-add-future"
        />
        <label
          htmlFor="auto-add-future"
          className="text-xs text-gray-700 cursor-pointer"
        >
          Auto add future pages
        </label>
      </div>
    </div>
  )
}
