<script lang="ts">
	import type { HaircutSuggestion } from '$lib/types/haircut';

	let { suggestion }: { suggestion: HaircutSuggestion } = $props();
</script>

<article class="geist-card p-6 flex flex-col gap-4" aria-label={`Panel ${suggestion.panelLabel}: ${suggestion.title}`}>
	<div class="flex items-center justify-between border-b border-geist-accents-2 pb-4">
		<span class="text-[10px] font-bold tracking-widest uppercase text-geist-accents-5">Direction {suggestion.panelLabel}</span>
		<span class="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold tracking-wider uppercase">{suggestion.vibe}</span>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xl leading-tight">{suggestion.title}</h3>
		<p class="text-sm text-geist-accents-5 leading-relaxed">{suggestion.reason}</p>
	</div>

	<div class="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-geist-accents-2">
		<div class="flex flex-col gap-1">
			<span class="text-[10px] font-bold uppercase text-geist-accents-4">Maintenance</span>
			<span class="text-xs font-medium">{suggestion.maintenance}</span>
		</div>
		<div class="flex flex-col gap-1">
			<span class="text-[10px] font-bold uppercase text-geist-accents-4">Suitability</span>
			<span class="text-xs font-medium">High Match</span>
		</div>
	</div>
</article>
