<script lang="ts">
	import { trpc } from "$lib/client";
	import RecipeGrid from "$lib/components/recipe/RecipeGrid.svelte";

	const categories = [
		"Legumes",
		"Cooked Vegetables",
		"Sauce/Dressing",
		'"Cheese"',
		"Desserts",
		"Raw",
		"Starches and Grains",
		"Snacks",
	];

	let category: string | undefined = undefined;
</script>

<div class="flex flex-row gap-2 mb-8 pb-1 overflow-x-scroll">
	{#each categories as c}
		<button
			class="btn"
			class:btn-primary={category === c}
			on:click={() => {
				category = category === c ? undefined : c;
			}}
		>
			{c}
		</button>
	{/each}
</div>

{#key category}
	<RecipeGrid
		recipes={[]}
		load={(idx) => trpc.recipes.list.query({ page: idx, limit: 25, category })}
		itemThreshold={25}
	/>
{/key}
