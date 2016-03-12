define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/SimpleTable',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/on',
  'dojo/query',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/form/Select',
  'dijit/form/TextBox',
  'dijit/registry',
  'jimu/LayerInfos/LayerInfos'
],
function(declare, _WidgetsInTemplateMixin, BaseWidget, SimpleTable, dom, domConstruct, domClass, on, query, lang, array, Select, TextBox, registry, LayerInfos) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-map-filter',

    layerList: null,
    grpSelect: null,
    groupCounter: 0,
    defaultDef: [],
    runTimeConfig: null,

    postCreate: function() {
      this.inherited(arguments);
      this.createMapLayerList();
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      //this.createDivsForFilter();
      this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
    },
    
    btnNewRowAction: function() {
      this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"}); 
    },

    createMapLayerList: function() {
      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function(operLayerInfos) {
          if(operLayerInfos._layerInfos && operLayerInfos._layerInfos.length > 0) {
            this.layerList = operLayerInfos._layerInfos;
            array.forEach(operLayerInfos._layerInfos, lang.hitch(this, function(layer) {
              if(typeof(layer.layerObject.getDefinitionExpression()) !== 'undefined' ) {
                this.defaultDef.push({layer: layer.id, definition: layer.layerObject.getDefinitionExpression()});
              } else {
                this.defaultDef.push({layer: layer.id, definition: null});
              }
            }));
            this.createGroupSelection();
          }
        }));
    },

    createNewRow: function(pValue) {
      var table = dom.byId("tblPredicates");
      
      if(pValue.state === "new") {
        if(table.rows.length > 2) {
          var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
          this.createConditionSelection(prevRowConjunCell, pValue);
        } else {
          if(table.rows.length === 2) {
            var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
            this.createConditionSelection(prevRowConjunCell, pValue);
          }
        }
      }
      var row = table.insertRow(-1);
      var cell_operator = row.insertCell(0);
      var cell_value = row.insertCell(1);
      var cell_conjunc = row.insertCell(2);
      var cell_remove = row.insertCell(3);

      domClass.add(cell_operator, "tdOperatorHide");
      //if((table.rows.length % 2) === 0) {
        //domClass.add(row, "tableRow");
      //}

      this.createOperatorSelection(cell_operator,pValue);
      this.createTextBoxFilter(cell_value,pValue);
      this.removeTableRow(cell_remove,row,table.rows.length);

      if(pValue.state === "reload") {
        if(pValue.conjunc !== "") {
          var currRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
          this.createConditionSelection(currRowConjunCell, pValue);
        }
      }

    },

    createGroupSelection: function() {
        var ObjList = [];
        array.forEach(this.config.groups, lang.hitch(this, function(group) {
          var grpObj = {};
          grpObj.value = group.name;
          grpObj.label = group.name;
          grpObj.selected = false;
          ObjList.push(grpObj);
        }));

        this.grpSelect = new Select({
          options: ObjList,
        }).placeAt(this.groupPicker);

        this.grpSelect.startup();
        this.own(on(this.grpSelect, "change", lang.hitch(this, function(val) {
          this.resetLayerDef();
          this.removeAllRows();
          this.reconstructRows(val);
        })));
    },

    createOperatorSelection: function(pCell, pValue) {
        var ObjList = [
          {'value': '=', 'label': 'EQ'},
          {'value': '>', 'label': 'GT'},
          {'value': '>=', 'label': 'GTE'},
          {'value': '<=', 'label': 'LT'},
          {'value': '<=', 'label': 'LTE'}
        ];
        var grpSelect = new Select({
          options: ObjList,
        }).placeAt(pCell);
         grpSelect.startup();
         grpSelect.set('value', pValue.operator);
    },

    createTextBoxFilter: function(pCell, pValue) {
      var txtFilterParam = new TextBox({
          value: pValue.value /* no or empty value! */,
          placeHolder: "Type in a Value"
      }).placeAt(pCell);
      txtFilterParam.startup();
    },

    createConditionSelection: function(pCell, pValue) {
      domConstruct.empty(pCell);
        var ObjList = [
          {'value': 'OR', 'label': 'OR'},
          {'value': 'AND', 'label': 'AND'}
        ];
        var grpSelect = new Select({
          options: ObjList,
        }).placeAt(pCell);
        grpSelect.startup();
        grpSelect.set('value', pValue.conjunc);
    },

    removeTableRow: function(pCell,pRow,pCount) {
      if(pCount !== 2) {
        var dsNode = domConstruct.create("div",{
          'class': 'deleteCell',
          innerHTML: ''
        });
        on(dsNode,'click',lang.hitch(this, function() {
          domConstruct.destroy(pRow);
          var table = dom.byId("tblPredicates");
          if(table.rows.length >= 2) {
            var conjunCell = table.rows[table.rows.length-1].cells[2];
            domConstruct.empty(conjunCell);
          }
        }));
        domConstruct.place(dsNode, pCell);
      }
    },

    removeAllRows: function() {
      var table = dom.byId("tblPredicates");
      if(table.rows.length > 1) {
          domConstruct.destroy(table.rows[1]);
          this.removeAllRows();
      }
    },
    
    reconstructRows: function(pValue) {
      array.forEach(this.config.groups, lang.hitch(this, function(group) {  
        if (group.name === pValue) {
          if(typeof(group.def) !== 'undefined') {
            array.forEach(group.def, lang.hitch(this, function(def) { 
              this.createNewRow({value: def.value, operator: def.operator, conjunc: def.conjunc, state:"reload"});    
            })); 
          } else {
            this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
          }  
        }  
      }));    
    },

    parseTable: function() {
      var sqlParams = [];
      var rows = dom.byId("tblPredicates").rows;
      array.forEach(rows, lang.hitch(this, function(row, i){
        if(i >= 1) {
          var cell_operator = registry.byNode(row.cells[0].childNodes[0]);
          var cell_value = registry.byNode(row.cells[1].childNodes[0]);
          var cell_conjunc = {};
          if(typeof(row.cells[2].childNodes[0]) !== 'undefined') {
            cell_conjunc = registry.byNode(row.cells[2].childNodes[0]);
          } else {
            cell_conjunc.value = '';
          }
          sqlParams.push({
            operator: cell_operator.value,
            userValue: cell_value.value,
            conjunc: cell_conjunc.value
          });
        }
      }));
      return sqlParams;
    },

    setFilterLayerDef: function() {
      var sqlParams = this.parseTable();
      array.forEach(this.layerList, lang.hitch(this, function(layer) {
        array.forEach(this.config.groups, lang.hitch(this, function(group) {
          if(this.grpSelect.value === group.name) {
            array.forEach(group.layers, lang.hitch(this, function(grpLayer) {
              if(layer.id === grpLayer.layer) {
                var expr = '';
                group.def = [];
                array.forEach(sqlParams, lang.hitch(this, function(p,i) {
                  array.forEach(layer.layerObject.fields, lang.hitch(this, function(field) {
                    if(field.name === grpLayer.field) {
                      if((field.type).indexOf("String") > -1) {
                        expr = expr + grpLayer.field + " " + p.operator + " '" + p.userValue + "' " + p.conjunc + " ";
                      } else {
                        expr = expr + grpLayer.field + " " + p.operator + " " + p.userValue + " " + p.conjunc + " ";
                      }
                      group.def.push({value: p.userValue, operator: p.operator, conjunc: p.conjunc});
                    }
                  }));
                }));
                console.log(expr);
                if(expr !== "") {
                  layer.layerObject.setDefinitionExpression(expr);
                }
              }
            }));
          this._publishData(group);  
          }
        }));
      }));
    },

    resetLayerDef: function() {
      array.forEach(this.layerList, lang.hitch(this, function(layer) {
        array.forEach(this.defaultDef, lang.hitch(this, function(def) {
          if(def.layer === layer.id ) {
            layer.layerObject.setDefinitionExpression(def.definition);
            //this.defaultDef.push({layer: layer.id, definition: layer.layerObject.defaultDefinitionExpression});
          }
        }));
      }));
    },

    // for W2W communication
    _publishData: function(pValue) {
      this.publishData({
        message: pValue
      });
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){

    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});