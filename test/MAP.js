var map, datasource, client, popup, searchInput, resultsPanel, searchInputLength, centerMapOnResults;

        //The minimum number of characters needed in the search input before a search is performed.
        var minSearchInputLength = 3;

        //The number of ms between key strokes to wait before performing a search.
        var keyStrokeDelay = 150;

     

    function GetMap() {

        navigator.geolocation.getCurrentPosition(function(position) {
           

            map = new atlas.Map('myMap', {
                language: 'zh-HanT-TW',
                view: 'Auto',
                center: [position.coords.longitude,position.coords.latitude],
                zoom: 14,
            //Add authentication details for connecting to Azure Maps.
                authOptions: {
        
                    //Use an Azure Maps key. Get an Azure Maps key at https://azure.com/maps. NOTE: The primary key should be used as the key.
                    authType: 'subscriptionKey',
                    subscriptionKey: 'Vft532-PyhS3hneqbxlxGKjboUxRfXKZIOrarJz24I0'
                }
                }) ;
        
                    //Store a reference to the Search Info Panel.
                resultsPanel = document.getElementById("results-panel");

                resultsPanel.innerHTML = '';
                var pipeline = atlas.service.MapsURL.newPipeline(new atlas.service.MapControlCredential(map));
                var searchURL = new atlas.service.SearchURL(pipeline);
                var query = 'hospital'
            searchURL.searchPOI(atlas.service.Aborter.timeout(10000), query, {
                lon: map.getCamera().center[0],
                lat: map.getCamera().center[1],
                maxFuzzyLevel: 4,
                view: 'Auto'
            }).then((results) => {

                //Extract GeoJSON feature collection from the response and add it to the datasource
                var data = results.geojson.getFeatures();
                datasource.add(data);

                if (centerMapOnResults) {
                    map.setCamera({
                        bounds: data.bbox
                    });
                }
                console.log(data);
                //Create the HTML for the results list.
                var html = [];
                for (var i = 0; i < data.features.length; i++) {
                    var r = data.features[i];
                    html.push('<li onclick="itemClicked(\'', r.id, '\')" onmouseover="itemHovered(\'', r.id, '\')">')
                    html.push('<div class="title">');
                    if (r.properties.poi && r.properties.poi.name) {
                        html.push(r.properties.poi.name);
                    } else {
                        html.push(r.properties.address.freeformAddress);
                    }
                    html.push('</div><div class="info">', r.properties.type, ': ', r.properties.address.freeformAddress, '</div>');
                    if (r.properties.poi) {
                        if (r.properties.phone) {
                            html.push('<div class="info">phone: ', r.properties.poi.phone, '</div>');
                        }
                        if (r.properties.poi.url) {
                            html.push('<div class="info"><a href="http://', r.properties.poi.url, '">http://', r.properties.poi.url, '</a></div>');
                        }
                    }
                    html.push('</li>');
                    resultsPanel.innerHTML = html.join('');
                }

            });
    
                //Create a popup which we can reuse for each result.
                popup = new atlas.Popup();
    
                //Wait until the map resources are ready.
                map.events.add('ready', function () {
    
                    //Add the zoom control to the map.
                    map.controls.add(new atlas.control.ZoomControl(), {
                        position: 'top-right'
                    });
    
                    //Create a data source and add it to the map.
                    datasource = new atlas.source.DataSource();
                    map.sources.add(datasource);
    
                    //Add a layer for rendering the results.
                    var searchLayer = new atlas.layer.SymbolLayer(datasource, null, {
                        iconOptions: {
                            image: 'pin-round-darkblue',
                            anchor: 'center',
                            allowOverlap: true
                        }
                    });
                    map.layers.add(searchLayer);
    
                    //Add a click event to the search layer and show a popup when a result is clicked.
                    map.events.add("click", searchLayer, function (e) {
                        //Make sure the event occurred on a shape feature.
                        if (e.shapes && e.shapes.length > 0) {
                            showPopup(e.shapes[0]);
                        }
                    });
                });


            

        })

        
            
        } //map()


      
        function itemHovered(id) {
            //Show a popup when hovering an item in the result list.
            var shape = datasource.getShapeById(id);
            showPopup(shape);
        }
        function itemClicked(id) {
            //Center the map over the clicked item from the result list.
            var shape = datasource.getShapeById(id);
            map.setCamera({
                center: shape.getCoordinates(),
                zoom: 17
            });
        }
        function showPopup(shape) {
            var properties = shape.getProperties();
            //Create the HTML content of the POI to show in the popup.
            var html = ['<div class="poi-box">'];
            //Add a title section for the popup.
            html.push('<div class="poi-title-box"><b>');

            if (properties.poi && properties.poi.name) {
                html.push(properties.poi.name);
            } else {
                html.push(properties.address.freeformAddress);
            }
            html.push('</b></div>');
            //Create a container for the body of the content of the popup.
            html.push('<div class="poi-content-box">');
            html.push('<div class="info location">', properties.address.freeformAddress, '</div>');
            if (properties.poi) {
                if (properties.poi.phone) {
                    html.push('<div class="info phone">', properties.phone, '</div>');
                }
                if (properties.poi.url) {
                    html.push('<div><a class="info website" href="http://', properties.poi.url, '">http://', properties.poi.url, '</a></div>');
                }
            }
            html.push('</div></div>');
            popup.setOptions({
                position: shape.getCoordinates(),
                content: html.join('')
            });
            popup.open(map);
        }