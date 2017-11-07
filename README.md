# neighborhood-map
Udacity Project 5 - A single-page application featuring a map of my 
neighborhood. Local Castles and Eateries that I like are listed and 
marked on the Google Map. Selecting a marker (either directly or 
via the left-hand bar) queries Flickr for photos based on the geo 
location of the marker.

# Getting started
Open [index.html](index.html) in a browser

# How it works
When index.html is opened in a browser, 

# Features
* On small devices, the sidebar automatically disappears to allow map to fill all available space
* Typing in search box automatically filters list of places and map markers, resizing map as required
* Clicking a place on sidebar automatically selects place on map and opens Infowindow
* Clicking a marker on the map displays the respective Infowindow
* Clicking a marker on the map which has an open Infowindow will close the Infowindow
* Map is customized to make places stand out
* Map uses customized icons for places
* Opening an Infowindow will display a carousel of pictures if any are available for the location on Flickr

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
