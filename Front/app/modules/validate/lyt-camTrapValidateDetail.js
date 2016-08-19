//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_grid/model-grid',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'moment',
  'ns_navbar/ns_navbar',
  'backbone.paginator',
  './lyt-camTrapItemView',
  './lyt-camTrapImageModel',
  './lyt-camTrapToolsBarView',
  './lyt-camTrapModal',
  'backbone.marionette.keyShortcuts',
  'backbone.virtualcollection',
  './lyt-camTrapToolsBarTopView',



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView , CamTrapImageModel, ToolsBar, ModalView, BckMrtKeyShortCut,
  virtualcollection, ToolsBarTop

) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/templates/tpl-camTrapValidateDetail.html',

    className: 'full-height animated white',
    childEvents:{

    },
    keyShortcuts:{
      'up' : 'mouvement',
      'down' : 'mouvement',
      'left' : 'mouvement',
      'right' : 'mouvement',
      'tab': 'findInput',
      'space': 'displayModal',
      'backspace' : 'toggleModelStatus',
      'esc' : 'leaveModal',
      'pageup': 'nextPage',
      'pagedown' : 'prevPage',
      'home' : 'firstPage',
      'end' : 'lastPage',

    },

    events: {
      'click button#validate': 'validate',

      'click button#displayAll': 'displayAll',
      'click button#displayDeleted': 'displayDeleted',
      'click button#displayValidated': 'displayValidated',
      'click button#displayTags': 'displayTags',
      'click button#refusedBtn': 'rejectPhoto',
      'click button#upStarsBtn': 'increaseStars',
      'click button#downStarsBtn': 'decreaseStars',
      'click button#acceptedBtn': 'acceptPhoto',
      'click button#validate' : 'validateAll',
      'click .reneco-ecollectionsmall' : 'clickOnIconeView',
      'click .reneco-image_file' : 'clickOnIconeView',
      'clicl .reneco-list' :'clickOnIconeView',
    },

    ui: {
      'grid': '#grid',
      'totalEntries': '#totalEntries',
      'gallery': '#gallery',
      'gallerytest': '#gallerytest',
      'siteForm': '#siteForm',
      'sensorForm': '#sensorForm',
      'imageDetailsForm': '#imageDetailsForm',

      'dataSetIndex': '#dataSetIndex',
      'dataSetTotal': '#dataSetTotal',

      'totalS' : '#totalS',
      'total' : '#total',
      'paginator':'#paginator'

    },

    regions: {
      'rgNavbar': '#navbar',
      'rgGallery' : '#gallery',
      'rgModal': '#rgModal',
      'rgToolsBar' :'#rgToolsBar',
      'rgToolsBarTop' : '#rgToolsBarTop'
    },
  clickOnIconeView : function(e){
      var $elemToInactive = $('#rgToolsBarTop .active');
      var $elemToActive =  $(e.target);
      if( $elemToInactive[0]  != $elemToActive[0]){
       $elemToInactive.toggleClass('active');
      $elemToActive.toggleClass('active');
       if($elemToActive.hasClass('reneco-ecollectionsmall')){
          console.log("gallery");
          this.leaveModal(e);
        }
        else if( $elemToActive.hasClass('reneco-image_file') ) {
          this.displayModal(e);
          console.log("image file");
        }
        else{
            console.log("list file");
        }
      }else{
        console.log("rien a faire");
      }
    },
    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.type = options.type;
      this.model = options.model;
      this.lastImageActive = null;
      this.currentViewImg = null;
      this.currentPosition = null;
      this.currentCollection = null;
      this.currentPaginator = null;
      this.nbPhotos = 0;
      this.nbPhotosAccepted = 0;
      this.nbPhotosRefused = 0;
      this.nbPhotosChecked = 0;

      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.navbar = new Navbar({
        parent: this,
        globalGrid: options.globalGrid,
        model: this.model,
      });

      this.globalGrid = options.globalGrid;

      // this.validatedImg = this.myImageCollection.filter({validated : "true"})
      // this.deletedImg = this.myImageCollection.filter({validated : "false"})
      // this.toCheckImg = this.myImageCollection.filter({validated : "null"})

      this.initCollection();
    },

    acceptPhoto : function(e) {
      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].setModelValidated(2);
      }

    },

    nextPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( this.currentCollection.hasNextPage() )
        this.currentCollection.getNextPage();
    },

    prevPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( this.currentCollection.hasPreviousPage() )
        this.currentCollection.getPreviousPage();
    },

    firstPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getFirstPage();
    },

    lastPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getLastPage();
    },

    rejectPhoto : function(e) {

      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].setModelValidated(4);
      }

    },

    toggleModelStatus: function(e){
      e.preventDefault();
      console.log("detect toggle");
      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].toggleModelStatus();
      }

    },

    leaveModal: function(e){
      if(this.rgModal.currentView !== undefined) {
        this.rgModal.currentView.hide();
      }
    },

    displayModal: function(e){
      e.preventDefault();
      if(this.currentPosition !== null ) { //il faut une position pour afficher le modal

        if(this.rgModal.currentView === undefined) {
          this.rgModal.show( new ModalView({ model : this.tabView[this.currentPosition].model}))
        }
        else {
          this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          this.rgModal.currentView.onShow();
        }

      }
    },

    focusFirstImg(){
      if( this.currentPosition === null) {//si aucune position
        if( this.tabView != null){
          this.tabView[0].$el.find('img').focus(); // focus la premiere image
          this.currentPosition = 0; //et on se place sur 0
          this.tabView[0].$el.find('.vignette').toggleClass('active');
        }
      }
    },

    mouvement: function(e){

      if( this.currentPosition === null) {//si aucune position
        this.focusFirstImg();
      }
      else{
        var lastPosition = this.currentPosition;//stock la position avant changement pour savoir si on a bougé
        console.log(lastPosition);
        switch(e.keyCode)
        {
          case 38:// up
          {console.log("^");
            if ( this.currentPosition - 6 >= 0){
              this.currentPosition-=6;
            }
            break;
          }
          case 40://down
          {console.log("v");
            if ( this.currentPosition + 6 <= this.tabView.length - 1 ){
              this.currentPosition+=6;
            }
            break;
          }
          case 37:{ //left
            console.log("<");
            if ( this.currentPosition - 1 >= 0 ){
              this.currentPosition-=1;
            }
            break;
          }
          //right
          case 39://right
          {console.log(">");
            if ( this.currentPosition + 1 <= this.tabView.length - 1 ){
              this.currentPosition+=1;
            }
            break;
          }
        }
        console.log(this.currentPosition);

        if (lastPosition !== this.currentPosition) {// si on a bougé
          this.tabView[this.currentPosition].$el.find('img').focus();//on change le focus
          this.tabView[lastPosition].$el.find('.vignette').toggleClass('active');
          this.tabView[this.currentPosition].$el.find('.vignette').toggleClass('active');
          if( this.rgModal.currentView !== undefined){//si le modal existe on change
            this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          }
        }
      }

    },

    findInput: function(e){
      e.preventDefault(); // disable browser tab
      this.$el.find(".bootstrap-tagsinput  input").focus();

    },

    prevImage: function(){
      var index = this.myImageCollection.indexOf(this.currentViewImg.model); // index 0 a n-1
      if( index - 1 < 0) {
        this.currentViewImg = this.tabView[0];
      }
      else {
        this.currentViewImg = this.tabView[index - 1]; // on se deplace de - 1
      }
      this.rgModal.currentView.changeImage(this.currentViewImg.model);

    },

    nextImage: function(){
      var index = this.myImageCollection.indexOf(this.currentViewImg.model);
      if( index >= this.tabView.length - 1 ) {
        this.currentViewImg = this.tabView[this.tabView.length - 1];
      }
      else {
        this.currentViewImg = this.tabView[index + 1];
      }
      this.rgModal.currentView.changeImage(this.currentViewImg.model);

    },

    fillTagsInput : function(){
      var $inputTags = this.toolsBar.$el.find("#tagsinput");
      this.toolsBar.removeAll();//vide les tags
      var tabTagsTmp = this.tabView[this.currentPosition].getModelTags()
      if( tabTagsTmp !== null )
      {
        tabTagsTmp = tabTagsTmp.split(","); //charge les nouveaux
        for(var i = 0 ; i < tabTagsTmp.length ; i++ ) {
          this.toolsBar.addTag(tabTagsTmp[i]);
        }
      }

    },




    initCollection : function() {
      var _this = this;
      var ImageCollection = PageColl.extend({
        model : CamTrapImageModel,
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
        patch : function(){
          console.log("ouais ouais ouais j'overwrite");
        }
      });

      this.myImageCollection = new ImageCollection();
      console.log(this.myImageCollection);
      console.log(this.myImageCollection.url);
      this.myImageCollection.sync('patch', this.myImageCollection , { error: function () { console.log(this.myImageCollection); console.log("sync impossible");} });

      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });
      this.myImageCollection.on('sync', function() {
        console.log("sync");
        _this.nbPhotos = _this.myImageCollection.fullCollection.length;
        _this.nbPhotosAccepted = _this.myImageCollection.fullCollection.where({validated:2}).length ;
        _this.nbPhotosRefused  = _this.myImageCollection.fullCollection.where({validated:4}).length ;
        _this.nbPhotosChecked = _this.myImageCollection.fullCollection.where({validated:1}).length ;
        _this.toolsBarTop.$el.find("#nbphotos").text(_this.nbPhotos);
        _this.toolsBarTop.$el.find("#nbphotosaccepted").text(_this.nbPhotosAccepted);
        _this.toolsBarTop.$el.find("#nbphotosrefused").text(_this.nbPhotosRefused);
        _this.toolsBarTop.$el.find("#nbphotoschecked").text(_this.nbPhotosChecked);
        _this.toolsBarTop.$el.find("#nbphotosnotchecked").text(_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused));

    });

      this.myImageCollection.fetch();

      this.paginator.collection.on('reset', function(e){
        console.log("jai change de page");
      });

    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      this.rgNavbar.show(this.navbar);
      this.display();
    },

    reloadFromNavbar: function(model) {
      this.model = model;
      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.initCollection();

      this.display();
    },

    display: function() {
      var _this = this;
      this.listenTo(this.myImageCollection, 'reset', function(e){
        _this.displayImages(_this.myImageCollection);
        _this.rgToolsBarTop.show(this.toolsBarTop);
      });
      this.currentCollection = this.myImageCollection;
      this.displaySensorForm();
      this.displaySiteForm();
      this.displayImageDetailForm();
      this.displayPaginator(this.paginator)
      this.displayToolsBar();
      this.displayToolsBarTop();
    },


    setTotal: function(){
      this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
      this.ui.total.html(this.grid.grid.collection.length);
    },

    displaySiteForm: function() {
      this.nsform = new NsForm({
        name: 'siteForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'monitoredSites',
        formRegion: this.ui.siteForm,
        displayMode: 'display',
        id: this.siteId,
        reloadAfterSave: false,
      });
    },

    displaySensorForm: function() {
      this.nsform = new NsForm({
        name: 'sensorForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.sensorForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
    },

    displayImageDetailForm: function() {
      this.nsform = new NsForm({
        name: 'imageDetailsForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.imageDetailsForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
    },

    displayImages: function(myCollectionToDisplay){
      var _this = this;

      var ImageModel = new CamTrapImageModel();
      console.log(this.ui.gallery);
      //TODO detruit les view a la main sinon pb avec les models
      if( typeof (_this.tabView) !== "undefined" ){
        this.destroyViews(_this.tabView);
      }
      this.ui.gallery.html('');
      console.log("on vide le tableau");
      _this.currentPosition = null;
      _this.tabView = [];
      myCollectionToDisplay.each(function(model){
        var newImg = new CamTrapItemView({
          model: model,
          parent: _this,
        });
        _this.tabView.push(newImg);
        _this.ui.gallery.append(newImg.render().el);

      });
      console.log("on a rempli le tableau");
      console.log(this.tabView);
      if (this.tabView.length > 0){
        console.log("on focus le premier");
        this.focusFirstImg();
      }
    },

    displayPaginator: function (pagin) {
      this.ui.paginator.html('');
      this.ui.paginator.append(pagin.render().el);
    },

    displayToolsBar: function () {
      var _this = this ;
      this.toolsBar = new ToolsBar( {
        parent : _this,
      });
      this.rgToolsBar.show(this.toolsBar);
    },

    displayToolsBarTop: function(nbPhotos){
      var _this = this ;
      this.toolsBarTop = new ToolsBarTop( {
        parent : _this,
      });
      this.rgToolsBarTop.show(this.toolsBarTop);
    },

    destroyViews : function(tabView){

      for(var i = 0 ; i < tabView.length ; i++)
      {
        tabView[i].destroy();
      }

    },

    displayAll: function (e){
      this.currentCollection = this.myImageCollection;
      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollection);
      this.displayPaginator(this.paginator);

    },

    displayValidated: function (e){
      var _this = this ;

      var filterModelValidated = new virtualcollection(this.myImageCollection.fullCollection ,
        {
          filter : {validated : 2}
        });

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      this.myImageCollectionValidated = new paginationFiltered(filterModelValidated.models)
      this.myPaginationValidated = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionValidated
      });

      this.listenTo(this.myImageCollectionValidated, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionValidated);
      });
      this.currentCollection = this.myImageCollectionValidated;
      console.log(this.currentCollection);
      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionValidated);
      this.displayPaginator(this.myPaginationValidated);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }
      else {
        console.log(this.ui.gallery.html());
      }
      //this.focusFirstImg();

    },

    displayDeleted: function (e){
      /*var filterModel = this.myImageCollection.fullCollection.where({validated:false});
      console.log(filterModel);
      filterModel[0].set("validated",true);*/
      var _this = this ;

      var filterModelDeleted = new virtualcollection(this.myImageCollection.fullCollection ,
        {
          filter : {validated : 4}
        });

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      this.myImageCollectionDeleted = new paginationFiltered(filterModelDeleted.models)
      this.myPaginationDeleted = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionDeleted
      });

      this.listenTo(this.myImageCollectionDeleted, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionDeleted);
      });

      this.currentCollection = this.myImageCollectionDeleted

      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionDeleted);
      this.displayPaginator(this.myPaginationDeleted);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }
      //this.focusFirstImg();

    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    keyPressed: function(e){
    },

    displaySwalUnchecked: function(compteur) {
      var _this = this;
      Swal({
                  title: 'Warning validate without check ALL photos',
                  text:  +_this.nbPhotosChecked+' photos still underteminate and '+(_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused) )+' not seen yet\n'+'If you continue all of this photos will be accept automatically' ,
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Ok',

                  closeOnConfirm: true,
                },
                function() {
                  console.log("je force la validation");
                  //TODO mettre le status validated a 8 pour sauvegarder la validation de force

                }
              );
      //_this.swal({title:"warning",text:"You gonna validate without checked "+String(nbUnchecked)+" photos"},"warning");
    },

    displaySwalValidate: function(compteur){
      var _this = this;
      var text = "";
      if( _this.nbPhotosAccepted == 0 ) {
        text += _this.nbPhotosRefused+' will be refused';
      }
      else if( _this.nbPhotosRefused == 0 ) {
        text += _this.nbPhotosAccepted+' will be accepted';
      }else{
        text +=  _this.nbPhotosAccepted+' will be accepted and '+_this.nbPhotosRefused+' refused';
      }

      Swal({
                  title: 'Well done',
                  text:  'you have finish this sessions\nOn '+_this.nbPhotos+' photos '+text,
                  type: 'success',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Ok',

                  closeOnConfirm: true,
                },
                function() {
                  console.log("je valide");

                }
              );
    },


    validateAll: function() {
      console.log("on veut tout valider ");
      var compteur = {};
      if( this.nbphotosnotchecked >0 || this.nbPhotosChecked > 0) {
        this.displaySwalUnchecked();
      }
      else {
        this.displaySwalValidate();
      }


      /*for(var i = 0 ; i < this.currentCollection.fullCollection ; i++ )
      {
        if(this.currentCollection.fullCollection.models[i].attributes.)
      }*/
    /*  compteur.total = 0
      compteur.unchecked = 0;
      compteur.total = this.myImageCollection.fullCollection.length;
      for( var model of this.myImageCollection.fullCollection.models )
      {
        if(model.attributes.validated === 0 || model.attributes.validated === null)
        {
          compteur.unchecked+=1;
        }
      }

      if( compteur.unchecked ){
        this.displaySwalUnchecked(compteur);
      }
      else {
        this.displaySwalValidate(compteur);
      }
      console.log("photo a check : "+compteur.unchecked);*/
    /*  var _this = this;
      var flagUnchecked = false
      var url = config.coreUrl+'sensors/'+this.type+'/uncheckedDatas';
      // parcours de la page
      var sizePage = this.myImageCollection.length;
      var sizeAllPages = this.myImageCollection.fullCollection.length;
      var dataToSend = [];
      var test = this.myImageCollection.toJSON()*/
      /*  for ( var i = 0 ; i < sizeAllPages ; i ++ ){
      dataToSend.push({
      id:this.myImageCollection.fullCollection.models[i].id,
      status:this.myImageCollection.fullCollection.models[i].status
    })
  };*/

/*  for ( var i = 0 ; i < sizePage && !flagUnchecked ; i ++ ){
    switch (this.myImageCollection.models[i].status) {
      case 0 : {
        break;
      }
      case 1 : {
        break;
      }
      default :{
        flagUnchecked = true;
        _this.displayListUnchecked();
        break;
      }
    }
  }
  $.ajax({
    url : url,
    method: 'POST',
    data: {data : JSON.stringify(this.myImageCollection) },
    context: this,
  })
  .done( function(response,status,jqXHR) {
  })
  .fail( function(jqXHR, textStatus, errorThrown) {

  });*/
},

/*swal: function(opt, type, callback) {
  var btnColor;
  switch (type){
    case 'success':
    btnColor = 'green';
    break;
    case 'error':
    btnColor = 'rgb(147, 14, 14)';
    break;
    case 'warning':
    btnColor = 'orange';
    break;
    default:
    return;
    break;
  }

  Swal({
    title: opt.title || opt.responseText || 'error',
    text: opt.text || '',
    type: type,
    showCancelButton: false,
    confirmButtonColor: btnColor,
    confirmButtonText: 'OK',
    closeOnConfirm: true,
  },
  function(isConfirm) {
    //could be better
    if (callback) {
      callback();
    }
  });
},*/

});
});
