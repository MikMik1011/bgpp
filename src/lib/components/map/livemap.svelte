<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type * as Leaflet from 'leaflet';
	import type { Coords } from '$lib/types';
	import 'leaflet/dist/leaflet.css';

	export let center: Coords;
	export let markers: { id?: string; coords: Coords; color?: string; label?: string; popup?: string }[] = [];
	export let zoom = 13;
	export let autoFit = false;
	export let recenterKey: string | undefined = undefined;

	const dispatch = createEventDispatcher<{ markerclick: string }>();

	let mapEl: HTMLDivElement;
	let L: typeof Leaflet;
	let map: Leaflet.Map;
	let layerGroup: Leaflet.LayerGroup;
	let lastRecenterKey: string | undefined;

	const coloredIcon = (color: string) =>
		new L.Icon({
			iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -14],
			shadowSize: [41, 41]
		});

	const renderMarkers = () => {
		layerGroup.clearLayers();
		const leafletMarkers = markers.map((m) => {
			const marker = L.marker([m.coords.lat, m.coords.lon], { icon: coloredIcon(m.color ?? 'blue') });
			if (m.popup) marker.bindPopup(m.popup, { autoClose: false, closeOnClick: false });
			if (m.label) marker.bindTooltip(m.label, { permanent: true, direction: 'center', className: 'my-labels' });
			if (m.id) marker.on('click', () => dispatch('markerclick', m.id as string));
			marker.addTo(layerGroup);
			return marker;
		});

		if (recenterKey !== lastRecenterKey) {
			lastRecenterKey = recenterKey;
			if (autoFit && leafletMarkers.length > 0) {
				map.fitBounds(L.featureGroup(leafletMarkers).getBounds(), { maxZoom: 16 });
			} else {
				map.setView([center.lat, center.lon], zoom);
			}
		}
	};

	onMount(async () => {
		L = (await import('leaflet')).default;
		const { createTileLayers } = await import('$lib/map/mapLayers');

		map = L.map(mapEl, { center: [center.lat, center.lon], zoom });
		layerGroup = L.layerGroup().addTo(map);

		const layers = createTileLayers(L);
		L.control.layers(layers).addTo(map);
		layers.Transport.addTo(map);

		renderMarkers();
	});

	onDestroy(() => {
		map?.remove();
	});

	$: if (map) {
		markers;
		renderMarkers();
	}
</script>

<div bind:this={mapEl} class="h-full w-full"></div>
