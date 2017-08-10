///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/array',
    "./EditFields",
    "../utils",
    'dijit/form/NumberSpinner',
    'dojo/dom-construct',
    'dojo/dom'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Table,
    LayerInfos,
    utils,
    lang,
    html,
    on,
    array,
    EditFields,
    editUtils,
    domConstruct,
    dom) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-edit-setting',

      _jimuLayerInfos: null,
      _layersTable: null,
      _editableLayerInfos: null,
      _featureService: null,
      _arrayOfFields: null,
      _layerForFields: null,
      _latField: null,
      _longField: null,
      _layerInfos: [],

      startup: function() {
        this.inherited(arguments);

        console.log("startup");

        document.getElementById('selectLatitude').style.width = "100px";
        document.getElementById('selectLatitude').style.margin = "15px";
        document.getElementById('selectLongitude').style.width = "100px";
        document.getElementById('selectLongitude').style.margin = "15px";

        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
           

            var count = 0;
            var latNode = document.getElementById('selectLatitude');
            var longNode = document.getElementById('selectLongitude');
           
            /* operLayerInfos.traversalLayerInfosOfWebmap(function (layerInfo) {
              layerInfo.getLayerObject().then(function (lo) {
              if (lo.fields) {
                
                array.forEach(lo.fields, function(field){
                  console.log("fields Names " + field.name);

                  var option = document.createElement('option');
                  option.text = field.name;
                  option.value = count;
                  latNode.add(option);

                  var longOption = document.createElement('option');
                  longOption.text = field.name;
                  longOption.value = count;
                  longNode.add(longOption);
                  count++;
                });
                    
                  }
                })
              });*/

            
              this._featureService = operLayerInfos.getLayerInfoArray()[0].getUrl(); //this currently gets the first layer, need to change to get the selected layer
              this.layerForFields = operLayerInfos.getLayerInfoArray()[0];

              this._jimuLayerInfos = operLayerInfos;
              this._init();
              this.setConfig();

          }));
           
              var layerToPop = this.map.getLayer(this.layerForFields.id);

              console.log("++++++++++++ " + this.nls.fields);
      },


      _init: function() {
        this._initToolbar();
        this._initLayersTable();
      },



      //this is supposed to get the fields from the selected feature service
      onFieldClick: function(click){
        console.log("on Field click");

        var layersTableData =  this._layersTable.getData();
        var selected = null;

        console.log("length +++++++++++ " + layersTableData.length);

        //this can tell you what feature service is selected via the radio button

        var label = null;
        array.forEach(layersTableData, function(layerInfo, index) {
          
          if(layersTableData[index].edit == true){

             console.log("____+_+" + layersTableData[index].edit, layersTableData[index].label);
             selected = index;
             label = layersTableData[index].label;
             
          }
          //need to:
          //1) populate the drop down fields according to the feature service that is selected
          //2) set the config to reflect the feature service
        
        });

        var count = 0;
        var latNode = document.getElementById('selectLatitude');
        var longNode = document.getElementById('selectLongitude');
        
        latNode.innerHTML = "";
        longNode.innerHTML = "";
        
       // var info = this._jimuLayerInfos.getLayerInfoArray()[selected];
        
        
        this._jimuLayerInfos.traversalLayerInfosOfWebmap(function (layerInfo) {
              layerInfo.getLayerObject().then(function (lo) {

         if(label == layerInfo.title){ 
              console.log("++++ " +  layerInfo.id, layerInfo.title);
                
                if (lo.fields) {
                
                  array.forEach(lo.fields, function(field){
                  console.log("fields Names " + field.name);

                  var option = document.createElement('option');
                  option.text = field.name;
                  option.value = count;
                  latNode.add(option);

                  var longOption = document.createElement('option');
                  longOption.text = field.name;
                  longOption.value = count;
                  longNode.add(longOption);
                  count++;
                  });
                    
                  }
                }
                })
              
              });
      
          
         console.log("fields button press " + this._jimuLayerInfos);
         this._featureService = this._jimuLayerInfos.getLayerInfoArray()[selected].getUrl();
         this.layerForFields = this._jimuLayerInfos.getLayerInfoArray()[selected];
         selected = null;
         console.log(this._featureService, this.layerForFields);

         this.getConfig();

         //this.setConfig();
       
      },
      //unused function
      _initToolbar: function() {
      
        this._onToolbarSelected();
      },

      _initLayersTable: function() {
        var fields = [{
          name: 'edit',
          title: this.nls.edit,
          id: 'rdo',
          type: 'radio',
          width: '120px',
          'class': 'select'
        }, {
          name: 'label',
          title: this.nls.label,
          type: 'text'
        }];

   
        var args = {
          fields: fields,
          selectable: false
        };

        this._layersTable = new Table(args);
        this._layersTable.placeAt(this.tableLayerInfos);
        this._layersTable.startup();
     

      this._initRadioButtons;

        this.own(on(this._layersTable,
          'actions-edit',
          lang.hitch(this, this._onEditFieldInfoClick)));
         
          //this._initRadioButtons();
      },

      //unused function
      _radioOnClick: function(radio){

        console.log("radio onclick ");

        
      },

      //this is supposed to initialise the radio buttons but is currently not used

      _initRadioButtons: function(){
          var group = "radio_" + utils.getRandomString();

          var layersTableData =  this._layersTable.getData();

          console.log("length +++++++++++ " + layersTableData.length);

          array.forEach(layersTableData, function(layerInfo, index) {
         
          console.log("____+_+" + layersTableData[index].edit, layersTableData[index].label);

        }); 
       

    },

      setConfig: function() {
     
        this._editableLayerInfos = this._getEditableLayerInfos();

      

        this._setLayersTable(this._editableLayerInfos);
     
      },

      _getEditableLayerInfos: function() {
       
        var editableLayerInfos = [];
        for(var i = this.map.graphicsLayerIds.length - 1; i >= 0; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" &&
              layerObject.url &&
              layerObject.isEditable &&
              layerObject.isEditable()) {
            var layerInfo = this._getLayerInfoFromConfiguration(layerObject);
            if(!layerInfo) {
              layerInfo = this._getDefaultLayerInfo(layerObject);
            }
            editableLayerInfos.push(layerInfo);
          }
        }
        return editableLayerInfos;
      },

      _getLayerInfoFromConfiguration: function(layerObject) {
        var layerInfo = null;
        var layerInfos = this.config.editor.layerInfos;
        if(layerInfos && layerInfos.length > 0) {
          for(var i = 0; i < layerInfos.length; i++) {
            if(layerInfos[i].featureLayer &&
               layerInfos[i].featureLayer.id === layerObject.id) {
              layerInfo = layerInfos[i];
              break;
            }
          }

          if(layerInfo) {
            // update fieldInfos.
            layerInfo.fieldInfos = this._getSimpleFieldInfos(layerObject, layerInfo);
            // set _editFlag to true
            layerInfo._editFlag = true;
          }
        }
        return layerInfo;
      },

      _getDefaultLayerInfo: function(layerObject) {
        var layerInfo = {
          'featureLayer': {
            'id': layerObject.id,
            'fields' : layerObject.fields
          },
          'disableGeometryUpdate': false,
          'fieldInfos': this._getSimpleFieldInfos(layerObject),
          '_editFlag': this.config.editor.layerInfos &&
                        this.config.editor.layerInfos.length === 0 ? true : false
        };
        return layerInfo;
      },

      _setLayersTable: function(layerInfos) {
        array.forEach(layerInfos, function(layerInfo) {
          var _jimuLayerInfo = this._jimuLayerInfos.getLayerInfoById(layerInfo.featureLayer.id);
          var addRowResult = this._layersTable.addRow({
            label: _jimuLayerInfo.title,
            edit: layerInfo._editFlag,
            disableGeometryUpdate: layerInfo.disableGeometryUpdate
          });
          addRowResult.tr._layerInfo = layerInfo;

        
        }, this);

        this._initRadioButtons();
      },

      // about fieldInfos mehtods.
      _getDefaultSimpleFieldInfos: function(layerObject) {
        var fieldInfos = [];
        for (var i = 0; i < layerObject.fields.length; i++) {
          if(layerObject.fields[i].editable ||
            layerObject.fields[i].name.toLowerCase() === "globalid" ||
            //layerObject.fields[i].name.toLowerCase() === "objectid" ||
            layerObject.fields[i].name === layerObject.objectIdField) {
            fieldInfos.push({
              fieldName: layerObject.fields[i].name,
              label: layerObject.fields[i].alias || layerObject.fields[i].name,
              isEditable: (layerObject.fields[i].name.toLowerCase() === "globalid" ||
                          //layerObject.fields[i].name.toLowerCase() === "objectid" ||
                          layerObject.fields[i].name === layerObject.objectIdField) &&
                          !layerObject.fields[i].editable ?
                          null :
                          true,
              visible: true
            });
          }
        }
        return fieldInfos;
      },

      _getWebmapSimpleFieldInfos: function(layerObject) {
        var webmapSimpleFieldInfos = [];
        var webmapFieldInfos =
          editUtils.getFieldInfosFromWebmap(layerObject.id, this._jimuLayerInfos);
        if(webmapFieldInfos) {
          array.forEach(webmapFieldInfos, function(webmapFieldInfo) {
            if(webmapFieldInfo.isEditableOnLayer !== undefined &&
              (webmapFieldInfo.isEditableOnLayer ||
              webmapFieldInfo.fieldName.toLowerCase() === "globalid" ||
              //webmapFieldInfo.fieldName.toLowerCase() === "objectid" ||
              webmapFieldInfo.fieldName === layerObject.objectIdField)) {
              webmapSimpleFieldInfos.push({
                fieldName: webmapFieldInfo.fieldName,
                label: webmapFieldInfo.label,
                isEditable: (webmapFieldInfo.fieldName.toLowerCase() === "globalid" ||
                            //webmapFieldInfo.fieldName.toLowerCase() === "objectid" ||
                            webmapFieldInfo.fieldName === layerObject.objectIdField) &&
                            !webmapFieldInfo.isEditable ?
                            null :
                            webmapFieldInfo.isEditable,
                visible: webmapFieldInfo.visible
              });
            }
          });
          if(webmapSimpleFieldInfos.length === 0) {
            webmapSimpleFieldInfos = null;
          }
        } else {
          webmapSimpleFieldInfos = null;
        }
        return webmapSimpleFieldInfos;
      },

      _getSimpleFieldInfos: function(layerObject, layerInfo) {
        var baseSimpleFieldInfos;
        var simpleFieldInfos = [];
        var defautlSimpleFieldInfos = this._getDefaultSimpleFieldInfos(layerObject);
        var webmapSimpleFieldInfos = this._getWebmapSimpleFieldInfos(layerObject);

        baseSimpleFieldInfos =
          webmapSimpleFieldInfos ? webmapSimpleFieldInfos : defautlSimpleFieldInfos;

        if(layerInfo && layerInfo.fieldInfos) {
          // Edit widget had been configured

          // keep order of config fieldInfos and add new fieldInfos at end.
          array.forEach(layerInfo.fieldInfos, function(configuredFieldInfo) {
            // Compatible with old version fieldInfo that does not defined
            // the visible attribute. Init visible according to webmap field infos.
            if(configuredFieldInfo.visible === undefined) {
              if(webmapSimpleFieldInfos) {
                for(var j = 0; j < webmapSimpleFieldInfos.length; j++) {
                  if(configuredFieldInfo.fieldName === webmapSimpleFieldInfos[j].fieldName) {
                    configuredFieldInfo.visible = webmapSimpleFieldInfos[j].visible ||
                                                  webmapSimpleFieldInfos[j].isEditable;
                  }
                }
                // if configuredFieldInfo.name is not matching any field of webmapSimpleFieldInfos,
                // this configured field will not display in field setting popup.
              } else {
                configuredFieldInfo.visible = true;
              }
            }

            // keep order.
            for(var i = 0; i < baseSimpleFieldInfos.length; i++) {
              if(configuredFieldInfo.fieldName === baseSimpleFieldInfos[i].fieldName) {
                simpleFieldInfos.push(configuredFieldInfo);
                baseSimpleFieldInfos[i]._exit = true;
                break;
              }
            }
          });
          // add new fieldInfos at end.
          array.forEach(baseSimpleFieldInfos, function(baseSimpleFieldInfo) {
      //      console.log("_getSimpleFieldInfos");
            if(!baseSimpleFieldInfo._exit) {
              simpleFieldInfos.push(baseSimpleFieldInfo);
            }
          });
        } else {
          simpleFieldInfos = baseSimpleFieldInfos;
        }
        return simpleFieldInfos;
      },

      _onEditFieldInfoClick: function(tr) {
        var rowData = this._layersTable.getRowData(tr);
        console.log("edit fields open");

        if(rowData && rowData.edit) {
          var editFields = new EditFields({
            nls: this.nls,
            _layerInfo: tr._layerInfo
          });
          editFields.popupEditPage();
        }
      },

      //unused function
      _onToolbarSelected: function() {
      
      },
      //unused function
      _resetToolbarConfig: function() {
       //tolerance = this.stickyMoveTolerance.value;
      },

      getConfig: function() {
        // get toolbar config
        console.log("getConfig");
        this._resetToolbarConfig();

        // get layerInfos config
        var checkedLayerInfos = [];
        var layersTableData =  this._layersTable.getData();
        array.forEach(this._editableLayerInfos, function(layerInfo, index) {
          layerInfo._editFlag = layersTableData[index].edit;
          layerInfo.disableGeometryUpdate = layersTableData[index].disableGeometryUpdate;
          if(layerInfo._editFlag) {
            delete layerInfo._editFlag;
            checkedLayerInfos.push(layerInfo);
          }
        });

        
        if(checkedLayerInfos.length === 0) {
          delete this.config.editor.layerInfos;
        } else {
          this.config.editor.layerInfos = checkedLayerInfos;

         

          var queryLat = dojo.query('select#selectLatitude')[0][dojo.query('select#selectLatitude').val()].firstChild.data;
          var queryLon = dojo.query('select#selectLongitude')[0][dojo.query('select#selectLongitude').val()].firstChild.data;
          console.log("featureservice " + this._featureService);
          console.log("lat, Long ", queryLat, queryLon);
          this.config.selectedFeatureService = this._featureService;
          this.config.latitudeField = queryLat;
          this.config.longitudeField = queryLon;
          
        }

        return this.config;
      }
    });
  });
