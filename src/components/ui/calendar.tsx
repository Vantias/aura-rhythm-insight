import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface CalendarProps {
  className?: string;
  classNames?: {
    months?: string;
    month?: string;
    caption?: string;
    caption_label?: string;
    nav?: string;
    nav_button?: string;
    nav_button_previous?: string;
    nav_button_next?: string;
    table?: string;
    head_row?: string;
    head_cell?: string;
    row?: string;
    cell?: string;
    day?: string;
    day_selected?: string;
    day_today?: string;
    day_outside?: string;
    day_disabled?: string;
    day_range_middle?: string;
    day_hidden?: string;
  };
  showOutsideDays?: boolean;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single";
  disabled?: (date: Date) => boolean;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  mode = "single",
  disabled,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  );

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (disabled && disabled(clickedDate)) return;
    onSelect?.(clickedDate);
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selected.toDateString() === date.toDateString();
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return today.toDateString() === date.toDateString();
  };

  const isDisabled = (day: number) => {
    if (!disabled) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return disabled(date);
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's trailing days
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
  const prevMonthDays = prevMonth.getDate();
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    if (showOutsideDays) {
      calendarDays.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    } else {
      calendarDays.push({ day: null, isCurrentMonth: false, isPrevMonth: true });
    }
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true, isPrevMonth: false });
  }

  // Next month's leading days
  const remainingCells = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    if (showOutsideDays) {
      calendarDays.push({
        day,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    } else {
      calendarDays.push({ day: null, isCurrentMonth: false, isPrevMonth: false });
    }
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between">
              <button
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                )}
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                )}
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <table className="w-full border-collapse space-y-1">
            <thead>
              <tr className="flex">
                {dayNames.map((day) => (
                  <th
                    key={day}
                    className="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <tr key={weekIndex} className="flex w-full mt-2">
                  {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((calendarDay, dayIndex) => (
                    <td key={dayIndex} className="text-center text-sm p-0 relative">
                      {calendarDay.day && (
                        <button
                          className={cn(
                            "h-8 w-8 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
                            !calendarDay.isCurrentMonth && "text-muted-foreground opacity-50",
                            calendarDay.isCurrentMonth && isSelected(calendarDay.day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            calendarDay.isCurrentMonth && isToday(calendarDay.day) && !isSelected(calendarDay.day) && "bg-accent text-accent-foreground",
                            calendarDay.isCurrentMonth && isDisabled(calendarDay.day) && "text-muted-foreground opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => calendarDay.isCurrentMonth && handleDateClick(calendarDay.day!)}
                          disabled={calendarDay.isCurrentMonth && isDisabled(calendarDay.day!)}
                        >
                          {calendarDay.day}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
