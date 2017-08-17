define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!../templates/GridSettings.html',
  'dojo/_base/lang',
  'dojo/Evented',
  'dojo/dom-class',
  'dojo/query',
  'dijit/form/Select'
],
  function (
    declare,
    array,
    BaseWidget,
    _WidgetsInTemplateMixin,
    GridSettingsTemplate,
    lang,
    Evented,
    domClass,
    query
  ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
      baseClass: 'jimu-widget-GRGDrafter-PlanSettings',
      templateString: GridSettingsTemplate,
      selectedGridSettings: {}, //Holds selected planSettings
      gridSettingsOptions:  {
          "cellShape": ["default", "hexagon"],
          "cellUnits": ["meters", "kilometers", "miles", "nautical-miles", "yards", "feet"],
          "labelStartPosition": ["lowerLeft", "lowerRight", "upperLeft", "upperRight"],      
          "labelType": ["alphaNumeric", "alphaAlpha", "numeric"],
          "gridOrigin": ["center", "lowerLeft", "lowerRight", "upperLeft", "upperRight"]
        }, //Object that holds all the options and their keys

      constructor: function (options) {
        lang.mixin(this, options);
      },

      //Load all the options on startup
      startup: function () {
        //load options for all drop downs
        this._loadOptionsForDropDown(this.cellShape, this.gridSettingsOptions.cellShape);
        this._loadOptionsForDropDown(this.labelStartPosition, this.gridSettingsOptions.labelStartPosition);
        this._loadOptionsForDropDown(this.cellUnits, this.gridSettingsOptions.cellUnits);
        this._loadOptionsForDropDown(this.labelType, this.gridSettingsOptions.labelType);
        this._loadOptionsForDropDown(this.gridOrigin, this.gridSettingsOptions.gridOrigin);
        //send by default updated parameters
        this.onGridsettingsChanged();
      },

      postCreate: function () {
        this.inherited(arguments);
        //set widget variables
        this.selectedGridSettings = {};
        //set class to main container
        domClass.add(this.domNode, "GRGDrafterSettingsContainer GRGDrafterFullWidth");
        //TODO: try to remove the timeout
        //setTimeout(lang.hitch(this, this._setBackgroundColorForDartTheme), 500);
      },

      

      /**
      * Add options to passed dropdown
      * @memberOf widgets/ParcelDrafter/PlanSettings
      **/
      _loadOptionsForDropDown: function (dropDown, dropDownOptions) {
        var options = [], option;
        //Add options for selected dropdown
        array.forEach(dropDownOptions, lang.hitch(this, function (type) {
          if (this.nls.gridSettings[type].hasOwnProperty("label")) {
            option = { value: type, label: this.nls.gridSettings[type].label };
          } else {
            option = { value: type, label: this.nls.gridSettings[type] };
          }
          options.push(option);
        }));
        dropDown.addOption(options);
      },

      /**
      * Return's flag based on plan settings are changed or not
      * @memberOf widgets/ParcelDrafter/PlanSettings
      **/
      _isSettingsChanged: function () {
        var isDataChanged = false;
        //check if cellShape is changed
        if (this.selectedGridSettings.cellShape !==
          this.cellShape.get('value')) {
          isDataChanged = true;
        } else if (this.selectedGridSettings.labelStartPosition !==
          this.labelStartPosition.get('value')) {
          //check if labelStartPosition is changed
          isDataChanged = true;
        } else if (this.selectedGridSettings.cellUnits !==
          this.cellUnits.get('value')) {
          //check if cellUnits is changed
          isDataChanged = true;
        } else if (this.selectedGridSettings.labelType !==
          this.labelType.get('value')) {
          //check if labelType is changed
          isDataChanged = true;
        } else if (this.selectedGridSettings.gridOrigin !==
          this.gridOrigin.get('value')) {
          //check if gridOrigin is changed
          isDataChanged = true;
        }
        return isDataChanged;
      },

      /**
      * Update's PlanSettings on close of the widget
      * @memberOf widgets/ParcelDrafter/PlanSettings
      **/
      onClose: function () {
        if (this._isSettingsChanged()) {
          this.onGridsettingsChanged();
        }
      },

      /**
      * Set's the selectedGridSettings on any value change
      * @memberOf widgets/ParcelDrafter/PlanSettings
      **/
      onGridsettingsChanged: function () {
        this.selectedGridSettings = {
          "cellShape": this.cellShape.get('value'),
          "labelStartPosition": this.labelStartPosition.get('value'),
          "cellUnits": this.cellUnits.get('value'),
          "labelType": this.labelType.get('value'),
          "gridOrigin": this.gridOrigin.get('value'),
        };
        this.emit("gridSettingsChanged", this.selectedGridSettings);
      }
    });
  });