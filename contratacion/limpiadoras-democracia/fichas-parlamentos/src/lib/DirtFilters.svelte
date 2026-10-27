<!-- Turbulence filters for the dirt look, declared once per embed (in App) and
     referenced by id from CSS. #dirt-scrub warps the grime texture (DirtPatina);
     #dirt-tear frays the rectangular edges of the card's white plates into torn
     ones (ParliamentCard). Decorative. -->
<svg class="dirt-filters" width="0" height="0" aria-hidden="true" focusable="false">
  <filter id="dirt-scrub" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.012 0.02"
      numOctaves="3"
      seed="4"
      result="noise"
    />
    <feDisplacementMap
      in="SourceGraphic"
      in2="noise"
      scale="22"
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
  <filter id="dirt-tear" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.02 0.035"
      numOctaves="3"
      seed="7"
      result="n"
    />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale="15"
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
</svg>

<style>
  .dirt-filters {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
</style>
