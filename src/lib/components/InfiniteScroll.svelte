<script lang="ts" generics="T">
	import type { MaybePromise } from '$lib/types';
	import { viewport } from '$lib/util';

	import { tick } from 'svelte';

	export let data: T[];
	export let load: (index: number) => MaybePromise<T[]>;
	export let itemThreshold = 1;

	let done = data.length < itemThreshold && data.length > 0;
	let loading = false;
	let index = data.length === 0 ? 0 : 1;
	let shouldLoad = data.length === 0;
	let ctx = 0;

	async function next() {
		loading = true;
		
		const localCtx = ++ctx;
		let items: T[] = [];

		try {
			items = await load(index++);
		} catch (e) {
			console.error(e);
		}

		if (localCtx !== ctx) {
			return;
		}

		if (items.length < itemThreshold) {
			done = true;
		}

		if (items.length) {
			data.push(...items);
			data = data;
		}

		tick().then(() => {
			loading = false;
		});
	}

	function onLoadChange() {
		data = [];
		done = false;
		index = 0;

		next();
	}

	$: if (shouldLoad && !loading && !done) {
		next();
	}

	$: {
		load;
		onLoadChange();
	}
</script>

{#each data as item, i (i)}
	<slot {item} />
{/each}

{#if !done}
	{#if loading}
		<slot name="loading" />
	{/if}
{/if}

<div
	use:viewport
	on:enterviewport={() => {
		shouldLoad = true;
	}}
	on:exitviewport={() => {
		shouldLoad = false;
	}}
/>
