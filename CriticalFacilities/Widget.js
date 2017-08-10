define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom',
  'dojo/_base/array',
  "dojox/data/CsvStore",
  "dojo/query",
  "dojo/html",
  "dojo/dom-construct",
  "dijit/registry",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/Point",
  "esri/Color",
  "esri/config",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/layers/FeatureLayer",
  "esri/request",
  'jimu/LayerInfos/LayerInfos',
  "./helyxcsvstore",
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
  
  ],

//"selectedFeatureService" : "https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/shelters_manatee/FeatureServer/0",
//"selectedFeatureService" : "https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/bugsites/FeatureServer/0",

  function (declare, BaseWidget, lang, on, dom, arrayUtils, CsvStore, query, html, domConstruct, registry, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, esriRequest, layerInfos, hCsvStore, $) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-customwidget',

      // this property is set by the framework when widget is loaded.
      name: 'HelyxWidget',

      thisMap: null,
      domMap: null,
      arraySelectedFields: null,
      arrayFields: null,
      myCsvStore: null,
      correctArrayFields: null,
      arrayFieldsFromFeatureService: null,
      latFieldFromConfig: null,
      longFieldFromConfig: null,
      featureservice: null,
      _configEditor: null,
      arrayFieldsFromFeatureService: null,

      // methods to communication with app container:
      postCreate: function () {
        console.log('postCreate');
        this.inherited(arguments);
        this.own(on(this.map, "mouse-move", lang.hitch(this, this.onMouseMove)));
        this.own(on(this.map, "click", lang.hitch(this, this.onMapClick)));
                
        this.featureservice = this.config.selectedFeatureService;
        latFieldFromConfig = this.config.latitudeField;
        longFieldFromConfig = this.config.longitudeField;

        
       
        this._configEditor = lang.clone(this.config.editor);

       
        console.log("+++++++++++config length " + this._configEditor.layerInfos);
       // console.log("fields " + this._configEditor.layerInfos[0].fieldInfos.length);

      },

      
    startup: function(){
    console.log("startup");


    arrayFieldsFromFeatureService = [];

    if(this._configEditor.layerInfos[0]!=null){

    arrayUtils.forEach(this._configEditor.layerInfos[0].fieldInfos, function(i, field) {
            
        arrayFieldsFromFeatureService.push({"name": "array"+i.fieldName, "value": i.fieldName});
         
    });
              
      arrayUtils.forEach(arrayFieldsFromFeatureService, function(i){

        if(i.value != "objectid_1" && i.value != "objectid"){
                  
            var fieldName = i.value;
            var node = domConstruct.toDom('<label id="label'+fieldName+'" data-dojo-attach-point="label'+fieldName + '" for="select'+fieldName+'">' + fieldName + '</label>');
                  
            var selectNode = domConstruct.toDom('<select id="select'+fieldName + '" name="select' + fieldName + '" data-dojo-attach-point="field' + fieldName + '"></select>');

            document.getElementById('fieldsetForm').appendChild(node);
            document.getElementById('fieldsetForm').appendChild(selectNode);

                  //set element styling
            document.getElementById('label'+fieldName).style.fontSize="10pt";
            document.getElementById('label'+fieldName).style.fontFamily="Avenir, LT";
            document.getElementById('label'+fieldName).style.lineHeight = "13px";
            document.getElementById('label'+fieldName).style.margin = "3px";

                  }

                 // numberOfFields++;
            });

                  console.log("number of fields " + arrayFieldsFromFeatureService.length);

                  var height = (arrayFieldsFromFeatureService.length * 20) + 200; 
                  var widgetHeight = height + 80;
                  var buttonHeight = (arrayFieldsFromFeatureService.length * 20) + 150;

                  document.getElementById('fieldsetForm').style.height = height + 'px';
                  document.getElementById('fieldsetForm').style.width = '300px';
                  //this.getPanel().resize({w:350})
                
                  document.getElementById('_5_panel').style.width="350px";
                  document.getElementById('_5_panel').style.height=widgetHeight+'px';
                  document.getElementById('btnSubmitData').style.top = buttonHeight + 'px';
                  document.getElementById('btnAddToMap').style.top = buttonHeight + 'px';

                 
                  //disable submit to feature service button until points have been added.

                  document.getElementById('btnSubmitData').disabled = true;
                 
                  //set field form spacing
                 // this.inherited(arguments);
  
                  thisMap = this.map;
        
                  domMap = dom.byId(this.map.id);
                  if (thisMap) {
                       on(domMap, "dragenter", this.onDragEnter);
                       on(domMap, "dragover", this.onDragOver);
                       on(domMap, "drop", this.onDrop);   

        } 
    }

    else{

        var height = 200;
        var widgetHeight = 80;
        var buttonHeight = 150;
        document.getElementById('fieldsetForm').style.height = height + 'px';
        document.getElementById('fieldsetForm').style.width = '300px';
        document.getElementById('dijit__WidgetBase_4').style.width = "350px";
        document.getElementById('_5_panel').style.width="350px";
        document.getElementById('_5_panel').style.height=widgetHeight+'px';
        document.getElementById('btnSubmitData').style.top = buttonHeight + 'px';
        document.getElementById('btnAddToMap').style.top = buttonHeight + 'px';
        document.getElementById('btnAddToMap').remove();
        document.getElementById('btnSubmitData').remove();
        document.getElementById('fieldsetForm').remove();
        document.getElementById('dijit__WidgetBase_4').innerText = "No suitable feature service available";
    }
    
    },

      onDragEnter: function (event) {
        console.log('onDragEnter');
        event.preventDefault();
      },

      onDragOver: function (event) {
        console.log('onDragOver');
        event.preventDefault();
      },

      onDrop: function (event) {
        console.log('onDrop');
        event.preventDefault();

        var dataTransfer = event.dataTransfer,
          files = dataTransfer.files,
          types = dataTransfer.types;

      
        if (files && files.length === 1) {
          console.log("[ FILES ]");
          var file = files[0]; // that's right I'm only reading one file
          console.log("type = ", file.type);
          if (file.name.indexOf(".csv") !== -1) {
            console.log("handle as Csv (file)");
            
            myCsvStore = new hCsvStore({
                inFile: file,
                inArrayFields: arrayFieldsFromFeatureService,
                inMap: thisMap
                
            });
           

            myCsvStore.latField = latFieldFromConfig;
            myCsvStore.longField = longFieldFromConfig;
            myCsvStore.arraySelectedFields = this.arraySelectedFields;
            myCsvStore.onHandleCsv();
           
          }
        }

  

      },

      bytesToString: function (b) {
        console.log("bytes to string");
        var s = [];
        arrayUtils.forEach(b, function (c) {
          s.push(String.fromCharCode(c));
        });
        return s.join("");
      },

      onMapClick: function (evt) {
    
      },

      onMouseMove: function (evt) {
       // console.log('onMouseMove');
   
      },



 

      onAddClick: function() {
        console.log('onAddClick');

       var arrayMappedFields = [[]];

       console.log("arrayFieldsFromFeatureService " + arrayFieldsFromFeatureService.length);
      
       arrayUtils.forEach(arrayFieldsFromFeatureService, function(setField){
          
        //console.log("+++arrayFieldsFromfeatureService " + setField);
          if(setField!=null&&setField.value!="objectid"&&setField.value!="objectid_1"){
            var tempText = setField.value;
            console.log("tempText " + tempText);
            var queryResult = dojo.query('select#select' + tempText)[0][dojo.query('select#select' + tempText).val()].firstChild.data;
             arrayMappedFields.push([queryResult, tempText]);
            console.log ("query result " + queryResult);
          }
         
          
         

       });

       arrayUtils.forEach(arrayMappedFields, function(field){
          console.log("fields from ++++++ " + field);
       });

       console.log("arrayMappedFields Length " + arrayMappedFields.length); 

        arraySelectedFields = [];

            myCsvStore.correctFieldNames = arrayFieldsFromFeatureService;
            myCsvStore.mappedArrayFields = arrayMappedFields;

        myCsvStore.onProcessForm();

      },

      // submit to feature service
      onSubmitClick: function(){
         console.log('onSubmitClick');

         var featureLayer = myCsvStore.featureLayer;                         

         console.log("featureLayer size " + featureLayer.id ); 

        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

     
         var features = featureLayer.graphics;
         var theExtent = null;

      

         for (var f = 0, fl = features.length; f < fl; f++) {
            var feature = features[f];
            var attribs = feature.attributes;
         
             feature.setInfoTemplate(flayer.infoTemplate);
                            flayer.add(feature);

                            //adds, updates, deletes, callback, errback
                            flayer.applyEdits([feature], null , null);
                       

                          
        }  

        console.log("finished " + flayer.graphics.length + " " + flayer.name);
       
      },

      onClearClick: function(){
             console.log('onClearClick');

        //get data from REST endpoint and compare the ID of each of the records against what is already there. Sort them into two arrays and invoke add/update 
        //via applyEdits below
        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

        var features = flayer.graphics;

        console.log("featureService " + flayer.graphics);


         var theExtent = null;
         var selectQuery = new Query();

        //  selectQuery.where = "'Facility' = '*'";
        selectQuery.where = "1=1";

        var selectFeatures = flayer.selectFeatures(selectQuery, flayer.SELECTION_NEW);

        console.log("selected Features " + selectedFeatures.id);

        flayer.applyEdits(null,null,[selectFeatures]); 

        console.log("finished clearing features " + flayer.graphics.length + " " + flayer.name);

      },

  
      onResetClick: function() {
        console.log('onResetClick');
      },

      onOpen: function () {
        console.log('onOpen');
      },

      onClose: function () {
        console.log('onClose');
      },

      onMinimize: function () {
        console.log('onMinimize');
      },

      onMaximize: function () {
        console.log('onMaximize');
      },

      onSignIn: function (credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function () {
        console.log('onSignOut');
      },

      onPositionChange: function () {
        console.log('onPositionChange');
      },

      resize: function () {
        console.log('resize');
      }

    });


  });