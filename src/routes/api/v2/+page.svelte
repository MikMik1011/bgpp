<script lang="ts">
	const endpoints = [
		{
			group: 'Cities',
			items: [
				{
					path: '/api/v2/cities',
					desc: 'List supported cities — { id, name, center: { lat, lon } }[]'
				}
			]
		},
		{
			group: 'Stations',
			items: [
				{
					path: '/api/v2/cities/[city]/stations',
					desc: 'All stations in a city — { name, uid, id, coords, hash }[]'
				},
				{
					path: '/api/v2/cities/[city]/stations/[stationId]',
					desc: 'A single station by its id — { name, uid, id, coords, hash }'
				},
				{
					path: '/api/v2/cities/[city]/stations/hash',
					desc: "Combined hash of every station's hash in a city, for change detection — { hash }"
				}
			]
		},
		{
			group: 'Arrivals',
			items: [
				{
					path: '/api/v2/cities/[city]/stations/[stationId]/arrivals',
					desc: 'Live arrivals for a station — { station, lines: { lineNumber, lineName, arrivals }[] }'
				}
			]
		}
	];
</script>

<main class="mx-auto max-w-2xl px-4 py-10">
	<h1 class="text-2xl font-bold">BG++ API v2</h1>
	<p class="mt-1 text-muted-foreground">Endpoints used by the app. JSON responses, GET only.</p>

	{#each endpoints as { group, items }}
		<section class="mt-8">
			<h2 class="text-lg font-semibold">{group}</h2>
			<ul class="mt-2 space-y-2">
				{#each items as { path, desc }}
					<li class="rounded-md border p-3">
						<code class="text-sm text-primary">{path}</code>
						<p class="mt-1 text-sm text-muted-foreground">{desc}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<a href="/" class="mt-10 inline-block text-sm text-primary underline-offset-4 hover:underline">
		&larr; Back to BG++
	</a>
</main>
