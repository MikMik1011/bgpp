import { tv } from "tailwind-variants";
import Root from "./button.svelte";
const buttonVariants = tv({
	base: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive:
				"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline:
				"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			default: "h-12 px-5 text-base sm:h-9 sm:px-4 sm:text-sm",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-12 rounded-md px-8 text-base sm:h-10 sm:text-sm",
			icon: "h-11 w-11 sm:h-9 sm:w-9",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});
export {
	Root,
	//
	Root as Button,
	buttonVariants,
};
