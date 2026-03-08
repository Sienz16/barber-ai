<script lang="ts">
	let { imageUrl }: { imageUrl: string } = $props();

	const labels = ['01', '02', '03', '04'] as const;
</script>

<figure class="geist-collage" aria-labelledby="collage-caption">
	<div class="image-container">
		<img src={imageUrl} alt="Generated haircut collage" />
		<div class="label-overlay" aria-hidden="true">
			{#each labels as label (label)}
				<div class="label-box">
					<span>{label}</span>
				</div>
			{/each}
		</div>
	</div>
</figure>

<style>
	.geist-collage {
		margin: 0;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--color-geist-accents-2);
		box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
	}

	.image-container {
		position: relative;
		width: 100%;
		line-height: 0;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
	}

	.label-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		pointer-events: none;
	}

	.label-box {
		padding: 16px;
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
	}

	.label-box span {
		font-size: 10px;
		font-weight: 800;
		color: #fff;
		background: rgba(0, 0, 0, 0.4);
		padding: 4px 8px;
		border-radius: 4px;
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		letter-spacing: 0.05em;
	}
</style>
