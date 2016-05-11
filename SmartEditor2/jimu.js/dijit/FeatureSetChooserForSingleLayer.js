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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/on',
  'dojo/Evented',
  'dojo/Deferred',
  'dojo/_base/lang',
  'dojo/_base/array',
  'jimu/symbolUtils',
  'jimu/dijit/DrawBox',
  'jimu/SelectionManager',
  'esri/graphic',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/layers/GraphicsLayer',
  'esri/layers/FeatureLayer',
  'esri/renderers/SimpleRenderer'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, Evented, Deferred, lang,
  array, symbolUtils, DrawBox, SelectionManager, Graphic, EsriQuery, QueryTask, GraphicsLayer,
  FeatureLayer, SimpleRenderer) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'spatial-filter-features',
    templateString: "<div></div>",
    _displayLayer: null,//GraphicsLayer
    //used when updateSelection is false
    _middleFeatureLayer: null,//FeatureLayer, _middleFeatureLayer is used to sync with _displayLayer
    _isLoading: false,
    //_type 1 means normal FeatureLayer in Map
    //_type 2 means virtual FeatureLayer under MapService, not in Map
    //_type 3 means FeatureCollection
    _type: 0,
    _def: null,
    drawBox: null,
    selectionManager: null,

    //constructor options:
    map: null,
    featureLayer: null,
    updateSelection: false,

    //public methods:
    //reset
    //getFeatures, return a deferred object which resolves features
    //isLoading

    //events:
    //user-clear
    //loading
    //unloading

    postCreate:function(){
      this.inherited(arguments);

      this.selectionManager = SelectionManager.getInstance();

      //init _type
      if(this.featureLayer.getMap()){
        if(this.featureLayer.url){
          this._type = 1;
        }else{
          this._type = 3;
        }
      }else{
        this._type = 2;
      }

      //init _displayLayer
      this._displayLayer = new GraphicsLayer();
      var symbol = null;
      var geometryType = this.featureLayer.geometryType;
      if (geometryType === 'esriGeometryPoint') {
        symbol = symbolUtils.getDefaultMarkerSymbol();
      } else if (geometryType === 'esriGeometryPolyline') {
        symbol = symbolUtils.getDefaultLineSymbol();
      } else if (geometryType === 'esriGeometryPolygon') {
        symbol = symbolUtils.getDefaultFillSymbol();
      }
      var renderer = new SimpleRenderer(symbol);
      this._displayLayer.setRenderer(renderer);
      var showDisplayLayer = this._type === 2 || !this.updateSelection;
      if(showDisplayLayer){
        this.map.addLayer(this._displayLayer);
      }

      //init _middleFeatureLayer
      this._middleFeatureLayer = new FeatureLayer({
        layerDefinition: {
          objectIdField: this.featureLayer.objectIdField,
          geometryType: this.featureLayer.geometryType,
          fields: lang.clone(this.featureLayer.fields)
        },
        featureSet: null
      });

      //init DrawBox
      this.drawBox = new DrawBox({
        map: this.map,
        showClear: true,
        keepOneGraphic: true,
        geoTypes: ['EXTENT']//['POLYGON']
      });
      this.drawBox.placeAt(this.domNode);
      this.own(on(this.drawBox, 'user-clear', lang.hitch(this, this._onDrawBoxUserClear)));
      this.own(on(this.drawBox, 'draw-end', lang.hitch(this, this._onDrawEnd)));

      this.own(on(this.featureLayer, 'visibility-change', lang.hitch(this, function(){
        if(this.featureLayer.visible){
          this.drawBox.enable();
        }else{
          this.drawBox.disable();
        }
      })));
    },

    reset: function(){
      this.drawBox.reset();
      this.clearAllGraphics();
    },

    disable: function(hideLayers){
      this.drawBox.disable();
      if(hideLayers){
        if(this._displayLayer){
          this._displayLayer.hide();
        }
      }
    },

    enable: function(){
      this.drawBox.enable();
      if(this._displayLayer){
        this._displayLayer.show();
      }
    },

    deactivate: function(){
      this.drawBox.deactivate();
    },

    clearAllGraphics: function(){
      this.drawBox.clear();
      this._clearDisplayLayer();
      this._clearMiddleFeatureLayer();
    },

    getFeatures: function(){
      var def = new Deferred();
      var callback = lang.hitch(this, function(){
        var selectedFeatures = this.syncGetFeatures();
        def.resolve(selectedFeatures);
      });
      var errback = lang.hitch(this, function(err){
        def.reject(err);
      });
      if(this._getDeferredStatus(this._def) === 1){
        def.then(callback, errback);
      }else{
        callback();
      }
      return def;
    },

    syncGetFeatures: function(){
      var layer = this.updateSelection ? this.featureLayer : this._middleFeatureLayer;
      var selectedFeatures = layer.getSelectedFeatures();
      return selectedFeatures;
    },

    isLoading: function(){
      return this._getDeferredStatus(this._def) === 1;
    },

    _onLoading: function(){
      this.drawBox.deactivate();
      // if (this.showLoading) {
      //   this.loading.show();
      // }
      this.emit('loading');
    },

    _onUnloading: function(){
      // this.loading.hide();
      this.emit('unloading');
    },

    //-1: def is rejected
    //0: def is null
    //1: def is not fullfilled
    //2: def is resolved
    _getDeferredStatus: function(def){
      var status = 0;
      if(def){
        if(def.isResolved()){
          status = 2;
        }else if(def.isRejected()){
          status = -1;
        }else{
          status = 1;
        }
      }else{
        status = 0;
      }
      return status;
    },

    _onDrawEnd: function(g, geotype, commontype, shiftKey, ctrlKey){
      console.log(geotype, commontype);
      if(this.isLoading()){
        //should throw exception here
        throw "should not draw when loading";
      }

      if(!this.featureLayer.visible){
        return;
      }

      var def = new Deferred();
      this._def = def;

      //we should not call _clearDisplayLayer here
      //we just need to call _updateDisplayLayer when we get features

      var selectionMethod = FeatureLayer.SELECTION_NEW;
      if (shiftKey) {
        selectionMethod = FeatureLayer.SELECTION_ADD;
      }
      if (ctrlKey) {
        selectionMethod = FeatureLayer.SELECTION_SUBTRACT;
      }

      this._onLoading();

      this._getFeaturesByGeometry(g.geometry).then(lang.hitch(this, function(features){
        var layer = this.updateSelection ? this.featureLayer : this._middleFeatureLayer;
        this.selectionManager.updateSelectionByFeatures(layer, features, selectionMethod);
        this._updateDisplayLayer();
        this._onUnloading();
        def.resolve(features);
      }), lang.hitch(this, function(err){
        console.error(err);
        this._onUnloading();
        def.reject(err);
      }));
    },

    _getFeaturesByGeometry: function(geometry){
      var def = new Deferred();
      var features = [];
      if(this.featureLayer.getMap()){
        //layer is a normal FeatureLayer or a FeatureCollection
        features = this.selectionManager.getClientFeaturesByGeometry(this.featureLayer, geometry);
        def.resolve(features);
      }else{
        //layer is a virtual FeatureLayer under MapService
        var queryParams = new EsriQuery();
        queryParams.geometry = geometry;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = true;
        //queryParams.outFields should include required fields, such as OBJECTID
        //OBJECTID is used when call _selectHandler method
        queryParams.outFields = this.featureLayer.getOutFields();
        var queryTask = new QueryTask(this.featureLayer.url);
        queryTask.execute(queryParams).then(lang.hitch(this, function(response){
          def.resolve(response.features);
        }), lang.hitch(this, function(err){
          def.reject(err);
        }));
      }
      return def;
    },

    _updateDisplayLayer: function(){
      this._clearDisplayLayer();
      var layer = this.updateSelection ? this.featureLayer : this._middleFeatureLayer;
      var selectFeatures = layer.getSelectedFeatures();
      array.forEach(selectFeatures, lang.hitch(this, function(feature){
        var graphic = new Graphic(feature.toJson());
        this._displayLayer.add(graphic);
      }));
    },

    _onDrawBoxUserClear: function(){
      this.clearAllGraphics();
      this.emit("user-clear");
    },

    _clearDisplayLayer: function(){
      if(this._displayLayer){
        this._displayLayer.clear();
      }
    },

    _clearMiddleFeatureLayer: function(){
      if(this._middleFeatureLayer){
        this._middleFeatureLayer.clear();
        this.selectionManager.clearSelection(this._middleFeatureLayer);
      }
    },

    destroy: function(){
      this._clearMiddleFeatureLayer();
      this._middleFeatureLayer = null;
      if(this._displayLayer){
        this._displayLayer.clear();
        this.map.removeLayer(this._displayLayer);
      }
      this._displayLayer = null;
      this.inherited(arguments);
    }

  });
});