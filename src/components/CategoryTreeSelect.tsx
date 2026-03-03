import * as React from "react"
import { Check, ChevronRight, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CategoryNode } from "@/types"

interface CategoryTreeSelectProps {
  categories: CategoryNode[]
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CategoryTreeSelect({
  categories,
  value,
  onChange,
  placeholder = "Select Domain...",
  className,
  disabled,
}: CategoryTreeSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (path: string[]) => {
    onChange(path)
    setOpen(false)
  }

  const selectedLabel = value && value.length > 0 ? value.join(" > ") : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-xs h-9 px-3 border-slate-200 bg-white hover:bg-slate-50",
            !value?.length && "text-slate-500",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-2 bg-white" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          <CategoryList
            nodes={categories}
            selectedPath={value || []}
            onSelect={handleSelect}
            level={0}
            currentPath={[]}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CategoryListProps {
  nodes: CategoryNode[]
  selectedPath: string[]
  onSelect: (path: string[]) => void
  level: number
  currentPath: string[]
}

function CategoryList({ nodes, selectedPath, onSelect, level, currentPath }: CategoryListProps) {
  if (nodes.length === 0) return null

  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        const nodePath = [...currentPath, node.name]
        const isSelected =
          selectedPath.length === nodePath.length &&
          selectedPath.every((part, i) => part === nodePath[i])
        
        // Check if this node is in the current selected path (parent of selected)
        const isAncestor = selectedPath.length > nodePath.length && 
          nodePath.every((part, i) => part === selectedPath[i])

        const hasChildren = node.children && node.children.length > 0
        const isExpandedInitial = isAncestor || isSelected
        
        // Simple expansion state - auto expand if ancestor, otherwise collapsed by default unless manually toggled?
        // For simplicity in this "Select" component, let's keep it simple: always show children if expanded.
        // But standard tree select usually has expand toggles. 
        // Let's implement a local expand state.
        
        return (
          <CategoryItem
            key={node.id}
            node={node}
            nodePath={nodePath}
            selectedPath={selectedPath}
            onSelect={onSelect}
            level={level}
            hasChildren={!!hasChildren}
            initialExpanded={isExpandedInitial}
          />
        )
      })}
    </div>
  )
}

function CategoryItem({
  node,
  nodePath,
  selectedPath,
  onSelect,
  level,
  hasChildren,
  initialExpanded,
}: {
  node: CategoryNode
  nodePath: string[]
  selectedPath: string[]
  onSelect: (path: string[]) => void
  level: number
  hasChildren: boolean
  initialExpanded: boolean
}) {
  const [expanded, setExpanded] = React.useState(initialExpanded)
  
  // Update expanded if external selection changes and this becomes an ancestor
  React.useEffect(() => {
    if (initialExpanded) {
      setExpanded(true)
    }
  }, [initialExpanded])

  const isSelected =
    selectedPath.length === nodePath.length &&
    selectedPath.every((part, i) => part === nodePath[i])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleClick = () => {
    onSelect(nodePath)
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none cursor-pointer transition-colors",
          isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50 text-slate-700"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <div
            role="button"
            className="h-4 w-4 shrink-0 flex items-center justify-center rounded-sm hover:bg-slate-200/50 text-slate-400"
            onClick={handleToggle}
          >
            <ChevronRight
              className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")}
            />
          </div>
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1 truncate">{node.name}</span>
        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
      </div>
      {hasChildren && expanded && node.children && (
        <CategoryList
          nodes={node.children}
          selectedPath={selectedPath}
          onSelect={onSelect}
          level={level + 1}
          currentPath={nodePath}
        />
      )}
    </div>
  )
}
