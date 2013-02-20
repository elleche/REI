	var tagsUsage = {};
	tagsUsage.allTagsList = [];
	tagsUsage.maxUsage = 0;
	tagsUsage.minUsage = 1000;
	var minCloudFontSize = 1;
	var maxCloudFontSize = 1.5;
	var activeTag = '';
	var previousTag = '';
	var tagCloudHolderId = 'tagCloud';
	var activeTagCSS = 'active';
	var inactiveTagCSS = 'inactive';
	var projectVisuals = [];
	var dataTable;
	var projectsLocation = 'https://docs.google.com/spreadsheet/tq?key=0Aq_Q__MOujOMdHlhNG9QZE9tY2k1SHk3bjV1Z25Ebnc&headers=1&gid=0';
	var projectsQuery = 'select A, B, C, D, E, H, I, K, L';
	var map;
	var mapHolderId = 'mapCanvas';
	var myCenter = { 'lat': 27.059126, 'lng': 9.492188 };
	var headquarterLatLng;
	var myHeadquarter = { 'lat': 52.0910, 'lng': 5.1220 };
	var myHeadquarterImage = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
	var myHeadquarterTitle = 'an.editor.nl@gmail.com';
	var infoWindowCSS = 'infoBox';
	var projectInfoWindow;
	var comparativeProjectLineContructor = {
					strokeColor: "#000000",
					strokeOpacity: 0,
					strokeWeight: 3,
					geodesic: true,
					icons: [{icon: 	{path: 'M 0,-1 0,1',
									 strokeOpacity: 1,
									 scale: 1.5
									},
							 offset: '0',
							 repeat: '5px'
							},
							{icon: 	{path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
									 strokeOpacity: 1,
									 scale: 3
									},
							 offset: '100%'
							},
							{icon: 	{path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
									 strokeOpacity: 1,
									 scale: 3
									},
							 offset: '0%'
							}]};
	
	google.load('visualization', '1', {'packages':['table']});	
	$(document).ready(loadGoogleAPI);
	
	function loadGoogleAPI()
	{
		google.setOnLoadCallback(createVisuals);
	}
	
	function createVisuals() 
	{
		initializeMap();
		initializeHeadquarter();
		getAllProjectsToMap();
	}
	
	function initializeMap()
	{			
		mapCenter = new google.maps.LatLng( myCenter.lat, myCenter.lng);
		var mapOptions = {
			zoom: 2,
			center: mapCenter,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true,			
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};
		map = new google.maps.Map(document.getElementById(mapHolderId), mapOptions);
		projectInfoWindow = new google.maps.InfoWindow();
	}
	
	function initializeHeadquarter()
	{		
		headquarterLatLng = new google.maps.LatLng(myHeadquarter.lat, myHeadquarter.lng);
		var headquarterMarker = new google.maps.Marker({
					position: headquarterLatLng,
					map: map,
					icon: myHeadquarterImage,
					title: myHeadquarterTitle     
				});
		var div = $('<div/>',{'class': infoWindowCSS});
		div.append($('<h1/>', { text: myHeadquarterTitle }));
		attachInfoWindow(headquarterMarker, div[0].outerHTML);
	}
	
	function getAllProjectsToMap()
	{
		activeTag = 'all';
		
		var opts = {sendMethod: 'auto'};
		var query = new google.visualization.Query(projectsLocation, opts);
		query.setQuery(projectsQuery); 
		query.send(handleGetProjectsQueryResponse);
	}
	
	function handleGetProjectsQueryResponse(response) 
	{
		if (response.isError()) 
		{
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
			return;
		}

		dataTable = response.getDataTable();
		if (dataTable != null)	
		{
			var numberOfRows = dataTable.getNumberOfRows();
			dataTable = JSON.parse(dataTable.toJSON());
			for (var i = 0; i < numberOfRows; i++)
			{
				var projectData = dataTable.rows[i].c;
				createPrimaryProjectVisual(projectData, i);				
			}
			createTagCloud();
		}
	}
	
	function createPrimaryProjectVisual(rowOfValues, projectIndex)
	{
		if (rowOfValues != null && rowOfValues.length > 0)
		{
			project = {};
			project.topic = (rowOfValues[0] == null) ? '' : rowOfValues[0].v;
			project.type = (rowOfValues[1] == null) ? '' : rowOfValues[1].v;
    		project.institution = (rowOfValues[2] == null) ? '' : rowOfValues[2].v;
			project.description = (rowOfValues[3] == null) ? '' : rowOfValues[3].v;
			project.tagWords = (rowOfValues[4] == null) ? '' : rowOfValues[4].v;
			project.point1lat = (rowOfValues[5] == null) ? 0 : rowOfValues[5].v;
			project.point1lng = (rowOfValues[6] == null) ? 0 : rowOfValues[6].v;
			project.point2lat = (rowOfValues[7] == null) ? 0 : rowOfValues[7].v;
			project.point2lng = (rowOfValues[8] == null) ? 0 : rowOfValues[8].v;
			
			recordTagsUse(project.tagWords, projectIndex);						
			
			var pinLocation1 = new google.maps.LatLng(project.point1lat, project.point1lng);
			var pinLocation2 = headquarterLatLng;
			var visual = {};
			
			var projectPolyline = new google.maps.Polyline(comparativeProjectLineContructor);
			projectPolyline.setMap(map);
			var path = projectPolyline.getPath(); 
			path.push(pinLocation2);
			path.push(pinLocation1);
			visual.polyline = projectPolyline;
			
			var marker1 = new google.maps.Marker({ position: pinLocation1,
														map: map,
														title: project.topic });			
			visual.marker1 = marker1;
			
			var marker2 = new google.maps.Marker({ position: pinLocation2,
														map: map,
														title: project.topic });			
			visual.marker2 = marker2;
			
			var infoHTML = createHTML(project);
			attachInfoWindow(visual.polyline,infoHTML);			
			attachInfoWindow(visual.marker1,infoHTML);			
			attachInfoWindow(visual.marker2,infoHTML);	

			projectVisuals.push(visual)
		}
	}
	
	function recordTagsUse(projectTagWords, projectIndex)
	{
		var projectTags = projectTagWords.split(',');
		var count = projectTags.length;
		for (var i = 0; i < count; i++)
		{
			var tag = projectTags[i].toLowerCase();
			tag = tag.trim();	
			if (tag == '') continue;
			if (tagsUsage[tag] == null)
			{
				tagsUsage[tag] = {'usage': 1, 'projects': [projectIndex]};
				tagsUsage.allTagsList.push(tag);				
			}
			else
			{	
				tagsUsage[tag].usage++;
				tagsUsage[tag].projects.push(projectIndex);				
			}
			if (tagsUsage[tag].usage > tagsUsage.maxUsage) tagsUsage.maxUsage = tagsUsage[tag].usage;
		}
	}
	
	function createHTML(project)
	{
		var div = $('<div/>',{'class': infoWindowCSS});
		div.append($('<h1/>', { text: project.topic }));
		var type = (project.institution != '' && project.type != '') ? project.type+', ' : project.type;
		div.append($('<h2/>', { text: type })
				.append($('<i/>', { text: project.institution })));
		div.append($('<p/>', { text: project.description }));
		
		return div[0].outerHTML;
	}
	
	function attachInfoWindow(mapObject,content) 
	{
		google.maps.event.addListener(mapObject, 'click', function(event) {
														projectInfoWindow.setContent(content);
														projectInfoWindow.setPosition(event.latLng);
														projectInfoWindow.open(map);
													});
	}
	
	function updateMap(tag)
	{
		updateActiveTag(tag);
		switch (previousTag)
		{ 
			case 'all':
				hideVisuals(projectVisuals);				
				break;
			default:
				hideVisualsByProjectIndex(tagsUsage[previousTag].projects);
				break;
		}
		
		var mapCenter = new google.maps.LatLng( myCenter.lat, myCenter.lng);
		map.setOptions({
			zoom: 2,
			center: mapCenter});
		projectInfoWindow.close();
		
		showVisualsByProjectIndex(tagsUsage[activeTag].projects);
	}
	
	function hideVisuals(arrayOfVisuals)
	{
		if (arrayOfVisuals) 
		{
			var count = arrayOfVisuals.length;
			for (var i = 0; i < count; i++) 
			{
				visual = arrayOfVisuals[i];
				toggleVisual(visual, null);
			}
		}
	}
	
	function hideVisualsByProjectIndex(arrayOfIndexes)
	{
		if (arrayOfIndexes) 
		{
			var count = arrayOfIndexes.length;
			for (var i = 0; i < count; i++) 
			{
				visual = projectVisuals[arrayOfIndexes[i]];
				toggleVisual(visual, null);
			}
		}
	}
	
	function showVisualsByProjectIndex(arrayOfIndexes) 
	{
		if (arrayOfIndexes) 
		{
			var count = arrayOfIndexes.length;
			for (var i = 0; i < count; i++) 
			{
				visual = projectVisuals[arrayOfIndexes[i]];
				toggleVisual(visual, map);
			}
		}
    }
	//hide or show projectVisual depending on if mapSetting is null or not
	function toggleVisual(projectVisual, mapSetting)
	{
		projectVisual.polyline.setMap(mapSetting);
		projectVisual.marker1.setMap(mapSetting);
		projectVisual.marker2.setMap(mapSetting);
	}
	
	function updateActiveTag(tag)
	{
		if (tag != activeTag)
		{
			previousTag = activeTag;
			activeTag = tag;
			
			if (previousTag != 'all')
			{
				//deactivate previousTag
				var selector = escapeSpace('#span '+jqEscape(previousTag));
				$(selector).addClass(inactiveTagCSS).removeClass(activeTagCSS);				
			}		
			//activate activeTag
			var selector = escapeSpace('#span '+jqEscape(activeTag));
			$(selector).addClass(activeTagCSS).removeClass(inactiveTagCSS);
		}
	}
	
	function createTagCloud()
	{	
		var tagsCount = tagsUsage.allTagsList.length;
		var tag = '';
		for (var i = 0; i < tagsCount; i++)
		{
			tag = tagsUsage.allTagsList[i];
			if (tagsUsage[tag].usage < tagsUsage.minUsage) tagsUsage.minUsage = tagsUsage[tag].usage;
		}
		var spread = tagsUsage.maxUsage - tagsUsage.minUsage;  
		if (spread == 0) spread = 1;
		var step = (maxCloudFontSize - minCloudFontSize)/(spread);		
	
		var div = $('#'+tagCloudHolderId);
		tagsUsage.allTagsList.sort();
		for (var i = 0; i < tagsCount; i++)
		{
			tag = tagsUsage.allTagsList[i];
			var fontSize = minCloudFontSize + ((tagsUsage[tag].usage - tagsUsage.minUsage) * step);  
			
			var span = $('<span/>', {
				id: escapeSpace('span '+tag),
				text: tag,
				data: {'name': tag},
				'class': inactiveTagCSS+' tag',
				'style': 'font-size: '+fontSize+'em',
				click: function() { updateMap($(this).data('name')); }
			});
			var space = $('<span/>', { text: " " });
			span.appendTo(div);
			space.appendTo(div);
		}
	}
	
	// Escapes the special characters # ; & , . + * ~ ' : " ! ^ $ [ ] ( ) = > | / and returns a valid jQuery selector
	function jqEscape(str)
	{
		return str.replace(/([#;&,.%+*~\':"!^$[\]()=>|\/])/g,'\\$&');
	}
	
	//replaces ' ' with '-'
	function escapeSpace(str)
	{
		return str.replace(/ /g,'-');
	}