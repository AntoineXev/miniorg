"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export function DatePicker({
  date,
  onDateChange,
  onClear,
  placeholder = "Pick a date",
  className,
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 text-sm border-0 focus:ring-0 w-auto px-2",
              !date && "text-muted-foreground",
              triggerClassName
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onDateChange(newDate)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2"
        >
          <X className="h-3 w-3" strokeWidth={1.5} />
        </Button>
      )}
    </div>
  )
}
