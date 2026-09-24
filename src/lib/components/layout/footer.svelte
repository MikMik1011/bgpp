<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<footer
	class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
>
	<Dialog.Root>
		<Dialog.Trigger class="underline-offset-2 hover:underline">Fair Usage Policy</Dialog.Trigger>
		<Dialog.Content class="max-h-[85vh] max-w-lg overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Fair Usage Policy</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4 text-sm text-muted-foreground">
				<p>
					This service is officially hosted at <a class="underline" href="https://bgpp.misa.st"
						>bgpp.misa.st</a
					> and works only as a proxy layer to the official BusLogic APIs, which have been reverse
					engineered for compatibility and research.
				</p>
				<p>
					Source code:
					<a
						class="underline"
						href="https://github.com/MikMik1011/bgpp"
						target="_blank"
						rel="noopener noreferrer"
					>
						github.com/MikMik1011/bgpp
					</a>
				</p>
				<div>
					<h3 class="font-medium text-foreground">1. Permitted Use</h3>
					<p>
						The BGPP proxy API may be used only in the official BGPP app or for personal research,
						testing, and educational work.
					</p>
				</div>
				<div>
					<h3 class="font-medium text-foreground">2. Third Party Projects</h3>
					<p>
						If you want to use this API in your own project, you must adapt the source code for
						your needs or self host your own instance. Direct use of bgpp.misa.st in third party
						apps is not allowed.
					</p>
				</div>
				<div>
					<h3 class="font-medium text-foreground">3. Restrictions</h3>
					<p>
						Usage that places excessive load, bypasses limits, mirrors data, or harms stability is
						forbidden.
					</p>
				</div>
				<div>
					<h3 class="font-medium text-foreground">4. Enforcement</h3>
					<p>Violations may result in temporary or permanent blocks.</p>
				</div>
				<div>
					<h3 class="font-medium text-foreground">5. Changes</h3>
					<p>This policy may change at any time. Continued use indicates acceptance.</p>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
	<span aria-hidden="true">·</span>
	<a
		class="underline-offset-2 hover:underline"
		href="https://github.com/MikMik1011/bgpp"
		target="_blank"
		rel="noopener noreferrer"
	>
		Source code
	</a>
</footer>
