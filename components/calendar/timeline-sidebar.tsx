"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay, endOfDay, isSameDay, parseISO, addMinutes, differenceInMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { EventCard } from "./event-card";
import { CreateEventForm } from "./create-event-form";
import { EventDetailDialog } from "./event-detail-dialog";
import { getTimeSlots, calculateEventPosition, sortEventsByTime, formatTimeRange, formatDuration, snapToInterval, calculateEventColumns } from "@/lib/utils/calendar";
import { cn } from "@/lib/utils";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { emitTaskUpdate } from "@/lib/services/task-events";
import { useToast } from "@/providers/toast";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  taskId?: string | null;
  color?: string | null;
  isCompleted: boolean;
  source: string;
  task?: any;
};

type TimelineSidebarProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  startHour?: number;
  endHour?: number;
  slotInterval?: number;
};

type DragPreview = {
  startTime: Date;
  endTime: Date;
  title: string;
  duration: number;
};

export function TimelineSidebar({
  selectedDate = new Date(),
  onDateChange,
  startHour = 6,
  endHour = 22,
  slotInterval = 30,
}: TimelineSidebarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [prefilledStartTime, setPrefilledStartTime] = useState<Date | undefined>();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragDurationRef = useRef<number>(0);
  const { pushSuccess } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  const slotHeight = 32; // Height of one time slot in pixels (for 30 min slots)
  const snapInterval = 5; // Snap to 5 minute intervals
  const timeSlots = getTimeSlots(startHour, endHour, slotInterval, currentDate);

  // Fetch events with calendar sync
  const fetchEvents = useCallback(async () => {
    try {
      const startDate = startOfDay(currentDate).toISOString();
      const endDate = endOfDay(currentDate).toISOString();
      
      // Sync calendars first
      try {
        await fetch('/api/calendar-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate }),
        });
      } catch (syncError) {
        console.error('Calendar sync error:', syncError);
        // Continue to fetch events even if sync fails
      }
      
      const response = await fetch(`/api/calendar-events?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        // Parse dates
        const parsedEvents = data.map((event: any) => ({
          ...event,
          startTime: typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime,
          endTime: typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime,
        }));
        setEvents(sortEventsByTime(parsedEvents));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, fetchEvents]);

  // Update a single event in state without refetching (avoids sync loop)
  const handleEventUpdated = useCallback((updatedEvent: CalendarEvent) => {
    // Update in events list
    setEvents(prev => {
      const newEvents = prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
      return sortEventsByTime(newEvents);
    });
    
    // Update selectedEvent if it's the same one
    setSelectedEvent(prev => {
      if (prev?.id === updatedEvent.id) {
        return updatedEvent;
      }
      return prev;
    });
    
    // Note: We don't call emitTaskUpdate() here to avoid unnecessary fetches
    // The backend already handles task status synchronization
  }, []);

  // Update current time every minute to keep the red line moving
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (timelineRef.current && isSameDay(currentDate, new Date())) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= startHour && currentHour < endHour) {
        const scrollPosition = ((currentHour - startHour) * 60 / slotInterval) * slotHeight - 100;
        setTimeout(() => {
          timelineRef.current?.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [currentDate, startHour, endHour, slotInterval]);

  // Calculate time from mouse Y position
  const getTimeFromMouseY = useCallback((yPosition: number): Date => {
    if (!timelineRef.current) return new Date();
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = timelineRef.current.scrollTop;
    const relativeY = yPosition - rect.top + scrollTop;
    
    // Calculate minutes from start hour based on position
    // Use precise pixel-to-minute conversion
    const minutesFromStart = (relativeY / slotHeight) * slotInterval;
    
    // Create date and snap to interval (round to nearest, not up)
    const dayStart = startOfDay(currentDate);
    const timeWithoutSnap = addMinutes(dayStart, startHour * 60 + minutesFromStart);
    
    // Snap to nearest interval instead of rounding up
    const minutes = timeWithoutSnap.getHours() * 60 + timeWithoutSnap.getMinutes();
    const snappedMinutes = Math.round(minutes / snapInterval) * snapInterval;
    
    return addMinutes(dayStart, snappedMinutes);
  }, [currentDate, slotHeight, slotInterval, startHour, snapInterval]);

  // Mouse move handler for drag preview - NOT NEEDED, using onDrag instead
  // (Keeping for reference but commented out)

  // Setup drag and drop for tasks
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const cleanup = dropTargetForElements({
      element: el,
      getData: () => ({ timeline: true }),
      onDragEnter: ({ source, location }) => {
        setIsDraggedOver(true);
        const taskTitle = source.data.taskTitle as string;
        const taskDuration = (source.data.taskDuration as number) || 30;
        
        // Store duration in ref for mousemove handler
        dragDurationRef.current = taskDuration;
        
        // Calculate initial position from current mouse position
        const initialY = location.current.input.clientY;
        const initialStartTime = getTimeFromMouseY(initialY);
        const initialEndTime = addMinutes(initialStartTime, taskDuration);
        
        setDragPreview({
          startTime: initialStartTime,
          endTime: initialEndTime,
          title: taskTitle,
          duration: taskDuration,
        });
      },
      onDrag: ({ location }) => {
        // Update preview position during drag
        if (!timelineRef.current || dragDurationRef.current === 0) return;
        
        const currentY = location.current.input.clientY;
        const newStartTime = getTimeFromMouseY(currentY);
        const newEndTime = addMinutes(newStartTime, dragDurationRef.current);
        
        setDragPreview(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            startTime: newStartTime,
            endTime: newEndTime,
          };
        });
      },
      onDragLeave: () => {
        setIsDraggedOver(false);
        setDragPreview(null);
        dragDurationRef.current = 0;
      },
      onDrop: async ({ source, location }) => {
        setIsDraggedOver(false);
        
        const taskId = source.data.taskId as string;
        const taskTitle = source.data.taskTitle as string;
        const taskDuration = (source.data.taskDuration as number) || 30;
        
        if (!taskId) {
          setDragPreview(null);
          dragDurationRef.current = 0;
          return;
        }

        // Calculate final position from drop location (not from state!)
        const dropY = location.current.input.clientY;
        const finalStartTime = getTimeFromMouseY(dropY);
        const finalEndTime = addMinutes(finalStartTime, taskDuration);

        // Create event from task
        try {
          const response = await fetch("/api/calendar-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: taskTitle,
              startTime: finalStartTime.toISOString(),
              endTime: finalEndTime.toISOString(),
              taskId: taskId,
            }),
          });

          if (response.ok) {
            fetchEvents();
            emitTaskUpdate(); // Notify other components that tasks have been updated
            pushSuccess(
              "Task successfully planned",
              "You'll find your task in your calendar view"
            );
          }
        } catch (error) {
          console.error("Error creating event from task:", error);
        }
        
        setDragPreview(null);
        dragDurationRef.current = 0;
      },
    });

    return cleanup;
  }, [dragPreview, startHour, endHour, slotInterval, currentDate, fetchEvents, getTimeFromMouseY, pushSuccess]);

  const handleSlotClick = (slot: { time: Date }) => {
    setPrefilledStartTime(slot.time);
    setIsCreateFormOpen(true);
  };

  const handleEventClick = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsEventDetailOpen(true);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <NavButton
              size="sm"
              onClick={handlePreviousDay}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </NavButton>

            <div className="flex flex-col items-center">
              <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                {format(currentDate, "EEE")}
              </span>
              <span className={cn("text-2xl font-semibold", isToday && "text-primary")}>
                {format(currentDate, "d")}
              </span>
            </div>

            <NavButton
              size="sm"
              onClick={handleNextDay}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </NavButton>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div
        ref={timelineRef}
        className={cn(
          "flex-1 overflow-y-auto relative",
          isDraggedOver && "bg-primary/5"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading timeline...</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Time slots */}
            {timeSlots.map((slot, index) => {
              const isHourMark = slot.minute === 0;
              
              return (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className="relative flex"
                  style={{ height: `${slotHeight}px` }}
                >
                  {/* Time label - only show on hour marks */}
                  <div className="w-14 flex-shrink-0 border-r border-border/20">
                    {isHourMark && (
                      <div className="px-2 py-1 text-xs text-muted-foreground/60">
                        {slot.label}
                      </div>
                    )}
                  </div>

                  {/* Event area */}
                  <div 
                    className="flex-1 relative border-b border-border/40 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => handleSlotClick(slot)}
                  >
                    {/* Add event hint on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-80  transition-opacity">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        <span>Add event</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Events overlay */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              <div className="relative h-full">
                <AnimatePresence>
                  {(() => {
                    // Calculate column layout for overlapping events
                    const eventLayout = calculateEventColumns(events);
                    
                    // Group events that share the same conflict group
                    const processedGroups = new Set<string>();
                    const eventElements: JSX.Element[] = [];
                    
                    events.forEach((event) => {
                      const layout = eventLayout.get(event.id);
                      if (!layout) return;
                      
                      const { column, totalColumns, groupEvents } = layout;
                      
                      // If this is a single event (no conflicts), render normally
                      if (totalColumns === 1) {
                        const { top, height } = calculateEventPosition(
                          event,
                          slotHeight,
                          slotInterval,
                          startHour
                        );
                        
                        eventElements.push(
                          <DraggableEvent
                            key={event.id}
                            event={event}
                            top={top}
                            height={height}
                            column={0}
                            totalColumns={1}
                            slotHeight={slotHeight}
                            slotInterval={slotInterval}
                            startHour={startHour}
                            currentDate={currentDate}
                            onEventClick={handleEventClick}
                            onEventUpdate={fetchEvents}
                            getTimeFromMouseY={getTimeFromMouseY}
                            timelineRef={timelineRef}
                          />
                        );
                      } else {
                        // For overlapping events, check if we've already processed this group
                        const groupKey = groupEvents.map(e => e.id).sort().join('-');
                        
                        if (!processedGroups.has(groupKey)) {
                          processedGroups.add(groupKey);
                          
                          // Find the earliest and latest times for this group
                          const groupTop = Math.min(
                            ...groupEvents.map(e => 
                              calculateEventPosition(e, slotHeight, slotInterval, startHour).top
                            )
                          );
                          const groupBottom = Math.max(
                            ...groupEvents.map(e => {
                              const pos = calculateEventPosition(e, slotHeight, slotInterval, startHour);
                              return pos.top + pos.height;
                            })
                          );
                          const groupHeight = groupBottom - groupTop;
                          
                          // Create a flex container for this group
                          eventElements.push(
                            <div
                              key={`group-${groupKey}`}
                              className="absolute pointer-events-none flex gap-1"
                              style={{
                                top: `${groupTop}px`,
                                height: `${groupHeight}px`,
                                left: '56px', // w-14 = 56px
                                right: '12px', // pr-3 = 12px
                              }}
                            >
                              {Array.from({ length: totalColumns }).map((_, colIndex) => {
                                const eventInColumn = groupEvents.find(e => {
                                  const evLayout = eventLayout.get(e.id);
                                  return evLayout?.column === colIndex;
                                });
                                
                                if (!eventInColumn) {
                                  // Empty column spacer
                                  return <div key={`spacer-${colIndex}`} className="flex-1" />;
                                }
                                
                                const { top, height } = calculateEventPosition(
                                  eventInColumn,
                                  slotHeight,
                                  slotInterval,
                                  startHour
                                );
                                
                                // Calculate position relative to group
                                const relativeTop = top - groupTop;
                                
                                return (
                                  <div key={`col-${colIndex}`} className="flex-1 relative">
                                    <DraggableEvent
                                      event={eventInColumn}
                                      top={relativeTop}
                                      height={height}
                                      column={colIndex}
                                      totalColumns={totalColumns}
                                      slotHeight={slotHeight}
                                      slotInterval={slotInterval}
                                      startHour={startHour}
                                      currentDate={currentDate}
                                      onEventClick={handleEventClick}
                                      onEventUpdate={fetchEvents}
                                      getTimeFromMouseY={getTimeFromMouseY}
                                      timelineRef={timelineRef}
                                      isInFlexGroup={true}
                                      groupTop={groupTop}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      }
                    });
                    
                    return eventElements;
                  })()}
                </AnimatePresence>

                {/* Drag Preview */}
                {dragPreview && isDraggedOver && (
                  <div
                    className="absolute pointer-events-none z-50"
                    style={{
                      left: '56px',
                      right: '12px',
                      top: `${calculateEventPosition(
                        {
                          ...dragPreview,
                          id: 'preview',
                          isCompleted: false,
                          source: 'miniorg',
                        } as CalendarEvent,
                        slotHeight,
                        slotInterval,
                        startHour
                      ).top}px`,
                      height: `${Math.max(
                        calculateEventPosition(
                          {
                            ...dragPreview,
                            id: 'preview',
                            isCompleted: false,
                            source: 'miniorg',
                          } as CalendarEvent,
                          slotHeight,
                          slotInterval,
                          startHour
                        ).height,
                        40
                      )}px`,
                    }}
                  >
                    <div className="h-full w-full bg-primary/20 border-2 border-primary border-dashed rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-primary">
                          {dragPreview.title}
                        </p>
                        <p className="text-xs text-primary/80 font-medium">
                          {formatTimeRange(dragPreview.startTime, dragPreview.endTime)}
                        </p>
                        <p className="text-xs text-primary/60">
                          {formatDuration(dragPreview.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current time indicator */}
            {isToday && (() => {
              const currentHour = currentTime.getHours();
              const currentMinute = currentTime.getMinutes();
              
              if (currentHour >= startHour && currentHour < endHour) {
                const minutesFromStart = (currentHour - startHour) * 60 + currentMinute;
                const top = (minutesFromStart / slotInterval) * slotHeight;
                
                return (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{ 
                      top: `${top}px`,
                      left: '56px',
                      right: '0'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Create Event Form */}
      <CreateEventForm
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        prefilledStartTime={prefilledStartTime}
        onEventCreated={fetchEvents}
      />

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={isEventDetailOpen}
        onOpenChange={setIsEventDetailOpen}
        onEventUpdated={fetchEvents}
        onEventDeleted={fetchEvents}
      />
    </div>
  );
}

// Draggable Event Component with resize handles
type DraggableEventProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
  slotHeight: number;
  slotInterval: number;
  startHour: number;
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventUpdate: () => void;
  getTimeFromMouseY: (y: number) => Date;
  timelineRef: React.RefObject<HTMLDivElement>;
  isInFlexGroup?: boolean;
  groupTop?: number;
};

function DraggableEvent({
  event,
  top: initialTop,
  height: initialHeight,
  column,
  totalColumns,
  slotHeight,
  slotInterval,
  startHour,
  currentDate,
  onEventClick,
  onEventUpdate,
  getTimeFromMouseY,
  timelineRef,
  isInFlexGroup = false,
  groupTop = 0,
}: DraggableEventProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null);
  const eventRef = useRef<HTMLDivElement>(null);
  const topHandleRef = useRef<HTMLDivElement>(null);
  const bottomHandleRef = useRef<HTMLDivElement>(null);
  const [localPosition, setLocalPosition] = useState({ top: initialTop, height: initialHeight });
  const dragOffsetRef = useRef<number>(0);
  const [dragAbsoluteLeft, setDragAbsoluteLeft] = useState<number>(0);
  const [dragAbsoluteWidth, setDragAbsoluteWidth] = useState<number>(0);
  const [dragPreviewTimes, setDragPreviewTimes] = useState<{ start: Date; end: Date } | null>(null);

  // Update local position when props change
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setLocalPosition({ top: initialTop, height: initialHeight });
    }
  }, [initialTop, initialHeight, isDragging, isResizing]);

  // Setup draggable for the event itself (move)
  useEffect(() => {
    const el = eventRef.current;
    if (!el || !timelineRef.current) return;

    return draggable({
      element: el,
      canDrag: () => true,
      getInitialData: () => ({
        eventId: event.id,
        type: 'move',
      }),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        // Disable the native drag preview to prevent horizontal movement
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        nativeSetDragImage?.(canvas, 0, 0);
      },
      onDragStart: ({ location }) => {
        setIsDragging(true);
        
        // Calculate offset between mouse position and top of event
        // Also capture absolute position for flex group events
        if (eventRef.current && timelineRef.current) {
          const eventRect = eventRef.current.getBoundingClientRect();
          const timelineRect = timelineRef.current.getBoundingClientRect();
          const mouseY = location.current.input.clientY;
          const eventTop = eventRect.top;
          dragOffsetRef.current = mouseY - eventTop;
          
          // Store absolute position and width for positioning during drag
          if (isInFlexGroup) {
            setDragAbsoluteLeft(eventRect.left - timelineRect.left);
            setDragAbsoluteWidth(eventRect.width);
          }
        }
      },
      onDrag: ({ location }) => {
        if (!timelineRef.current) return;
        
        const currentY = location.current.input.clientY;
        // Adjust for the offset to align the top of the event, not the cursor
        const adjustedY = currentY - dragOffsetRef.current;
        const newStartTime = getTimeFromMouseY(adjustedY);
        const duration = differenceInMinutes(event.endTime, event.startTime);
        const newEndTime = addMinutes(newStartTime, duration);

        // Update preview times for display
        setDragPreviewTimes({ start: newStartTime, end: newEndTime });

        // Calculate new position
        const { top } = calculateEventPosition(
          { ...event, startTime: newStartTime, endTime: newEndTime },
          slotHeight,
          slotInterval,
          startHour
        );

        // For flex group events, adjust top to be relative to timeline during drag, not group
        const adjustedTop = isInFlexGroup ? top : top;
        setLocalPosition(prev => ({ ...prev, top: adjustedTop }));
      },
      onDrop: async ({ location }) => {
        setIsDragging(false);
        
        const dropY = location.current.input.clientY;
        // Adjust for the offset to align the top of the event, not the cursor
        const adjustedY = dropY - dragOffsetRef.current;
        const newStartTime = getTimeFromMouseY(adjustedY);
        const duration = differenceInMinutes(event.endTime, event.startTime);
        const newEndTime = addMinutes(newStartTime, duration);

        // Reset offset, absolute positioning, and preview times
        dragOffsetRef.current = 0;
        setDragAbsoluteLeft(0);
        setDragAbsoluteWidth(0);
        setDragPreviewTimes(null);

        // Update event
        try {
          const response = await fetch("/api/calendar-events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: event.id,
              startTime: newStartTime.toISOString(),
              endTime: newEndTime.toISOString(),
            }),
          });

          if (response.ok) {
            onEventUpdate();
            // If event is linked to a task, notify other components
            if (event.taskId) {
              emitTaskUpdate();
            }
          }
        } catch (error) {
          console.error("Error updating event:", error);
          // Reset position on error
          setLocalPosition({ top: initialTop, height: initialHeight });
        }
      },
    });
  }, [event, slotHeight, slotInterval, startHour, getTimeFromMouseY, onEventUpdate, timelineRef, initialTop, initialHeight, isInFlexGroup]);

  // Setup draggable for top handle (resize from top)
  useEffect(() => {
    const el = topHandleRef.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({
        eventId: event.id,
        type: 'resize-top',
      }),
      onDragStart: () => {
        setIsResizing(true);
        setResizeDirection('top');
        // Initialize preview times
        setDragPreviewTimes({ start: event.startTime, end: event.endTime });
      },
      onDrag: ({ location }) => {
        if (!timelineRef.current) return;
        
        const currentY = location.current.input.clientY;
        const newStartTime = getTimeFromMouseY(currentY);
        
        // Don't allow start time to be after end time
        if (newStartTime >= event.endTime) return;

        // Update preview times
        setDragPreviewTimes({ start: newStartTime, end: event.endTime });

        const { top, height } = calculateEventPosition(
          { ...event, startTime: newStartTime },
          slotHeight,
          slotInterval,
          startHour
        );

        setLocalPosition({ top, height });
      },
      onDrop: async ({ location }) => {
        setIsResizing(false);
        setResizeDirection(null);
        setDragPreviewTimes(null);
        
        const dropY = location.current.input.clientY;
        const newStartTime = getTimeFromMouseY(dropY);
        
        // Don't allow start time to be after end time
        if (newStartTime >= event.endTime) {
          setLocalPosition({ top: initialTop, height: initialHeight });
          return;
        }

        // Update event
        try {
          const response = await fetch("/api/calendar-events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: event.id,
              startTime: newStartTime.toISOString(),
            }),
          });

          if (response.ok) {
            onEventUpdate();
            // If event is linked to a task, notify other components (start time changed)
            if (event.taskId) {
              emitTaskUpdate();
            }
          }
        } catch (error) {
          console.error("Error updating event:", error);
          setLocalPosition({ top: initialTop, height: initialHeight });
        }
      },
    });
  }, [event, slotHeight, slotInterval, startHour, getTimeFromMouseY, onEventUpdate, timelineRef, initialTop, initialHeight]);

  // Setup draggable for bottom handle (resize from bottom)
  useEffect(() => {
    const el = bottomHandleRef.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({
        eventId: event.id,
        type: 'resize-bottom',
      }),
      onDragStart: () => {
        setIsResizing(true);
        setResizeDirection('bottom');
        // Initialize preview times
        setDragPreviewTimes({ start: event.startTime, end: event.endTime });
      },
      onDrag: ({ location }) => {
        if (!timelineRef.current) return;
        
        const currentY = location.current.input.clientY;
        const newEndTime = getTimeFromMouseY(currentY);
        
        // Don't allow end time to be before start time
        if (newEndTime <= event.startTime) return;

        // Update preview times
        setDragPreviewTimes({ start: event.startTime, end: newEndTime });

        const { height } = calculateEventPosition(
          { ...event, endTime: newEndTime },
          slotHeight,
          slotInterval,
          startHour
        );

        setLocalPosition(prev => ({ ...prev, height }));
      },
      onDrop: async ({ location }) => {
        setIsResizing(false);
        setResizeDirection(null);
        setDragPreviewTimes(null);
        
        const dropY = location.current.input.clientY;
        const newEndTime = getTimeFromMouseY(dropY);
        
        // Don't allow end time to be before start time
        if (newEndTime <= event.startTime) {
          setLocalPosition({ top: initialTop, height: initialHeight });
          return;
        }

        // Update event
        try {
          const response = await fetch("/api/calendar-events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: event.id,
              endTime: newEndTime.toISOString(),
            }),
          });

          if (response.ok) {
            onEventUpdate();
          }
        } catch (error) {
          console.error("Error updating event:", error);
          setLocalPosition({ top: initialTop, height: initialHeight });
        }
      },
    });
  }, [event, slotHeight, slotInterval, startHour, getTimeFromMouseY, onEventUpdate, timelineRef, initialTop, initialHeight]);

  return (
    <div
      ref={eventRef}
      className={cn(
        "pointer-events-auto group",
        // During drag of flex group events, position fixed to break out of flex context
        isDragging && isInFlexGroup ? "fixed" : "absolute",
        (isDragging || isResizing) && "z-50"
      )}
      style={{
        // During drag of flex group events, use coordinates relative to viewport
        ...(isDragging && isInFlexGroup && timelineRef.current
          ? (() => {
              const timelineRect = timelineRef.current.getBoundingClientRect();
              const scrollTop = timelineRef.current.scrollTop;
              return {
                top: `${timelineRect.top + localPosition.top - scrollTop}px`,
                left: `${timelineRect.left + dragAbsoluteLeft}px`,
                width: `${dragAbsoluteWidth}px`,
                height: `${Math.max(localPosition.height, 40)}px`,
              };
            })()
          : {
              top: `${localPosition.top}px`,
              height: `${Math.max(localPosition.height, 40)}px`,
              left: isInFlexGroup ? '0' : '56px',
              right: isInFlexGroup ? '0' : '12px',
            }
        ),
        touchAction: 'pan-y', // Only allow vertical panning
      }}
    >
      {/* Top resize handle */}
      <div
        ref={topHandleRef}
        className={cn(
          "absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10",
          "hover:bg-primary/20 active:bg-primary/40"
        )}
        style={{ touchAction: 'none' }}
      />
      
      {/* Event Card */}
      <div className={cn(
        "h-full transition-all",
        (isDragging || isResizing) && "cursor-ns-resize opacity-80 scale-[1.02] shadow-lg"
      )}>
        {(isDragging || isResizing) && dragPreviewTimes ? (
          // During drag/resize, show a simplified card with just the time range
          <div
            className="relative px-2 py-1.5 rounded h-full flex items-center border border-solid"
            style={{
              borderColor: event.taskId ? "hsl(17 78% 62%)" : (event.color || "#9ca3af"),
              backgroundColor: event.taskId ? "hsl(17 78% 62% / 0.1)" : `${event.color || "#9ca3af"}10`,
            }}
          >
            <p
              className="text-xs font-bold leading-tight"
              style={{ color: event.taskId ? "hsl(17 78% 62%)" : (event.color || "#9ca3af") }}
            >
              {format(dragPreviewTimes.start, 'HH:mm')} - {format(dragPreviewTimes.end, 'HH:mm')}
            </p>
          </div>
        ) : (
          <EventCard
            event={event}
            onClick={onEventClick}
            compact={localPosition.height < 80}
            className="h-full"
          />
        )}
      </div>

      {/* Bottom resize handle */}
      <div
        ref={bottomHandleRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10",
          "hover:bg-primary/20 active:bg-primary/40"
        )}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
