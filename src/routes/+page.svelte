<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly, scale } from 'svelte/transition';

	import ResultCollage from '$lib/components/result-collage.svelte';
	import SuggestionCard from '$lib/components/suggestion-card.svelte';
	import { getDownscaledDimensions, getMobileCaptureJpegQuality } from '$lib/image/capture-prep';
	import { getGenerationStage } from '$lib/loading/generation-stages';
	import { getStepAfterSubmitResult, shouldUseIncomingResult } from '$lib/loading/result-transition';
	import type { GenerationResult } from '$lib/types/haircut';

	type ActionForm = {
		message?: string;
		result?: GenerationResult;
	};

	let {
		form
	}: {
		data?: unknown;
		form?: ActionForm;
	} = $props();

	type AppStep = 'landing' | 'camera' | 'preview' | 'loading' | 'result';
	let currentStep = $state<AppStep>('landing');
	
	let pending = $state(false);
	let capturedFile = $state<File | null>(null);
	let capturedPreview = $state<string | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let cameraError = $state<string | null>(null);
	let generationElapsedMs = $state(0);

	const STAGE_ONE_DURATION_MS = 4500;
	const STAGE_TWO_PROGRESS_DURATION_MS = 9000;
	const MAX_CAPTURE_DIMENSION = 1280;
	let generationIntervalId: ReturnType<typeof setInterval> | null = null;

	let actionForm = $derived(form as ActionForm | undefined);
	let result = $derived(actionForm?.result);
	const getCurrentResultImageUrl = () => result?.imageUrl ?? null;
	let resultImageUrlAtSubmit = $state<string | null>(getCurrentResultImageUrl());
	let suggestions = $derived(result?.suggestions ?? []);
	let message = $derived(actionForm?.message);
	let generationStage = $derived(getGenerationStage(generationElapsedMs));
	
	let generationProgress = $derived.by(() => {
		if (generationElapsedMs < STAGE_ONE_DURATION_MS) {
			return Math.min((generationElapsedMs / STAGE_ONE_DURATION_MS) * 50, 50);
		}

		const stageTwoElapsedMs = generationElapsedMs - STAGE_ONE_DURATION_MS;
		const stageTwoProgress = Math.min(stageTwoElapsedMs / STAGE_TWO_PROGRESS_DURATION_MS, 1) * 45;
		return Math.min(50 + stageTwoProgress, 95);
	});

	// Effect to handle result transition
	$effect(() => {
		if (
			shouldUseIncomingResult({
				currentStep,
				incomingImageUrl: result?.imageUrl,
				previousImageUrlAtSubmit: resultImageUrlAtSubmit
			})
		) {
			currentStep = 'result';
			clearGenerationTimer();
		}
	});

	function clearGenerationTimer() {
		if (generationIntervalId === null) return;
		clearInterval(generationIntervalId);
		generationIntervalId = null;
	}

	function startGenerationTimer() {
		clearGenerationTimer();
		generationElapsedMs = 0;
		const startedAt = Date.now();
		generationIntervalId = setInterval(() => {
			generationElapsedMs = Date.now() - startedAt;
		}, 250);
	}

	async function openCamera() {
		cameraError = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { 
					facingMode: 'user',
					width: { ideal: 1920 },
					height: { ideal: 1920 },
					frameRate: { ideal: 30 }
				}, 
				audio: false 
			});
			currentStep = 'camera';
		} catch (e) {
			console.error(e);
			cameraError = 'Could not access camera. Please allow camera permission and try again.';
		}
	}

	function capturePhoto() {
		if (!videoEl) return;
		const canvas = document.createElement('canvas');
		const targetDimensions = getDownscaledDimensions({
			width: videoEl.videoWidth,
			height: videoEl.videoHeight,
			maxDimension: MAX_CAPTURE_DIMENSION
		});
		canvas.width = targetDimensions.width;
		canvas.height = targetDimensions.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight, 0, 0, canvas.width, canvas.height);
		const quality = getMobileCaptureJpegQuality({
			width: videoEl.videoWidth,
			height: videoEl.videoHeight
		});
		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				if (capturedPreview) URL.revokeObjectURL(capturedPreview);
				capturedFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
				capturedPreview = URL.createObjectURL(blob);
				closeCamera();
				currentStep = 'preview';
			},
			'image/jpeg',
			quality
		);
	}

	function closeCamera() {
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
	}

	function retake() {
		if (capturedPreview) URL.revokeObjectURL(capturedPreview);
		capturedFile = null;
		capturedPreview = null;
		openCamera();
	}

	function setupVideo(node: HTMLVideoElement) {
		node.srcObject = stream;
		node.play();
		return {
			destroy() {
				node.srcObject = null;
			}
		};
	}
</script>

<svelte:head>
	<title>Barber AI | Architectural Haircut Matching</title>
