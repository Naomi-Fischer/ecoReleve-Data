define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ns_ruler/ruler',
  'backbone-forms',
  'ns_grid/grid.view',

  ], function ($, _, Backbone, Marionette,Ruler, Form, GridView, tpl) {

    'use strict';
    return Form.editors.GridFormEditor = Form.editors.Base.extend({
        events: {
            'click .js-btn-add' : 'addRow',
            'click .js-cloneLast' : 'cloneLast',
        },

            // <button type="button" class=" <%= hidden %> btn btn-success js-addFormBtn">+</button>\
            // <button type="button"  class="js-cloneLast <%= hiddenClone %> btn">Clone Last</button>\
            // <button type="button"  class="<%= hidden %> btn btn-success js-addFormBtn">+</button>\
            // <button type="button"  class="js-cloneLast <%= hiddenClone %> btn ">Clone Last</button>\

        template: '\
            <div class="js-rg-grid-subform col-xs-12 no-padding" style="height: 500px">\
            </div>\
            <button type="button" class="js-btn-add btn btn-success">Add</button>\
        ',

        
        addRow: function(){
            this.gridView.gridOptions.api.addItems([{}]);
        },

        render: function(){
            this.template = _.template(this.template, this.templateSettings);
            this.$el.html(this.template);
            return this;
        },

        afterRender: function(){
            this.regionManager.addRegions({
              rgGrid: '.js-rg-grid-subform'
            });
            this.regionManager.get('rgGrid');
            this.regionManager.get('rgGrid').show(this.gridView = new GridView({
                columns: this.columnsDefs,
                clientSide: true,
                gridOptions: {
                  rowData: this.options.model.get(this.options.key)
                },
                onFocusedRowChange: function(row){
                }
            }));
        },

        initialize: function(options) {
            this.regionManager = new Marionette.RegionManager();
            _.bindAll(this, 'render', 'afterRender'); 
            this.render = _.wrap(this.render, function(render) {
                render();    
                setTimeout(function(){
                    _this.afterRender();
                }, 0);
                return _this;
            });

            var _this = this; 
            //Form.editors.Base.prototype.initialize.call(this, options);
            this.options = options;
            this.formatColumns();
            
            this.templateSettings = {
                hidden: false,
                hiddenClone: false,
            };
            
            this.options.schema.fieldClass = 'col-xs-12';
            return;


            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }

            if (options.schema.options.nbFixedCol){
                this.nbFixedCol = options.schema.options.nbFixedCol;
            }

            if (options.schema.options.delFirst){
                this.delFirst = options.schema.options.delFirst;
            }

             if (!options.schema.options.cloneLast){
                this.hiddenClone = 'hidden';
            }


            this.template = options.template || this.constructor.template;
            this.showLines = true ;
            if (this.options.schema.options.showLines != null) {
                this.showLines = this.options.schema.options.showLines ;
            }
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
                this.hiddenClone = 'hidden';
            }
            this.hasNestedForm = true;

            this.key = this.options.key;
            this.nbByDefault = this.options.model.schema[this.key]['nbByDefault'];
        },

        formatColumns: function(){
            var odrFields = this.options.schema.fieldsets[0].fields;
                
            

            this.columnsDefs = [];
            for (var i = odrFields.length - 1; i >= 0; i--) {
                var field = this.options.schema.subschema[odrFields[i]];

                var colDef = {
                    editable: true,
                    field: field.name,
                    headerName: field.title,
                    type: field.type,
                    options: field.options
                };
                
                this.columnsDefs.push(colDef)
            }            
        },


        //removeForm
        deleteForm: function() {

        },

        addEmptyForm: function() {
            var mymodel = Backbone.Model.extend({
                defaults : this.options.schema.subschema.defaultValues
            });

            var model = new mymodel();
            //model.default = this.options.model.attributes[this.key];
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            this.addForm(model,this.forms.length+1);
        },

		cloneLast: function() {
			//var resultat = this.forms[this.forms.length-1].commit() ;
			if (resultat != null) return ; // COmmit NOK, on crée pas la ligne

            var mymodel = Backbone.Model.extend({
                defaults : this.forms[this.forms.length-1].model.attributes
            });

            var model = new mymodel();
            //model.default = this.options.model.attributes[this.key];
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            this.addForm(model,this.forms.length+1);
        },

        addForm: function(model,index){
            var _this = this;
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();

            form.$el.find('input').on("change", function(e) {
                window.formChange = true;
            });
            form.$el.find('select').on("change", function(e) {
                window.formChange = true;
            });
            form.$el.find('textarea').on("change", function(e) {
                window.formChange = true;
            });

            this.initRules(form);
            this.forms.push(form);

            if(!this.defaultRequired){
       /*         form.$el.find('fieldset').append('\
                    <div class="' + this.hidden + ' col-xs-12 control">\
                        <button type="button" class="btn btn-warning pull-right" id="remove">-</button>\
                    </div>\
                ');*/
                 if (this.delFirst){
                    var optClass = ' fixedCol';
                    var opt2Class = ' pull-left';
                } else {
                    var optClass = '';
                    var opt2Class = ' pull-right';
                }

                form.$el.find('fieldset').append('\
                    <div id="delBtn" class="' + this.hidden +optClass+ ' col-xs-12 control grid-field" style={background: #eee;}>\
                        <button type="button" class="btn btn-danger'+ opt2Class +'" id="remove"><span class="reneco reneco-trash"></span></button>\
                    </div>\
                ');
                form.$el.find('button#remove').on('click', function() {
                  _this.$el.find('#formContainer').find(form.el).remove();
                  var i = _this.forms.indexOf(form);
                  if (i > -1) {
                      _this.forms.splice(i, 1);
                  }
                  return;
                });
            }


            this.$el.find('#formContainer').append(form.el);
            if (_this.showLines) {
                if (this.delFirst && !this.disabled){
                    var optClass = ' firstCol-2';
                } else {
                    var optClass = '';
                }
                /*if (!this.nbFixedCol) {
                    this.$el.find('#formContainer form fieldset').last().prepend('<div style="height: 34px; text-align: center;" class="grid-field col-md-2'+optClass+'"><span>' + index + '</span></div>');
                }
                else {
                    this.$el.find('#formContainer form fieldset').last().append('<div style="height: 34px; text-align: center;" class="grid-field fixedCol col-md-2'+optClass+'"><span>' + index + '</span></div>');
                }*/
                this.$el.find('#formContainer form fieldset').last().append('<div style="height: 34px; text-align: center;" class="grid-field fixedCol col-md-2'+optClass+'"><span>' + index + '</span></div>');

            }
        },



        plouf: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var _this = this;

            var $el = $($.trim(this.template({
                hidden: this.hidden,
                hiddenClone : this.hiddenClone
            })));
            this.setElement($el);
            

            var data = this.options.model.attributes[this.key];

            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;

            var size=0;
            var prevSize = 0;
            if (this.showLines) {
                prevSize +=2;
            }
            if (this.delFirst && !this.disabled) {
                prevSize +=2;
            }
            var odrFields = this.options.schema.fieldsets[0].fields;

            if (this.nbFixedCol){
                var reordered = odrFields.splice(0,this.nbFixedCol);
                odrFields = odrFields.concat(reordered.reverse());
                this.options.schema.fieldsets[0].fields = odrFields;
            }
            for (var i = odrFields.length - 1; i >= 0; i--) {
                var col = model.schema[odrFields[i]];
                //sucks
                var test = true;
                if(col.fieldClass){
                 test = !(col.fieldClass.split(' ')[0] == 'hide'); //FK_protocolType
                 col.fieldClass += ' grid-field';
                }

                if (this.nbFixedCol && reordered.indexOf(col.name) != -1){
                    col.fieldClass += ' fixedCol ';
                    if (prevSize != 0) {
                        /*if (this.delFirst && !this.disabled) {
                            col.fieldClass += ' firstCol-'+(parseInt(prevSize)+2);
                        } else {
                            col.fieldClass += ' firstCol-'+prevSize;
                        }*/
                        col.fieldClass += ' firstCol-'+prevSize;

                    }
                    this.options.schema.subschema[odrFields[i]].fieldClass = col.fieldClass;
                    prevSize += col.size;

                }

                if(col.title && test) {
                 this.$el.find('#th').prepend('<div class="'+ col.fieldClass +'"> | ' + col.title + '</div>');
                }

                if ( col.size == null) {
                    size += 150;
                }
                else {
                    size += col.size*25;
                }

            }


            if (this.delFirst && !this.disabled){
                if (this.nbFixedCol) {
                    this.$el.find('#th div').last().addClass('firstCol-2');
                    this.options.schema.subschema[odrFields[odrFields.length-1]].fieldClass += ' firstCol-2';
                } else {
                    this.$el.find('#th div').first().addClass('firstCol-2');
                    this.options.schema.subschema[odrFields[0]].fieldClass += ' firstCol-2';
                }
            }

            if (this.nbFixedCol || this.showLines) {
                 if (this.delFirst && !this.disabled) {
                    var nbCol = prevSize;
                    this.$el.find('#th').append('<div class="fixedCol col-md-2 grid-field">&nbsp;&nbsp;</div>');
                } else {
                    var nbCol = prevSize;
                }
                this.options.schema.subschema[odrFields[0]].fieldClass += ' firstCol-'+nbCol;
                this.$el.find('#th div').first().addClass('firstCol-'+nbCol);
            }

            if (_this.showLines) {
                 if (this.delFirst && !this.disabled){
                    var optClass = ' firstCol-2';
                } else {
                    var optClass = '';
                }

                if (this.nbFixedCol || this.delFirst){
                    this.$el.find('#th').append('<div class="grid-field fixedCol col-md-2'+optClass+'">&nbsp;|  N°</div>') ;
                    this.options.schema.subschema[odrFields[0]].fieldClass += ' firstCol-'+nbCol;
                    this.$el.find('#th div').first().addClass('firstCol-'+nbCol);
                } else {
                    this.$el.find('#th').append('<div class="grid-field fixedCol col-md-2'+optClass+'">&nbsp;|  N°</div>') ;

                }
                size += 310;
            }
            else {
                size += 285;
            }

            //this.$el.find('#th').prepend('<div style="width: 34px;" class="pull-left" ><span class="reneco reneco-trash"></span></div>');
            // size += 35;

            this.$el.find('#th').width(size);
            this.$el.find('#formContainer').width(size);

            if (data) {
                //data
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        if(i >= this.nbByDefault) {
                            this.defaultRequired = false;
                        }
                        var model = new Backbone.Model();
                        model.schema = this.options.schema.subschema;
                        model.fieldsets = this.options.schema.fieldsets;
                        model.attributes = data[i];
                        this.addForm(model,i+1);

                    };

                    if (data.length < this.nbByDefault) {
                        for (var i = 0; i < data.length; i++) {
                            this.addForm(model,i+1);
                        }
                    }
                    this.defaultRequired = false;
                }
            } else {
                //no data
                if (this.nbByDefault >= 1) {
                    for (var i = 0; i < this.nbByDefault; i++) {
                        this.addEmptyForm();
                    }
                    this.defaultRequired = false;
                }
            }

            return this;
        },

        feedRequiredEmptyForms: function() {

        },

        reorderTofixCol: function() {

        },
        getValue: function() {
            var rowData = [];
            this.gridView.gridOptions.api.forEachNode( function(node) {
                rowData.push(node.data);
            });
        },

    initRules:function(form) {
      var _this = this;
      this.ruler = new Ruler({
            form: form
          });
      var globalError = {};
      var errorMsg = 'error on field(s): \n';

      _.each(form.schema,function(curSchema){
        if (curSchema.rule){
          var curRule = curSchema.rule;
          var target = curSchema.name;
          var curResult = _this.ruler.addRule(target,curRule.operator,curRule.source,curRule.value);
          if (curResult) {
            globalError[target] = curResult;
            errorMsg +=  curResult.object + ':  '+curResult.message+'\n' ;
          }
        }
      });

      if (!$.isEmptyObject(globalError) && this.displayMode == 'edit'){
        this.swal({
          title : 'Rule error',
          text : errorMsg,
          type:'error',
          showCancelButton: false,
          confirmButtonColor:'#DD6B55',
          confirmButtonText:'Ok'});
      }
    },

    });
});