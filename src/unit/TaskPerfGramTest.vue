<template>
  <div class="MatcLight">
    <h1>TaskPerfGram Test - DISABLED (Analytics Removed)</h1>

    <div class="dialog MatcDashTaskPerfGramDialog">
      <p>This test has been disabled because analytics features were removed.</p>
    </div>


  </div>
</template>

<style lang="scss">
  @import "../style/matc.scss";
  @import "../style/qux.scss";
</style>
<style>

  .dialog {
    background: #fff;
    padding: 20px;
    display: inline-block;
    margin: 20px;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2)
  }
</style>

<style lang="sass">
  @import "../style/bulma.sass"
</style>

<script>

export default {
  name: "TaskPerfGramTest",
  mixins: [],
  data: function() {
    return {
        model: null
    };
  },
  components: {
    
  },
  computed: {
    df() {
      let events = this.filterEvents(funnelEvents, []);
      var actionEvents = this.getActionEvents(new DataFrame(events));
      events = actionEvents.as_array();
      var df = new DataFrame(events);
      df.sortBy("time");
      return df;
    }
  },
  methods: {
  },
  mounted() {
      const task = funnelTestSettings.tasks[0]

        const gram = this.$new(TaskPerfGram, {
          model: funnelApp,
          dialog: null,
          mode: ''
        })
        gram.setValue(this.df, task, [], funnelTestSettings.tasks);
        gram.placeAt(this.$refs.cntr);
  }
};
</script>