</svelte:head>

<!-- Global Background Elements -->
<div class="fixed inset-0 pointer-events-none z-0">
	<div class="absolute inset-0 bg-[#fff] opacity-100"></div>
	<div class="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
	<div class="absolute inset-0 bg-noise-texture opacity-[0.02]"></div>
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-geist-accents-1 to-transparent"></div>
</div>

<main class="min-h-screen text-black font-geist flex flex-col relative z-10">
	<!-- Fixed Header -->
	<header class="p-4 sm:p-6 flex items-center justify-between border-b border-geist-accents-2 sticky top-0 bg-white/60 backdrop-blur-xl z-50">
		<div class="flex items-center gap-3 group cursor-pointer" onclick={() => { currentStep = 'landing'; }}>
			<div class="w-10 h-10 bg-black rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 shadow-lg">
				<span class="text-white font-bold text-lg tracking-tighter">B</span>
			</div>
			<div class="flex flex-col -gap-1">
				<span class="font-bold tracking-tighter text-2xl leading-none">Barber AI</span>
				<span class="text-[9px] font-bold tracking-[0.2em] uppercase text-geist-accents-4">Architectural Edition</span>
			</div>
		</div>
		<nav class="hidden sm:flex items-center gap-6">
			<a href="#" class="text-xs font-bold uppercase tracking-widest text-geist-accents-4 hover:text-black transition-colors">How it works</a>
			<a href="#" class="text-xs font-bold uppercase tracking-widest text-geist-accents-4 hover:text-black transition-colors">Gallery</a>
			<div class="h-4 w-px bg-geist-accents-2"></div>
			<span class="text-[10px] font-mono text-geist-accents-5">v0.1.2-ALPHA</span>
		</nav>
	</header>

	<div class="flex-1 flex flex-col relative overflow-hidden">
		{#if currentStep === 'landing'}
			<section in:fade={{ duration: 400 }} class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-12 max-w-4xl mx-auto w-full">
				<div class="flex flex-col gap-6 relative">
					<!-- Decorative Badge -->
					<div class="inline-flex items-center gap-2 px-3 py-1 bg-black/[0.03] border border-black/5 rounded-full mx-auto self-center backdrop-blur-sm">
						<span class="flex h-2 w-2 rounded-full bg-black animate-pulse"></span>
						<span class="text-[10px] font-bold tracking-[0.2em] uppercase text-black/60">New: Multi-Panel Analysis</span>
					</div>
					
					<h1 class="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.85] text-balance">
						The perfect cut,<br/>engineered for <span class="text-geist-accents-4">you.</span>
					</h1>
					
					<p class="text-xl text-geist-accents-6 max-w-xl mx-auto leading-relaxed font-medium">
						Professional architectural analysis of your facial structure to find the ideal haircut direction. Fast, private, and precise.
					</p>
				</div>
				
				<div class="flex flex-col w-full gap-4 sm:flex-row sm:justify-center px-4">
					<button 
						type="button" 
						class="geist-button geist-button-primary w-full sm:w-auto px-16 h-16 text-lg shadow-2xl hover:shadow-black/20"
						onclick={openCamera}
					>
						Get Started
					</button>
					<button 
						type="button" 
						class="geist-button geist-button-secondary w-full sm:w-auto px-12 h-16 text-lg bg-white/40 backdrop-blur-sm"
					>
						View Gallery
					</button>
				</div>

				<div class="grid grid-cols-3 gap-4 sm:gap-12 pt-16 border-t border-geist-accents-2 w-full mt-12 max-w-2xl">
					<div class="flex flex-col gap-2 group cursor-help">
						<span class="text-3xl sm:text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform">100%</span>
						<span class="text-[10px] uppercase font-bold tracking-widest text-geist-accents-4">Private Flow</span>
					</div>
					<div class="flex flex-col gap-2 group cursor-help">
						<span class="text-3xl sm:text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform">1.2s</span>
						<span class="text-[10px] uppercase font-bold tracking-widest text-geist-accents-4">Fast Scan</span>
					</div>
					<div class="flex flex-col gap-2 group cursor-help">
						<span class="text-3xl sm:text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform">∞</span>
						<span class="text-[10px] uppercase font-bold tracking-widest text-geist-accents-4">Precision</span>
					</div>
				</div>
			</section>
		{/if}

		{#if currentStep === 'camera'}
			<section in:fade={{ duration: 200 }} class="fixed inset-0 z-[60] bg-black flex flex-col">
				<div class="flex-1 relative flex items-center justify-center overflow-hidden">
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						bind:this={videoEl}
						use:setupVideo
						class="w-full h-full object-cover opacity-80"
						playsinline
						autoplay
					></video>
					
					<!-- UI Overlay on Camera -->
					<div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
						<div class="w-full max-w-sm aspect-[4/5] border border-white/10 rounded-[3rem] relative overflow-hidden backdrop-blur-[2px]">
							<!-- Corners -->
							<div class="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-[3rem]"></div>
							<div class="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-[3rem]"></div>
							<div class="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-[3rem]"></div>
							<div class="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-[3rem]"></div>
							
							<!-- Scan line -->
							<div class="absolute inset-0 w-full h-1 bg-white/30 shadow-[0_0_20px_white] animate-camera-scan"></div>
							
							<p class="absolute bottom-12 left-0 right-0 text-center text-white text-xs font-black uppercase tracking-[0.3em] drop-shadow-lg">Position face within frame</p>
						</div>
					</div>
				</div>

				<div class="p-8 sm:p-16 bg-black flex items-center justify-between gap-12 relative">
					<div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
					
					<button 
						type="button" 
						class="text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
						onclick={() => { closeCamera(); currentStep = 'landing'; }}
					>
						Cancel
					</button>
					
					<button 
						type="button" 
						class="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 border-[6px] border-white/20 active:scale-90 transition-all hover:border-white/40 group shadow-[0_0_40px_rgba(255,255,255,0.2)]"
						onclick={capturePhoto}
						aria-label="Capture photo"
					>
						<div class="w-full h-full rounded-full border-2 border-black/10 bg-white transition-transform group-hover:scale-95 shadow-inner"></div>
					</button>

					<div class="w-16 hidden sm:block"></div> <!-- Spacer for symmetry -->
				</div>
			</section>
		{/if}

		{#if currentStep === 'preview'}
			<section in:fly={{ y: 20, duration: 400 }} class="flex-1 flex flex-col p-6 gap-8 max-w-xl mx-auto w-full py-12">
				<div class="flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-green-500"></span>
						<span class="text-[10px] font-bold tracking-[0.2em] uppercase text-geist-accents-4">Image Captured</span>
					</div>
					<h2 class="text-4xl sm:text-5xl font-black tracking-tighter">Ready for analysis.</h2>
				</div>

				{#if capturedPreview}
					<div class="relative group geist-border rounded-[2rem] overflow-hidden shadow-2xl bg-black">
						<img src={capturedPreview} alt="Selfie preview" class="w-full aspect-[4/5] object-cover opacity-90 transition-transform group-hover:scale-[1.02]" />
						
						<!-- Tech Overlay -->
						<div class="absolute inset-0 pointer-events-none">
							<div class="absolute top-6 left-6 flex flex-col gap-1">
								<span class="text-[10px] font-mono text-white/60">SCAN_ID: BX-2026</span>
								<span class="text-[10px] font-mono text-white/60">RES: 1080X1080</span>
							</div>
							<div class="absolute bottom-6 right-6 border border-white/20 px-3 py-1 rounded text-[10px] font-mono text-white/60">
								SENSORS_ACTIVE
							</div>
						</div>
					</div>
				{/if}

				<form
					method="POST"
					action="?/generate"
					enctype="multipart/form-data"
					class="flex flex-col gap-4 mt-auto sm:mt-8"
					use:enhance={({ formData, cancel }) => {
						if (!capturedFile) {
							cancel();
							return;
						}
						formData.set('selfie', capturedFile, 'selfie.jpg');
						startGenerationTimer();
						resultImageUrlAtSubmit = result?.imageUrl ?? null;
						currentStep = 'loading';
						return async ({ result, update }) => {
							try {
								await update();
							} catch (e) {
								console.error(e);
							}

							const nextStep = getStepAfterSubmitResult({
								currentStep,
								actionResultType: result.type
							});
							currentStep = nextStep;
							if (nextStep !== 'loading') {
								clearGenerationTimer();
							}
						};
					}}
				>
					<button type="submit" class="geist-button geist-button-primary w-full h-16 text-lg shadow-xl">
						Analyze Face Structure
					</button>
					<button type="button" class="geist-button geist-button-secondary w-full h-16 text-lg border-2" onclick={retake}>
						Retake Photo
					</button>
				</form>
			</section>
		{/if}

		{#if currentStep === 'loading'}
			<section in:fade={{ duration: 300 }} class="flex-1 flex flex-col items-center justify-center p-8 gap-16 max-w-xl mx-auto w-full py-24">
				<div class="relative w-64 h-64 flex items-center justify-center">
					<!-- Complex Animated Loader -->
					<svg class="absolute inset-0 w-full h-full -rotate-90">
						<circle 
							cx="128" cy="128" r="120" 
							stroke="currentColor" stroke-width="2" fill="transparent" 
							class="text-geist-accents-2"
						/>
						<circle 
							cx="128" cy="128" r="120" 
							stroke="black" stroke-width="4" fill="transparent"
							stroke-dasharray="753.98"
							style={`stroke-dashoffset: ${753.98 - (753.98 * generationProgress) / 100}`}
							class="transition-all duration-300 ease-linear"
						/>
					</svg>
					
					<div class="flex flex-col items-center gap-1">
						<span class="text-6xl font-black tracking-tighter">{Math.round(generationProgress)}%</span>
						<span class="text-[10px] font-bold uppercase tracking-[0.3em] text-geist-accents-4">Analyzing</span>
					</div>

					<!-- Decorative tech rings -->
					<div class="absolute inset-0 border border-black/5 rounded-full animate-ping opacity-20"></div>
					<div class="absolute inset-[-20px] border border-black/5 rounded-full animate-reverse-spin opacity-10"></div>
				</div>

				<div class="flex flex-col gap-6 text-center w-full">
					<div class="flex flex-col gap-3">
						<div class="flex items-center justify-center gap-3">
							<span class="px-2 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-sm">Step {generationStage.stepLabel.includes('1') ? '01' : '02'}</span>
						</div>
						<h2 class="text-4xl font-black tracking-tighter leading-none">{generationStage.title}</h2>
					</div>
					<p class="text-geist-accents-5 text-lg leading-relaxed max-w-sm mx-auto font-medium">
						{generationStage.description}
					</p>
				</div>

				<!-- Pulse Bar -->
				<div class="w-full max-w-xs h-1 bg-geist-accents-2 rounded-full relative overflow-hidden">
					<div class="absolute inset-0 w-1/2 h-full bg-black animate-scan"></div>
				</div>
			</section>
		{/if}

		{#if currentStep === 'result' && result}
			<section in:fly={{ y: 20, duration: 600 }} class="p-6 sm:p-12 flex flex-col gap-16 max-w-6xl mx-auto w-full pb-32">
				<div class="flex flex-col gap-6 items-start sm:items-center sm:text-center">
					<div class="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
						<span class="text-[10px] font-bold tracking-[0.2em] uppercase text-green-700">Analysis Complete</span>
					</div>
					<h2 class="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.85]">Your new<br/><span class="text-geist-accents-4">identity.</span></h2>
					<p class="text-geist-accents-5 text-xl leading-relaxed max-w-2xl font-medium">
						We've mapped your facial symmetry to professional hair styling patterns. Here are four directions optimized for your unique geometry.
					</p>
				</div>

				<div class="flex flex-col gap-12 sm:gap-16">
					<div class="w-full">
						<ResultCollage imageUrl={result.imageUrl} />
					</div>

					{#if message}
						<div class="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
							<span class="w-5 h-5 flex items-center justify-center bg-red-600 text-white rounded-full text-[10px]">!</span>
							{message}
						</div>
					{/if}

					<div class="flex flex-col gap-10 w-full">
						<div class="flex flex-col gap-4 border-b border-geist-accents-2 pb-8 max-w-3xl">
							<h3 class="text-[10px] font-bold uppercase tracking-[0.4em] text-geist-accents-4">Architectural Breakdown</h3>
							<p class="text-xs text-geist-accents-5 font-medium leading-relaxed">Each direction is calculated to balance facial proportions and minimize daily maintenance friction.</p>
						</div>
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{#each suggestions as suggestion, i (suggestion.id)}
								<div class="h-full" in:fly={{ y: 20, delay: 400 + (i * 100), duration: 400 }}>
									<SuggestionCard {suggestion} />
								</div>
							{/each}
						</div>

						<button 
							type="button" 
							class="geist-button geist-button-primary w-full h-16 text-lg mt-8 shadow-2xl"
							onclick={() => { currentStep = 'landing'; capturedFile = null; capturedPreview = null; resultImageUrlAtSubmit = null; }}
						>
							Start New Analysis
						</button>
					</div>
				</div>
			</section>
		{/if}
	</div>
</main>

<style>
	:global(.animate-scan) {
		animation: scan 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}

	:global(.animate-camera-scan) {
		animation: camera-scan 3s ease-in-out infinite;
	}

	:global(.animate-reverse-spin) {
		animation: reverse-spin 10s linear infinite;
	}

	@keyframes scan {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(300%); }
	}

	@keyframes camera-scan {
		0%, 100% { transform: translateY(0); opacity: 0; }
		10%, 90% { opacity: 1; }
		50% { transform: translateY(400px); }
	}

	@keyframes reverse-spin {
		from { transform: rotate(360deg); }
		to { transform: rotate(0deg); }
	}

	.bg-grid-pattern {
		background-image: radial-gradient(circle, #000 1px, transparent 1px);
		background-size: 32px 32px;
	}

	.bg-noise-texture {
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
	}

	/* Mobile Optimizations */
	@media (max-width: 640px) {
		h1 {
			font-size: 4rem;
		}
	}
</style>
