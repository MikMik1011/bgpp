<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Footer from '$lib/components/layout/footer.svelte';
</script>

<ModeWatcher />
<div class="sm:m-5">
	<slot />
</div>
<Footer />
