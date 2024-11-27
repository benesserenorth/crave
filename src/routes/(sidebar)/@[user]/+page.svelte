<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';

	import { page } from '$app/stores';
	import { trpc } from '$lib/client';
	import RecipeGrid from '$lib/components/recipe/RecipeGrid.svelte';

	import Channel from './(components)/Channel.svelte';
	import type { PageData } from './$types';

	$: user = createQuery({
		queryKey: ['user_profile'],
		queryFn: () =>
			trpc.users.get.query({
				username: $page.params.user,
			}),
	});

	$: categories = createQuery({
		queryKey: ['categories'],
		queryFn: () => trpc.users.categories.query({
			username: $page.params.user,
		})
	});

	let categoryId: number | undefined = undefined;

	export let data: PageData;
</script>

<div class="grid place-items-center">
	<div class="grid items-center max-w-7xl navbar gap-8 p-0">
		<Channel channel={$user} user={data.user} />

		<div class="flex flex-row gap-2">
			{#if $categories.data}
				{#each $categories.data as category}
					<button
						class="btn"
						class:btn-primary={categoryId === category.id}
						on:click={() => {
							categoryId = categoryId === category.id ? undefined : category.id;
						}}
					>
						{category.name}
					</button>
				{/each}
			{/if}
		</div>
		
		{#key categoryId}
			<RecipeGrid
				recipes={[]}
				author
				load={i =>
					trpc.users.recipes.query({
						username: $page.params.user,
						page: i,
						categoryId,
					})}
				itemThreshold={25}
				user={data.user}
			/>
		{/key}
	</div>
</div>
