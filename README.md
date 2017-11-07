# neighborhood-map
Udacity Project 5 - A single-page application featuring a map of my 
neighborhood. Local Castles and Eateries that I like are listed and 
marked on the Google Map. Selecting a marker (either directly or 
via the left-hand bar) queries Flickr for photos based on the geo 
location of the marker.

# Getting started
Open [index.html](index.html) in a browser

# How it works
1) When index.html is opened in a browser, the Javascript libraries are downloaded (from a CDN, except for the 
main application which is local) during HTML parsing
2) The Google Map API is called with a callback to the gmapViewModel, which initialises..
    1) the placeListViewModel (and applies the Knockout Bindings)
    2) the Google Map

# Features
* Responsive design achieved through Bootstrap Grid system
* Data binding of both Search Text and Places List through Knockout Observables
* On small devices, the sidebar automatically disappears to allow map to fill all available space
* Typing in search box automatically filters list of places and map markers, resizing map as required
* Clicking a place on sidebar automatically selects place on map and opens Infowindow
* Selecting a marker displays the respective Infowindow and centers the map
* Clicking a marker on the map which has an open Infowindow will close the Infowindow
* Map is customized to make places stand out
* Map uses customized icons for places
* Flickr API used to retrieve relevant photos for marker's geo location and name
* Timeouts retrieving photo URLs from Flickr are handled gracefully

# Files
* index.html - Entry point for application
* styles.css - Stylesheet
* js/
    * app.js - Core application javascript
* static/
    * castle-icon.png - Castle icon for customised Google marker
    * home-icon.png - Home icon for customised Google marker showing where I live
    * restaurant-icon.png - Restaurant icon for customised Google marker

Note: 3rd party JS libs are loaded from a CDN
