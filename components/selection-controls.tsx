"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Check } from "lucide-react"

interface SelectionControlsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
}

export function SelectionControls({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
}: SelectionControlsProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {selectedCount} de {totalCount} foto{totalCount !== 1 ? "s" : ""} selecionada{selectedCount !== 1 ? "s" : ""}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSelectAll}
            variant="outline"
            className="gap-2 bg-transparent"
            disabled={selectedCount === totalCount}
          >
            <Check className="w-4 h-4" />
            Selecionar Todas
          </Button>

          <Button
            onClick={onClearSelection}
            variant="outline"
            className="gap-2 bg-transparent"
            disabled={selectedCount === 0}
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Seleção
          </Button>
        </div>
      </div>
    </div>
  )
}
