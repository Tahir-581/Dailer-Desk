import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

type RootProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
type ScrollbarProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  RootProps
>(({ className = "", children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={"relative overflow-hidden " + className}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-inherit">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = "ScrollArea"

export const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  ScrollbarProps
>(({ className = "", orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={
      "flex touch-none select-none transition-colors " +
      (orientation === "vertical"
        ? "h-full w-2.5 border-l border-l-transparent p-[1px]"
        : "h-2.5 w-full border-t border-t-transparent p-[1px]") +
      " " +
      className
    }
    {...props}
  >
    <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-muted" />
  </ScrollAreaPrimitive.Scrollbar>
))
ScrollBar.displayName = "ScrollBar"

