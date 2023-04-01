<script>
  import Counter from 'svelte-counter';
  export let counters = {
    'views'	: 350,
    'time' : 41,
  };
</script>

<Counter values={counters} duration="5000" random="false" minspeed="100" let:counterResult>
  <div class="counter__container"><p>Video views</p><p>{counterResult.views}k+</p></div>
  <div class="counter__container"><p>Watch time <span>(hours)</span></p><p>{counterResult.time}k+</p></div>
</Counter>
