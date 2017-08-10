define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',
    'dojox/data/CsvStore',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/Color',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/layers/FeatureLayer',
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
], 


function (declare, arrayUtils, lang, query, on, dom, domConstruct, CsvStore, webMercatorUtils, Multipoint, Point, Color, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, $) {
    return declare([], {

        constructor: function (options) {
            this.inFile = options.inFile;
            this.inMap = options.inMap;
            this.inArrayFields = options.inArrayFields;
            this.arraySelectedFields = null;
            this.fileData = null;
            this.separatorCharacter = null;
            this.csvStore = null;
            this.csvFieldNames = null;
            this.storeItems = null;
            this.fullpath = null;
            this.featureCollection = null;
            this.featureLayer = null;
            this.correctFieldNames = null;
            this.mappedArrayFields = null;
            this.latField = null;
            this.longField = null;
     


        },

        
        
        onHandleCsv: function () {
            console.log("onHandleCsv");
            console.log("Processing CSV: ", this.inFile, ", ", this.inFile.name, ", ", this.inFile.type, ", ", this.inFile.size);
            if (this.inFile.data) {
                console.log('file.data');
            }
            else {
                console.log("not file data");
                var reader = new FileReader();
                reader.onload = lang.hitch(this, function () {
                    console.log("Finished reading CSV data");
                  
                    this.fileData = reader.result;
                    
                    this.onProcessCsvData();
                });
                reader.readAsText(this.inFile);
            }
        },

        onProcessCsvData: function () {
            console.log("onProcessCsvData");

            // Get the separator
            this.onGetSeparator();

            // Get the store and fetch the items
            this.onGetCsvStore();

        },
        
        onGetFeatureCollection: function () {
            console.log("onGetFeatureCollection");
        },

        onProcessForm: function () {
            console.log("processForm");

            var objectId = 0;
            var counter = 0;

            this.featureCollection = this.onGenerateFeatureCollectionTemplateCSV();

         
            console.log("++++ mappedArrayFields " + this.mappedArrayFields.length);
          
        
            arrayUtils.forEach(this.storeItems, lang.hitch(this, function(item) {

                var attrs = this.csvStore.getAttributes(item),
            
                attributes = {}; 

                //this is a nasty hack. It assumes that the spatial object is the first field, not sure that this is always true.
                //it should look for the spatial object type and disregard it, rather than by position
                var count = 1;

                arrayUtils.forEach(attrs, lang.hitch(this, function(attr) {
                  
                   
                    var value = Number(this.csvStore.getValue(item, this.mappedArrayFields[count][0]));

                    attributes[this.mappedArrayFields[count][1]] = isNaN(value) ? this.csvStore.getValue(item, this.mappedArrayFields[count][0]) : value;
                    
                    count++;

                })); 

                
                attributes["ObjectID"] = objectId;
                objectId++;


                var latitude = parseFloat(attributes[this.latField]);
                var longitude = parseFloat(attributes[this.longField]);


                if (isNaN(latitude) || isNaN(longitude)) {
                    return;
                }

                //setup new set of attributes

                var geometry = webMercatorUtils
                    .geographicToWebMercator(new Point(longitude, latitude));
                var feature = {
                    "geometry": geometry.toJson(),
                    "attributes": attributes
                };


                JSON.stringify(feature);

                this.featureCollection.featureSet.features.push(feature);

            }));

            var orangeRed = new Color([238, 69, 0, 0.5]); // hex is #ff4500
            var marker = new SimpleMarkerSymbol("solid", 10, null, orangeRed);
            var renderer = new SimpleRenderer(marker);
            //var tempName = 

            this.featureLayer = new FeatureLayer(this.featureCollection, {
              
                id: this.inFile.name,
                editable: true,
                outFields: ["*"]
            });
            this.featureLayer.setRenderer(renderer);

         
            on(this.featureLayer, "click", function(e) {
                console.log("FL clicked");
                console.log(e.graphic);
                console.log(e.graphic.attributes);
                console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
            
            });

            this.inMap.addLayers([this.featureLayer]);
            this.onZoomToData(this.featureLayer);
            document.getElementById('btnSubmitData').disabled=false;
            document.getElementById('btnAddToMap').disabled=true;

        },

     

        onGenerateFeatureCollectionTemplateCSV: function () {
            console.log("onGenerateFeatureCollectionTemplateCSV");
            //create a feature collection for the input csv file
            this.featureCollection = {
                "layerDefinition": null,
                "featureSet": {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                }
            };
            this.featureCollection.layerDefinition = {
                "geometryType": "esriGeometryPoint",
                "objectIdField": "ObjectID",
                "drawingInfo": {
                    "renderer": {
                        "type": "simple",
                        "symbol": {
                            "type": "esriPMS",
                            "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
                            "contentType": "image/png",
                            "width": 15,
                            "height": 15
                        }
                    }
                },
                "fields": [
                    {
                        "name": "ObjectID",
                        "alias": "ObjectID",
                        "type": "esriFieldTypeOID"
                    }
                ]
            };
            
            
            
            
            
            var tempArray = [];

            for (i=1;i<this.mappedArrayFields.length;i++){
                var entry = this.mappedArrayFields[i][1];
                
                tempArray.push(entry)
            }
     

                var count = 0;

                arrayUtils.forEach(tempArray, function(temp) {
               
            });

            console.log("tempArray " + tempArray.length);
            
            arrayUtils.forEach(tempArray, lang.hitch(this,function(csvFieldName) {
                console.log("csvFieldName " + csvFieldName);
               
                var value = this.csvStore.getValue(this.storeItems[0], csvFieldName);
                var parsedValue = Number(value);
                
                
                var correctFieldName = this.mappedArrayFields[count][1];

                console.log("    " + this.mappedArrayFields[count][1]);

                if (isNaN(parsedValue)) { //check first value and see if it is a number
                    this.featureCollection.layerDefinition.fields.push({
                        "name": correctFieldName,
                        "alias": correctFieldName,
                        "type": "esriFieldTypeString",
                        "editable": true,
                        "domain": null
                    });
                     count+=1;
                } else {
                    this.featureCollection.layerDefinition.fields.push({
                        "name": correctFieldName,
                        "alias": correctFieldName,
                        "type": "esriFieldTypeDouble",
                        "editable": true,
                        "domain": null
                        
                    });
                     count+=1;
                }
           
            }));
            
            return this.featureCollection;
        },

        onGetSeparator: function () {

            console.log("onGetSeparator");
            var newLineIndex = this.fileData.indexOf("\n");
            var firstLine = lang.trim(this.fileData.substr(0, newLineIndex));
            var separators = [",", "      ", ";", "|"];
            var maxSeparatorLength = 0;
            var maxSeparatorValue = "";
            arrayUtils.forEach(separators, function (separator) {
                var length = firstLine.split(separator).length;
                if (length > maxSeparatorLength) {
                    maxSeparatorLength = length;
                    maxSeparatorValue = separator;
                }
            });
            this.separatorCharacter = maxSeparatorValue;
        },

        onGetCsvStore: function () {
            console.log("onGetCsvStore");
            // Create the store and update the class property
            this.csvStore = new CsvStore({
                data: this.fileData,
                separator: this.separatorCharacter
            });

            // Fetch the items and update the items property
            this.csvStore.fetch({
                onComplete: lang.hitch(this, function (items) {
                    this.storeItems = items;

                    // Get the fields and add to the widget
                    this.onFetchFieldsAndUpdateForm();

                }),
                onError: function (error) {
                    console.error("Error fetching items from CSV store: ", error);
                }
            });
        },

        onFetchFieldsAndUpdateForm: function () {
            console.log("onFetchFieldsAndUpdateForm");
            // Update the class property
            this.csvFieldNames = this.csvStore.getAttributes(this.storeItems[0]);
            console.log("   s: " + this.csvFieldNames);

            // Add the string of options to the form's select controls
            query('select[id^="select"]').forEach(lang.hitch(this, function(node, index, arr) {
                console.log("+++++++ " + node.name + " " + node.value);
                //arrayUtils.forEach(this.csvFieldNames, lang.hitch(this, function(csvFieldName, i) {
                    arrayUtils.forEach(this.csvFieldNames, lang.hitch(this, function(csvFieldName, i) {
                    // console.log(node.name + ": " + csvFieldName);

                    //use   domconstruct here to create html elements -- lookup how this works -- look for sample code. Use to create html node and insert into widget.html element
                    //declarative code vs constructed via dom-construct
                    //get field names from REST endpoint
                    //need way to determine type before the field is created.

                    domConstruct.create("option", {
                        value: i,
                        innerHTML: csvFieldName,
                        selected: false
                    }, node);
                }));

                // Select the first option that matches one of the configuration field names
                var values = this.findValueByKeyValue(this.inArrayFields, "name", node.name.replace('select', 'array'));
                if (values) {

                    arrayUtils.forEach(node.options, function(optionItem) {
                        if (values.includes(optionItem.text)) {
                            // TODO: Use dojo not jQuery
                            $("#" + node.name).val(optionItem.value);
                            return false;
                        }
                    });
                }

            }));
        },

        findValueByKeyValue: function(arraytosearch, key, valuetosearch) {
            for (var i = 0; i < arraytosearch.length; i++) {
                if (arraytosearch[i][key] == valuetosearch) {
                    return arraytosearch[i].value;
                }
            }
            console.log("Unable to find key-value: " + key + "-" + valuetosearch)
            return null;
        },

        onZoomToData: function (featureLayer) {
            console.log("onZoomToData");
            // Zoom to the collective extent of the data
            var multipoint = new Multipoint(this.inMap.spatialReference);
            arrayUtils.forEach(featureLayer.graphics, function (graphic) {
                var geometry = graphic.geometry;
                if (geometry) {
                    multipoint.addPoint({
                        x: geometry.x,
                        y: geometry.y
                    });
                }
            });

            if (multipoint.points.length > 0) {
                this.inMap.setExtent(multipoint.getExtent().expand(1.25), true);
            }
        }

    });
});