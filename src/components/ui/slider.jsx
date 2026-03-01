import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    step = 1,
    ...props
}, ref) => {
    return (
        <SliderPrimitive.Root
            ref={ref}
            data-slot="slider"
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            defaultValue={defaultValue}
            value={value}
            min={min}
            max={max}
            step={step}
            {...props}>
            <SliderPrimitive.Track
                data-slot="slider-track"
                className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
                <SliderPrimitive.Range
                    data-slot="slider-range"
                    className="bg-primary absolute h-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                data-slot="slider-thumb"
                className="border-primary bg-background focus-visible:ring-ring/50 block size-4 rounded-full border shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
    );
});

Slider.displayName = "Slider";

export { Slider }
