///////////////////////////////////////////////////////////////////////////
// Copyright © 2016 Esri. All Rights Reserved.
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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Deferred',
  'esri/request',
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  'jimu/tokenUtils'
], function (declare, lang, array, Deferred, esriRequest, portalUtils, portalUrlUtils, tokenUtils) {
  var instance = null,
    clazz = declare(null, {

      //TODO validate user privlidges
      // if the file exists and user can read
      // if the user can create/modify
      //TODO make the file name configurable??
      //TODO add logic for free suggestion verification...idea is to double check the suggestion result and prompt the user
      // to make a decision when the x/y in the cache don't match that of the first suggestion...if they choose to use 
      // the new value that would again incur another credit to get the updated geometry

      appendValue: "A12234",


      constructor: function ( /*Object*/ options) {
        this.nls = options.nls;
        this.appConfig = options.appConfig;
        this.portalUrl = this.appConfig.portalUrl;
        this.portal = portalUtils.getPortal(this.portalUrl);
        this.selfUrl = portalUrlUtils.getPortalSelfInfoUrl(this.portalUrl);
        this.baseUrl = this.portalUrl + 'sharing/rest/';
        this.portalItem = null;
      },

      getCache: function () {
        var def = new Deferred();
        this._getUser().then(lang.hitch(this, function (user) {
          this.user = user;
          this._initCache().then(lang.hitch(this, function (item) {
            this.portalItem = item;
            if (this.portalItem) {
              this.portalItem.getItemData().then(lang.hitch(this, function (itemData) {
                this.itemData = itemData;
                def.resolve(itemData);
              }));
            } else {
              def.reject(this.nls.unableToFindOrCreateCache)
            }
          }));
        }));
        return def;
      },

      updateCache: function (newAddresses) {
        var keys = Object.keys(newAddresses);
        for (var k in keys) {
          var _k = keys[k];
          if (newAddresses.hasOwnProperty(_k)) {
            delete newAddresses[_k].index;
          }
        }

        var newCacheData = lang.mixin({}, this.itemData, newAddresses);

        var folder = this.portalItem.ownerFolder;
        var userName = this.portalItem.owner;
        var itemId = this.portalItem.id;

        var hasFileUpload = window.FormData && window.FileList;
        var blob = new Blob([JSON.stringify(newCacheData)], { type: "application/json" });
        var formData = new FormData();
        formData.append("itemType", "file");
        formData.append("type", "Code Sample");
        formData.append("title", this.nls.geocodeCache + this.appendValue);
        formData.append("file", blob, this.nls.geocodeCache + this.appendValue);
        return esriRequest({
          url: portalUrlUtils.getUpdateItemUrl(this.portalUrl, userName, itemId, folder),
          form: formData,
          content: {
            f: "json"
          }
        }, { usePost: true });
      },

      _initCache: function () {
        //look for item by title and type
        var def = new Deferred();
        var queryData = { q: "type: 'Code Sample' AND title: " + this.nls.geocodeCache + this.appendValue };
        this.portal.queryItems(queryData).then(lang.hitch(this, function (result) {
          if (!(result.results && result.results.length > 0)) {
            this._createGeocodeCache().then(lang.hitch(this, function (response) {
              this.portal.getItemById(response.id).then(lang.hitch(this, function (item) {
                def.resolve(item);
              }));
            }));
          } else {
            def.resolve(result.results[0]);
          }
        }));
        return def;
      },

      _createGeocodeCache: function (r) {
        //create an item in the users org that will store the kv pair {this.address: {x: 0, y: 0}}
        this.address = {};
        var hasFileUpload = window.FormData && window.FileList;
        var blob = new Blob([JSON.stringify(this.address)], { type: "application/json" });
        var formData = new FormData();
        formData.append("itemType", "file");
        formData.append("type", "Code Sample");
        formData.append("title", this.nls.geocodeCache + this.appendValue);
        formData.append("file", blob, this.nls.geocodeCache + this.appendValue);
        return esriRequest({
          url: this.baseUrl + "content/users/" + this.user.username + "/addItem",
          form: formData,
          content: {
            f: "json"
          }
        }, { usePost: true });
      },

      _getUser: function () {
        var def = new Deferred();
        this.portal.getUser().then(function (user) {
          def.resolve(user);
        }, function (err) {
          def.reject(err);
        });
        return def;
      }
    });

  clazz.getInstance = function (options) {
    if (instance === null) {
      instance = new clazz(options);
    }
    return instance;
  };

  return clazz;
});
