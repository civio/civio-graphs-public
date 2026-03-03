<script>
  let { grouped, type, orientation } = $props();
</script>

<defs>
  {#if orientation === 'v'}
    <linearGradient id="cat_gradient_v_{type}" x1="0" y1="1" x2="0" y2="0">
      <stop stop-color="#D9F6FF" offset="0%" />
      <stop stop-color="#08A6BF" offset="50%" />
      <stop stop-color="#013C46" offset="100%" />
    </linearGradient>
  {:else}
    <linearGradient id="cat_gradient_h_{type}">
      <stop stop-color="#D9F6FF" offset="0%" />
      <stop stop-color="#08A6BF" offset="50%" />
      <stop stop-color="#013C46" offset="100%" />
    </linearGradient>
  {/if}
  {#each grouped?.[1]?.data ?? [] as adm (adm.adm)}
    <pattern
      id="hatch_{adm.adm.toLowerCase()}_{type}"
      patternUnits="userSpaceOnUse"
      width="4"
      height="4"
    >
      <path
        d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
        stroke="var(--{adm.adm.toLowerCase()})"
        stroke-width="1"
      />
    </pattern>
  {/each}
</defs>
