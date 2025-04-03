<script lang="ts">
	import { trpc } from "$lib/client";
	import RecipeGrid from "$lib/components/recipe/RecipeGrid.svelte";
	import { createQuery } from "@tanstack/svelte-query";

	$: pending = createQuery({
		queryKey: ["pending"],
		queryFn: () => trpc.recipes.listPending.query(),
	});
</script>

<RecipeGrid recipes={$pending} author />
