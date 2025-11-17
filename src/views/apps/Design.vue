<template>
  <div class="MatcCanvasPage" id="CanvasNode" @wheel="onMouseWheel">
    <DesignToolbar ref="toolbar" :pub="pub"  @viewModeChange="onVieModeChange" />
    <DesignCanvas ref="canvas" @viewport="onViewPortChange" :viewport="viewport" />
  </div>
</template>

<style lang="scss">
  @import "../../style/matc.scss";
  @import "../../style/canvas/all.scss";
  @import '../../style/toolbar/all.scss';
</style>
<style lang="sass">
  @import "../../style/bulma.sass"
</style>

<script>
import DojoWidget from "dojo/DojoWidget";
import css from "dojo/css";
import win from "dojo/win";
import Toolbar from "canvas/toolbar/Toolbar";
import Canvas from "canvas/Canvas";
import Controller from "canvas/controller/Controller";
import ModelFactory from "core/ModelFactory";
import RenderFactory from "core/RenderFactory";
import lang from "dojo/_base/lang";
import on from "dojo/on";
import Services from "services/Services";
import Logger from "common/Logger";

export default {
  name: "Design",
  mixins: [DojoWidget],
  data: function() {
    return {
      selectedViewMode: 'Design',
      viewport: null
    };
  },
  components: {
    'DesignToolbar': Toolbar,
    'DesignCanvas': Canvas
  },
  computed: {
    pub() {
      return this.$route.meta && this.$route.meta.isPublic;
    },
    mode() {
      if (this.pub) {
        return "public";
      }
      return "private";
    }
  },
  methods: {
    onViewPortChange (viewport) {
      this.viewport = viewport
    },
    onVieModeChange (mode) {
      this.logger.log(-1, "onVieModeChange", "enter", mode);      
      this.load(mode)
    },
    onMouseWheel (e) {
      /**
       * Cancel all left and right swipes to surpress back navigation
       * Also prevent default for Shift + Scrollwheel to enable horizontal scrolling
       */
      if (e && (Math.abs(e.deltaX) > 50 || e.shiftKey)) {
        this.logger.log(-1, "onMouseWheel", "cancel");
        e.preventDefault();
      }
    },
    load (mode) {
      this.loadData(mode)
    },
    loadData(mode) {
      let id = this.$route.params.id;
      this.logger.log(3, "loadData", "enter", id);
      Promise.all([
        this.loadApp(id),
        this.loadCommands(id),
        this.loadInvitations(id)
      ]).then(values => {

        this.cache.app = values[0]
        this.cache.commands = values[1]
        this.cache.inivitations = values[2]

        const invitations = values[2];
        const hash = this.getHashFromInvitation(invitations)
        // ste mode and render
        this.selectedViewMode = mode
        this.$nextTick( () => {
          this.buildCanvas(values[0], values[1], hash);
        })
      });
    },

    getHashFromInvitation(invitations) {
      const temp = {};
      for (let key in invitations) {
        temp[invitations[key]] = key;
      }
      const hash = temp[1];
      return hash
    },

    loadAll () {
      let id = this.$route.params.id
      this.logger.log(2, 'loadAll', 'enter', id)
      Promise.all([
        this.loadApp(id),
        this.loadInvitations(id),
        this.loadCommands(id)
      ]).then(values => {

        this.cache.app = values[0]
        this.cache.inivitations = values[1]
        this.cache.commands = values[2]
      })
    },

    loadApp (id) {
      if (this.cache.app) {
        return this.cache.app
      }
      return this.modelService.findApp(id)
    },
    loadCommands (id) {
      if (this.cache.commands) {
        return this.cache.commands
      }
      return this.modelService.getCommands(id)
    },
    loadInvitations (id) {
      if (this.cache.inivitations) {
        return this.cache.inivitations
      }
      return this.modelService.findInvitation(id)
    },

    setCache (key, value) {
      this.cache[key] = value
    },

    buildCanvas(model, stack, hash) {
      this.logger.log(3, "buildCanvas", "enter");

      const canvas = this.$refs.canvas;
      const toolbar = this.$refs.toolbar;
      const controller = new Controller();
      const service = this.modelService;

      /**
       * model factory
       */
      const factory = new ModelFactory();
      factory.setModel(model);

      /**
       * render factory
       */
      const renderFactory = new RenderFactory();
      renderFactory.setModel(model);
      renderFactory.setHash(hash);

      /**
       * Dependency injection
       */
      controller.setModelService(service);
      controller.setToolbar(toolbar);
      controller.setModelFactory(factory);
      controller.setCommandService(this.commandService);
      if (this.pub) {
        controller.setPublic(true);
        canvas.setPublic(true);
        toolbar.setPublic(true);
      }

      toolbar.setController(controller);
      toolbar.setCommentService(Services.getCommentService());
      toolbar.setCanvas(canvas);
      toolbar.setUser(this.user);
      toolbar.setModelFactory(factory);
      toolbar.setContext(this.context);
      toolbar.setModelService(service);
      toolbar.setHash(hash);
      
      //canvas.setViewport(this.viewport)
      canvas.setController(controller);
      canvas.setCommentService(Services.getCommentService());
      canvas.setToolbar(toolbar);
      canvas.setRenderFactory(renderFactory);
      canvas.setModelFactory(factory);
      canvas.setModelService(service);
   
      canvas.setUser(this.user);

      // wire shit together
      this.tempOwn(on(toolbar, "newScreen", lang.hitch(canvas, "addScreen"))); // deprecated
      this.tempOwn(on(toolbar, "newWidget", lang.hitch(canvas, "addWidget"))); // deprecated

      this.tempOwn(on(toolbar, "newLine", lang.hitch(canvas, "addLine")));
      this.tempOwn(on(toolbar, "newComment", lang.hitch(canvas, "addComment")));

      this.tempOwn(on(toolbar, "newTemplatedWidget", lang.hitch(canvas, "addTemplatedWidget")));
      this.tempOwn(on(toolbar, "newTemplatedScreen", lang.hitch(canvas, "addTemplatedScreen")));
      this.tempOwn(on(toolbar, "newTemplatedGroup", lang.hitch(canvas, "addTemplatedGroup")));

      this.tempOwn(on(toolbar, "newThemedScreen", lang.hitch(canvas, "addThemedScreen")));
      this.tempOwn(on(toolbar, "newThemedGroup", lang.hitch(canvas, "addThemedGroup")));
      this.tempOwn(on(toolbar, "newThemedWidget", lang.hitch(canvas, "addThemedWidget")));
      this.tempOwn(on(toolbar, "newMultiThemedScreen", lang.hitch(canvas, "addMultiThemedScreens")));
      this.tempOwn(on(toolbar, "newThemedScreenAndWidget", lang.hitch(canvas, "addThemedScreenAndWidgets")));
      this.tempOwn(on(toolbar, "newImportApp", lang.hitch(canvas, "addImportedApp")));

      this.tempOwn(on(toolbar, "onNewLogicObject", lang.hitch(canvas, "addLogicGroup")));
      this.tempOwn(on(toolbar, "onNewRestObject", lang.hitch(canvas, "addRestObject")));
      this.tempOwn(on(toolbar, "onNewScriptObject", lang.hitch(canvas, "addScriptObject")));
      this.tempOwn(on(toolbar, "onNewSVG", lang.hitch(canvas, "addSVG")))
      this.tempOwn(on(toolbar, "onEditSVG", lang.hitch(canvas, "openSVGEditor")))
      

      /**
       * last set the model
       */
      controller.setCommandStack(stack);

      /**
       * controller will render screen
       */
      controller.setModel(model, this.$route.params.sid);

      /**
       * Init layer list
       */
      canvas.initLayer();
    },





    getModeFromRoute() {
      return 'Design'
    }

  },
  beforeDestroy () {
  },
  async mounted() {
    this.logger = new Logger("Design");
    this.cache = {}


    css.add(win.body(), "MatcVisualEditor");
    this.user = await Services.getUserService().load();
    this.modelService = Services.getModelService(this.$route);
    this.commandService = Services.getCommandService();
    
    const mode = this.getModeFromRoute()
    this.load(mode);

    this.logger.log(-1, "mounted", "exit > " + mode);
    setTimeout(() => this.loadAll(), 3000)
  }
};
</script>
