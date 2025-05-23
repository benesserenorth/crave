<script lang="ts">
	import { trpc } from "$lib/client";
	import RecipeGrid from "$lib/components/recipe/RecipeGrid.svelte";
</script>

<RecipeGrid
	recipes={[]}
	load={(idx) => trpc.recipes.list.query({ page: idx, limit: 25 })}
	itemThreshold={25}
/>
