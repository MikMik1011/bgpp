<script>
	import { Command as CommandPrimitive } from "cmdk-sv";
	import { cn } from "$lib/utils.js";
	export let asChild = false;
	let className = undefined;
	export { className as class };
</script>

<CommandPrimitive.Item
	{asChild}
	class={cn(
		"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className
	)}
	{...$$restProps}
	let:action
	let:attrs
>
	<slot {action} {attrs} />
</CommandPrimitive.Item>
