// @license
// Redistribution and use in source and binary forms ...

// Class for managing a timelapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Videoset
// * org.gigapan.timelapse.VideosetStats
// * jQuery (http://jquery.com/)
//
// Copyright 2011 Carnegie Mellon University. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Carnegie Mellon University.
//
// Authors:
// Chris Bartley (bartley@cmu.edu)
// Paul Dille (pdille@andrew.cmu.edu)
// Yen-Chia Hsu (legenddolphin@gmail.com)
// Randy Sargent (randy.sargent@cs.cmu.edu)
//
// VERIFY NAMESPACE
//
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.

"use strict";

var org;
var availableTimelapses = [];
var browserSupported;
var timelapseMetadata;

if (!org) {
  org = {};
} else {
  if (typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if (typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if (typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDECIES
//
if (!org.gigapan.Util) {
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Timelapse";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!org.gigapan.timelapse.Videoset) {
  var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Timelapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!org.gigapan.timelapse.parabolicMotion) {
  var noVideosetMsg = "The org.gigapan.timelapse.parabolicMotion library is required by org.gigapan.timelapse.Timelapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.Timelapse";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Timelapse = function(timeMachineDivId, settings) {
    availableTimelapses.push(this);

    // Settings
    var isHyperwall = settings["isHyperwall"] || false;
    var loopPlayback = settings["loopPlayback"] || true;
    var customLoopPlaybackRates = settings["customLoopPlaybackRates"] || null;
    var playOnLoad = settings["playOnLoad"] || false;
    var playbackSpeed = settings["playbackSpeed"] && UTIL.isNumber(settings["playbackSpeed"]) ? settings["playbackSpeed"] : 1;
    var datasetLayer = settings["layer"] && UTIL.isNumber(settings["layer"]) ? settings["layer"] : 0;
    var initialTime = settings["initialTime"] && UTIL.isNumber(settings["initialTime"]) ? settings["initialTime"] : 0;
    var initialView = settings["initialView"] || null;
    // deprecated
    var doChromeSeekableHack = ( typeof (settings["doChromeSeekableHack"]) == "undefined") ? true : settings["doChromeSeekableHack"];
    // deprecated
    var doChromeBufferedHack = ( typeof (settings["doChromeBufferedHack"]) == "undefined") ? true : settings["doChromeBufferedHack"];
    var doChromeCacheBreaker = ( typeof (settings["doChromeCacheBreaker"]) == "undefined") ? true : settings["doChromeCacheBreaker"];
    var loopDwell = ( typeof (settings["loopDwell"]) == "undefined") ? null : settings["loopDwell"];
    var startDwell = (!loopDwell || typeof (settings["loopDwell"]["startDwell"]) == "undefined") ? 0 : settings["loopDwell"]["startDwell"];
    var endDwell = (!loopDwell || typeof (settings["loopDwell"]["endDwell"]) == "undefined") ? 0 : settings["loopDwell"]["endDwell"];
    var blackFrameDetection = ( typeof (settings["blackFrameDetection"]) == "undefined") ? false : settings["blackFrameDetection"];
    var skippedFramesAtEnd = ( typeof (settings["skippedFramesAtEnd"]) == "undefined" || settings["skippedFramesAtEnd"] < 0) ? 0 : settings["skippedFramesAtEnd"];
    var skippedFramesAtStart = ( typeof (settings["skippedFramesAtStart"]) == "undefined" || settings["skippedFramesAtStart"] < 0) ? 0 : settings["skippedFramesAtStart"];
    var enableMetadataCacheBreaker = settings["enableMetadataCacheBreaker"] || false;
    var enableContextMapOnDefaultUI = ( typeof (settings["enableContextMapOnDefaultUI"]) == "undefined") ? false : settings["enableContextMapOnDefaultUI"];
    var datasetType = settings["datasetType"];
    var useCustomUI = ( typeof (settings["useCustomUI"]) == "undefined") ? (settings["datasetType"] == "landsat" || settings["datasetType"] == "modis") : settings["useCustomUI"];
    var useTouchFriendlyUI = ( typeof (settings["useTouchFriendlyUI"]) == "undefined") ? false : settings["useTouchFriendlyUI"];
    var thumbnailServerRootTileUrl = ( typeof (settings["thumbnailServerRootTileUrl"]) == "undefined") ? settings["url"] : settings["thumbnailServerRootTileUrl"];
    var useThumbnailServer = ( typeof (settings["useThumbnailServer"]) == "undefined") ? true : settings["useThumbnailServer"];
    var visualizerGeometry = {
      width: 250,
      height: 142
    };
    var minViewportHeight = 370;
    var minViewportWidth = 540;
    var defaultLoopDwellTime = 0.5;
    var timePadding = isFirefox ? 0 : 0.25;

    // If the user requested a tour editor AND has a div in the DOM for the editor,
    // then do all related edtior stuff (pull thumbnails for keyframes, etc.)
    // Otherwise, we will still handle tours but no editor will be displayed.
    // (No thumbnails for keyframes pulled and loading a tour will display a load
    // button with the tour name on the center of the viewport.)
    var editorEnabled = ( typeof (settings["enableEditor"]) == "undefined") ? false : settings["enableEditor"];
    var presentationSliderEnabled = ( typeof (settings["enablePresentationSlider"]) == "undefined") ? false : settings["enablePresentationSlider"];
    var annotatorEnabled = ( typeof (settings["enableAnnotator"]) == "undefined") ? false : settings["enableAnnotator"];
    var changeDetectionEnabled = ( typeof (settings["enableChangeDetection"]) == "undefined") ? false : settings["enableChangeDetection"];
    var timelineMetadataVisualizerEnabled = ( typeof (settings["enableTimelineMetadataVisualizer"]) == "undefined") ? false : settings["enableTimelineMetadataVisualizer"];

    // Objects
    var videoset;
    var snaplapse;
    var snaplapseForSharedTour;
    var snaplapseForPresentationSlider;
    var scaleBar;
    var contextMap;
    var annotator;
    var customUI;
    var defaultUI;
    var visualizer;
    var thumbnailTool;
    var changeDetectionTool;
    var timelineMetadataVisualizer;

    // DOM elements
    var dataPanesId;
    var $previousCustomUIElements;

    // Canvas version
    var canvas;
    var blackFrameDetectionCanvas;

    // Full screen variables
    var fullScreen = false;
    var videoStretchRatio = 1;
    var browserSupportsFullScreen = UTIL.fullScreenAPISupported();
    var preFullScreenProperties = {
      width: null,
      height: null,
      zIndex: null
    };

    // Flags
    var isSplitVideo = false;
    var isSafari = UTIL.isSafari();
    var isIE = UTIL.isIE();
    var isIE9 = UTIL.isIE9();
    var doingLoopingDwell = false;
    var isFirefox = UTIL.isFirefox();
    var enableContextMap = true;
    var enablePanoVideo = true;
    var isChrome = UTIL.isChrome();
    var didFirstTimeOnLoad = false;
    var isMovingToWaypoint = false;

    // Viewer
    var viewerDivId = timeMachineDivId + " .player";
    var viewerType;
    var videoDiv;
    var tiles = {};
    var framesPerFragment = 0;
    var secondsPerFragment = 0;
    var panoWidth = 0;
    var panoHeight = 0;
    var viewportWidth = 0;
    var viewportHeight = 0;
    var tileWidth = 0;
    var tileHeight = 0;
    var videoWidth = 0;
    var videoHeight = 0;
    var frames = 0;
    var maxLevel = 0;
    var levelInfo;
    var metadata = null;
    var view = null;
    var targetView = {};
    var currentIdx = null;
    var currentVideo = null;
    var animateInterval = null;
    var lastAnimationTime;
    var keyIntervals = [];
    var targetViewChangeListeners = [];
    var viewChangeListeners = [];
    var resizeListeners = [];
    var viewEndChangeListeners = [];
    var playbackRateChangeListeners = [];
    var zoomChangeListeners = [];
    var fullScreenChangeListeners = [];
    var datasetLoadedListeners = [];
    var thisObj = this;
    var tmJSON;
    var datasetJSON = null;
    var videoDivId;
    var datasetIndex;
    var datasetPath;
    var tileRootPath;
    var customPlaybackTimeout = null;
    var projectionType;
    var loopStartTimeoutId;
    var loopEndTimeoutId;
    var timelapseDurationInSeconds = 0.0;
    var timelapseCurrentTimeInSeconds = 0.0;
    var timelapseCurrentCaptureTimeIndex = 0;
    var captureTimes = [];
    var homeView;
    var panoView;
    var firstVideoId;
    var originalPlaybackRate = playbackSpeed;
    var originalLoopPlayback = loopPlayback;
    var translationSpeedConstant = 20;
    var parabolicMotionController;
    var parabolicMotionObj = org.gigapan.timelapse.parabolicMotion;
    var mediaType = null;
    var desiredInitialDate;
    var onNewTimelapseLoadCompleteCallBack;
    var currentTimelineStyle;

    // animateRate in milliseconds, 40 means 25 FPS
    var animateRate = 40;
    if (isHyperwall)
      animateRate = 10;
    else if (viewerType == "webgl")
      animateRate = 10;
    // animationFractionPerSecond, 5 means goes 500% toward goal in 1 sec
    var animationFractionPerSecond = 5;
    if (isHyperwall)
      animateRate = 3;
    else if (viewerType == "webgl")
      animateRate = 12;
    // minTranslateSpeedPixelsPerSecond in pixels
    var minTranslateSpeedPixelsPerSecond = isHyperwall ? 25 : 25;
    // minZoomSpeedPerSecond in log2 scale
    // If animateRate is halved, minZoomSpeedPerSecond should also be halved.
    var minZoomSpeedPerSecond = isHyperwall ? 0.0001 : 0.125;
    // How fast we move the camera along the parabolic path
    var parabolicMotionPathSpeed = 1.35;

    // Joystick Variables
    var isJoystickButtonPressed = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    var joystickTimers = [0.0, 0.0];

    // levelThreshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
    //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
    //  0.5: select a tile that's shown between 71% and 141% size
    //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
    // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
    // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
    var defaultLevelThreshold = 0.05;
    var levelThreshold = defaultLevelThreshold;

    // Scale bar, context map, visualizer
    var panoVideo;
    var topLevelVideo = {};
    var leader;

    // Constants
    var CONSTANTS = {
      COORDINATE_SYSTEM: {
        PIXEL: 0,
        LAT_LNG: 1
      },
      VIEW_FIT: {
        CENTER: 0,
        BOUNDING_BOX: 1
      }
    };
    this.CONSTANTS = CONSTANTS;

    var rootAppURL = org.gigapan.Util.getRootAppURL();

    // Touch support
    var hasTouchSupport = UTIL.isTouchDevice();
    var tapped = false;
    var lastDist = null;
    var draggingSlider = false;
    var lastLocation;
    var thisLocation;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.setDoDwell = function(state) {
      loopDwell = state;
    };

    this.getTimePadding = function() {
      return timePadding;
    };

    this.isMovingToWaypoint = function() {
      return isMovingToWaypoint;
    };

    this.useTouchFriendlyUI = function() {
      return useTouchFriendlyUI;
    };

    this.getHomeView = function() {
      return homeView;
    };

    this.getPanoView = function() {
      return panoView;
    };

    this.getDatasetType = function() {
      return datasetType;
    };

    this.useCustomUI = function() {
      return useCustomUI;
    };

    this.getStartDwell = function() {
      return startDwell;
    };

    this.getEndDwell = function() {
      return endDwell;
    };

    this.getPlayOnLoad = function() {
      return playOnLoad;
    };

    this.updateShareViewTextbox = function() {
      defaultUI.updateShareViewTextbox();
    };

    this.setMinZoomSpeedPerSecond = function(value) {
      minZoomSpeedPerSecond = value;
    };

    this.setMinTranslateSpeedPixelsPerSecond = function(value) {
      minTranslateSpeedPixelsPerSecond = value;
    };

    this.setAnimateRate = function(value) {
      animateRate = value;
    };

    this.setAnimationFractionPerSecond = function(value) {
      animationFractionPerSecond = value;
    };

    this.getSettings = function() {
      return settings;
    };

    this.isDoingLoopingDwell = function() {
      return doingLoopingDwell;
    };

    this.isEditorEnabled = function() {
      return editorEnabled;
    };

    this.isPresentationSliderEnabled = function() {
      return presentationSliderEnabled;
    };

    this.isChangeDetectionEnabled = function() {
      return changeDetectionEnabled;
    };

    this.isAnnotatorEnabled = function() {
      return annotatorEnabled;
    };

    this.getDefaultUI = function() {
      return defaultUI;
    };

    this.getCustomUI = function() {
      return customUI;
    };

    this.getTimelineMetadataVisualizer = function() {
      return timelineMetadataVisualizer;
    };

    this.getMinViewportHeight = function() {
      return minViewportHeight;
    };

    this.getMinViewportWidth = function() {
      return minViewportWidth;
    };

    // Used by defaultUI to switch between modes (player, editor, etc)
    // TODO: Rename?
    this.getMode = function() {
      return defaultUI.getMode();
    };

    this.getTimelapseCurrentCaptureTimeIndex = function() {
      return timelapseCurrentCaptureTimeIndex;
    };

    this.getCaptureTimes = function() {
      return captureTimes;
    };

    this.getCurrentCaptureTime = function() {
      return captureTimes[timelapseCurrentCaptureTimeIndex];
    };

    this.doChromeSeekableHack = function() {
      return doChromeSeekableHack;
    };

    this.doChromeBufferedHack = function() {
      return doChromeBufferedHack;
    };

    this.doChromeCacheBreaker = function() {
      return doChromeCacheBreaker;
    };

    this.getContextMap = function() {
      return contextMap;
    };

    this.getScaleBar = function() {
      return scaleBar;
    };

    this.getVisualizer = function() {
      return visualizer;
    };

    this.setContextMapEnableStatus = function(status) {
      enableContextMap = status;
    };

    this.isContextMapEnable = function() {
      return enableContextMap;
    };

    this.getTimeMachineDivId = function() {
      return timeMachineDivId;
    };

    this.getViewerDivId = function() {
      return viewerDivId;
    };

    this.getViewerDiv = function() {
      return $('#' + viewerDivId)[0];
    };

    this.getVideoDivId = function() {
      return videoDivId;
    };

    this.getVideoDiv = function() {
      return $('#' + videoDivId)[0];
    };

    this.getMediaType = function() {
      return mediaType;
    };

    this.getSnaplapse = function() {
      return snaplapse;
    };

    this.getSnaplapseForSharedTour = function() {
      return snaplapseForSharedTour;
    };

    this.getSnaplapseForPresentationSlider = function() {
      return snaplapseForPresentationSlider;
    };

    this.getCanvas = function() {
      return canvas;
    };

    this.getAnnotator = function() {
      return annotator;
    };

    this.getThumbnailTool = function() {
      return thumbnailTool;
    };

    this.getChangeDetectionTool = function() {
      return changeDetectionTool;
    };

    this.getDataPanesContainerId = function() {
      return dataPanesId;
    };

    this.getDataPanes = function() {
      return $(dataPanesId).children();
    };

    this.getLoopPlayback = function() {
      return loopPlayback;
    };

    this.setLoopPlayback = function(newLoopPlayback, preserveOriginalLoop) {
      if (!preserveOriginalLoop)
        originalLoopPlayback = loopPlayback;
      loopPlayback = newLoopPlayback;
    };

    this.restoreLoopPlayback = function() {
      loopPlayback = originalLoopPlayback;
    };

    this.handleEditorModeToolbarChange = function() {
      snaplapse.getSnaplapseViewer().handleEditorModeToolbarChange();
    };

    this.isFullScreen = function() {
      return fullScreen;
    };

    this.changeFullScreenState = function() {
      fullScreen = !fullScreen;
      for (var i = 0; i < fullScreenChangeListeners.length; i++)
        fullScreenChangeListeners[i](browserSupportsFullScreen);
    };

    this.handlePlayPause = function() {
      if (timelapseCurrentTimeInSeconds <= 0 && thisObj.getPlaybackRate() <= 0)
        return;
      if (doingLoopingDwell && ((snaplapse && !snaplapse.isPlaying()) || (snaplapseForSharedTour && !snaplapseForSharedTour.isPlaying()))) {
        doingLoopingDwell = false;
        _pause();
        // Need to manually do this because of the looping dwell code
        var playPauseBtn;
        if (customUI)
          playPauseBtn = " .customPlay";
        else
          playPauseBtn = " .playbackButton";
        $("#" + viewerDivId + playPauseBtn).button({
          icons: {
            primary: "ui-icon-custom-play"
          },
          text: false
        }).attr({
          "title": "Play"
        });
        return;
      }
      if (_isPaused()) {
        if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
          _seek(0);
          _play();
        } else {
          _play();
        }
      } else {
        _pause();
      }
    };

    var stopParabolicMotion = function() {
      if (parabolicMotionController) {
        isMovingToWaypoint = false;
        parabolicMotionController._disableAnimation();
      }
    };
    this.stopParabolicMotion = stopParabolicMotion;

    var convertViewportToTimeMachine = function(point) {
      var boundingBox = thisObj.getBoundingBoxForCurrentView();
      var newPoint = {
        x: boundingBox.xmin + point.x * ((boundingBox.xmax - boundingBox.xmin) / viewportWidth),
        y: boundingBox.ymin + point.y * ((boundingBox.ymax - boundingBox.ymin) / viewportHeight)
      };
      return newPoint;
    };
    this.convertViewportToTimeMachine = convertViewportToTimeMachine;

    var convertTimeMachineToViewport = function(point) {
      var boundingBox = thisObj.getBoundingBoxForCurrentView();
      var newPoint = {
        x: (point.x - boundingBox.xmin) * (viewportWidth / (boundingBox.xmax - boundingBox.xmin)),
        y: (point.y - boundingBox.ymin) * (viewportHeight / (boundingBox.ymax - boundingBox.ymin))
      };
      return newPoint;
    };
    this.convertTimeMachineToViewport = convertTimeMachineToViewport;

    var getCurrentZoom = function() {
      return scaleToZoom(view.scale);
    };
    this.getCurrentZoom = getCurrentZoom;

    var scaleToZoom = function(scale) {
      if (scale == undefined) {
        scale = view.scale;
      }
      return Math.round(1e3 * Math.log(scale / (panoView.scale)) / Math.log(2)) / 1e3;
    };
    this.scaleToZoom = scaleToZoom;

    var zoomToScale = function(zoom) {
      if (zoom == undefined) {
        zoom = getCurrentZoom();
      }
      return Math.pow(2, zoom) * panoView.scale;
    };
    this.zoomToScale = zoomToScale;

    var getZoomFromBoundingBoxView = function(bboxView) {
      var newView;
      if (!bboxView || !bboxView['bbox'])
        return;
      var bboxViewNE = bboxView.bbox.ne;
      var bboxViewSW = bboxView.bbox.sw;
      if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && bboxViewNE && bboxViewSW && UTIL.isNumber(bboxViewNE.lat) && UTIL.isNumber(bboxViewNE.lng) && UTIL.isNumber(bboxViewSW.lat) && UTIL.isNumber(bboxViewSW.lng)) {
        newView = latLngBoundingBoxToPixelCenter(bboxView);
      } else if (UTIL.isNumber(bboxView.bbox.xmin) && UTIL.isNumber(bboxView.bbox.xmax) && UTIL.isNumber(bboxView.bbox.ymin) && UTIL.isNumber(bboxView.bbox.ymax)) {
        newView = pixelBoundingBoxToPixelCenter(bboxView);
      } else {
        newView = view;
      }
      return scaleToZoom(newView.scale);
    };
    this.getZoomFromBoundingBoxView = getZoomFromBoundingBoxView;

    var handleKeydownEvent = function(event) {
      var activeElement = document.activeElement;
      var sliderActive = $("#" + viewerDivId + " .timelineSlider .ui-slider-handle:focus").length || $("#" + viewerDivId + " .zoomSlider .ui-slider-handle:focus").length;
      // If we are focused on a text field or the slider handlers, do not run any player specific controls.
      if (activeElement == "[object HTMLInputElement]" || activeElement == "[object HTMLTextAreaElement]")
        return;
      var moveFn;
      switch (event.which) {
        // Escape key
        case 27:
          if (fullScreen && !browserSupportsFullScreen) {
            _fullScreen();
          }
          break;
        // Left arrow
        case 37:
          if (sliderActive)
            return;
          if (event.shiftKey) {
            moveFn = function() {
              targetView.x -= (translationSpeedConstant * 0.4) / view.scale;
              setTargetView(targetView);
            };
          } else {
            if (!thisObj.isPaused())
              thisObj.handlePlayPause();
            $(activeElement).removeClass("openHand closedHand");
            seekToFrame(getCurrentFrameNumber() - 1);
            if (customUI) {
              customUI.focusTimeTick(getCurrentFrameNumber() - 1);
            }
          }
          event.preventDefault();
          break;
        // Right arrow
        case 39:
          if (sliderActive)
            return;
          if (event.shiftKey) {
            moveFn = function() {
              targetView.x += (translationSpeedConstant * 0.4) / view.scale;
              setTargetView(targetView);
            };
          } else {
            if (!thisObj.isPaused())
              thisObj.handlePlayPause();
            $(activeElement).removeClass("openHand closedHand");
            seekToFrame(getCurrentFrameNumber() + 1);
            if (customUI) {
              customUI.focusTimeTick(getCurrentFrameNumber() + 1);
            }
          }
          event.preventDefault();
          break;
        // Up arrow
        case 38:
          if (sliderActive)
            return;
          if (event.shiftKey) {
            moveFn = function() {
              if (event.shiftKey) {
                targetView.y -= (translationSpeedConstant * 0.4) / view.scale;
              } else {
                targetView.y -= (translationSpeedConstant * 0.8) / view.scale;
              }
              setTargetView(targetView);
            };
          }
          break;
        // Down arrow
        case 40:
          if (sliderActive)
            return;
          if (event.shiftKey) {
            moveFn = function() {
              if (event.shiftKey) {
                targetView.y += (translationSpeedConstant * 0.4) / view.scale;
              } else {
                targetView.y += (translationSpeedConstant * 0.8) / view.scale;
              }
              setTargetView(targetView);
            };
          }
          break;
        // Minus
        case 173:
        case 109:
        case 189:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.scale *= 0.999;
            } else {
              targetView.scale *= 0.94;
            }
            setTargetView(targetView);
          };
          break;
        // Plus
        case 61:
        case 107:
        case 187:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.scale /= 0.999;
            } else {
              targetView.scale /= 0.94;
            }
            setTargetView(targetView);
          };
          break;
        // P or Spacebar
        case 80:
        case 32:
          thisObj.handlePlayPause();
          event.preventDefault();
          break;
        default:
          return;
      }
      // Install interval to run every 50 msec while key is down
      // Each arrow key and +/- has its own interval, so multiple can be down at once
      if (keyIntervals[event.which] == undefined)
        keyIntervals[event.which] = setInterval(moveFn, 50);
    };

    var handleKeyupEvent = function(event) {
      if (keyIntervals[event.which] != undefined) {
        clearInterval(keyIntervals[event.which]);
        keyIntervals[event.which] = undefined;
      }
    };

    var handleMousescrollEvent = function(event, delta, deltaX, deltaY, fromTouch) {
      var magnitude;
      if (fromTouch) {
        magnitude = delta / 100;
      } else {
        // Default values when using the mouse scrollwheel.
        // Using the shift key while scrolling allow for more precise movement.
        if (delta > 0) {
          magnitude = (event.shiftKey) ? 0.01 : 0.1;
        } else if (delta < 0) {
          magnitude = (event.shiftKey) ? -0.01 : -0.1;
        }
        event.preventDefault();
      }
      zoomAbout(1 + magnitude, event.pageX, event.pageY);
    };
    this.handleMousescrollEvent = handleMousescrollEvent;

    // Map touch events to mouse events.
    var touch2Mouse = function(e) {
      e.preventDefault();

      var theTouch = e.changedTouches[0];
      var thisTouchCount = e.touches.length;
      var mouseEvent;
      var theMouse;

      switch (e.type) {
        case "touchstart":
          mouseEvent = "mousedown";
          break;
        case "touchcancel":
        case "touchend":
          mouseEvent = "mouseup";
          lastDist = null;
          if (thisTouchCount == 1) {
            // Handle going from 2 fingers to 1 finger pan.
            theTouch = e.touches[0];

            theMouse = document.createEvent("MouseEvent");
            theMouse.initMouseEvent("mouseup", true, true, window, 1, theTouch.screenX, theTouch.screenY, theTouch.clientX, theTouch.clientY, false, false, false, false, 0, null);
            theTouch.target.dispatchEvent(theMouse);

            theMouse = document.createEvent("MouseEvent");
            theMouse.initMouseEvent("mousedown", true, true, window, 1, theTouch.screenX, theTouch.screenY, theTouch.clientX, theTouch.clientY, false, false, false, false, 0, null);
            theTouch.target.dispatchEvent(theMouse);

            return;
          }
          break;
        case "touchmove":
          mouseEvent = "mousemove";
          if (thisTouchCount == 1) {
            // Translate
          } else if (thisTouchCount == 2) {
            var dist = Math.abs(Math.sqrt((e.touches[0].pageX - e.touches[1].pageX) * (e.touches[0].pageX - e.touches[1].pageX) + (e.touches[0].pageY - e.touches[1].pageY) * (e.touches[0].pageY - e.touches[1].pageY)));
            thisLocation = {
              pageX: (e.touches[0].pageX + e.touches[1].pageX) / 2,
              pageY: (e.touches[0].pageY + e.touches[1].pageY) / 2
            };
            if (lastDist) {
              // Zoom
              var zoom = dist / lastDist;
              zoomAbout(zoom, thisLocation.pageX, thisLocation.pageY);
              // Translate
              targetView.x += (lastLocation.pageX - thisLocation.pageX) / view.scale;
              targetView.y += (lastLocation.pageY - thisLocation.pageY) / view.scale;
              setTargetView(targetView);
            }
            lastDist = dist;
            lastLocation = thisLocation;
            return;
          } else {
            // TODO: More than 2 finger support
            return;
          }
          break;
        default:
          return;
      }
      theMouse = document.createEvent("MouseEvent");
      theMouse.initMouseEvent(mouseEvent, true, true, window, 1, theTouch.screenX, theTouch.screenY, theTouch.clientX, theTouch.clientY, false, false, false, false, 0, null);
      theTouch.target.dispatchEvent(theMouse);
    };

    // Add horizontal scroll touch support to an HTML element.
    var touchHorizontalScroll = function(elem) {
      var scrollStartPos = 0;
      $(elem).on("touchstart", function(e) {
        scrollStartPos = this.scrollLeft + e.originalEvent.touches[0].pageX;
        e.preventDefault();
      }).on("touchmove", function(e) {
        var newPos = scrollStartPos - e.originalEvent.touches[0].pageX;
        draggingSlider = true;
        this.scrollLeft = newPos;
        e.preventDefault();
      }).on("touchend touchcancel", function(e) {
        draggingSlider = false;
      });
    };
    this.touchHorizontalScroll = touchHorizontalScroll;

    var _warpTo = function(newView) {
      setTargetView(newView);
      view.x = targetView.x;
      view.y = targetView.y;
      view.scale = targetView.scale;
      refresh();
    };
    this.warpTo = _warpTo;

    var computeHomeView = function() {
      computePanoView();
      if (settings["newHomeView"] != undefined) {
        // Store the home view so we don't need to compute it every time
        homeView = pixelBoundingBoxToPixelCenter(pixelCenterToPixelBoundingBoxView(settings["newHomeView"]).bbox);
      } else {
        homeView = panoView;
      }
    };

    var computePanoView = function() {
      panoView = pixelBoundingBoxToPixelCenter({
        xmin: 0,
        ymin: 0,
        xmax: panoWidth,
        ymax: panoHeight
      });
    };

    this.getBoundingBoxForCurrentView = function() {
      var bboxView = pixelCenterToPixelBoundingBoxView(view);
      if (bboxView == null)
        return null;
      else
        return bboxView.bbox;
    };

    this.warpToBoundingBox = function(bbox) {
      this.warpTo(pixelBoundingBoxToPixelCenter(bbox));
    };

    this.resetPerf = function() {
      videoset.resetPerf();
    };

    this.getPerf = function() {
      return videoset.getPerf();
    };

    this.getView = function() {
      // Clone current view
      var originalView = $.extend({}, view);
      return originalView;
    };

    this.getVideoset = function() {
      return videoset;
    };

    var _addFullScreenChangeListener = function(listener) {
      fullScreenChangeListeners.push(listener);
    };
    this.addFullScreenChangeListener = _addFullScreenChangeListener;

    var _removeFullScreenChangeListener = function(listener) {
      for (var i = 0; i < fullScreenChangeListeners.length; i++) {
        if (fullScreenChangeListeners[i] == listener[0]) {
          fullScreenChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeFullScreenChangeListener = _removeFullScreenChangeListener;

    var _addTargetViewChangeListener = function(listener) {
      targetViewChangeListeners.push(listener);
    };
    this.addTargetViewChangeListener = _addTargetViewChangeListener;

    var _removeTargetViewChangeListener = function(listener) {
      for (var i = 0; i < targetViewChangeListeners.length; i++) {
        if (targetViewChangeListeners[i] == listener[0]) {
          targetViewChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeTargetViewChangeListener = _removeTargetViewChangeListener;

    var _addViewChangeListener = function(listener) {
      viewChangeListeners.push(listener);
    };
    this.addViewChangeListener = _addViewChangeListener;

    var _removeViewChangeListener = function(listener) {
      for (var i = 0; i < viewChangeListeners.length; i++) {
        if (viewChangeListeners[i] == listener[0]) {
          viewChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeViewChangeListener = _removeViewChangeListener;

    var addResizeListener = function(listener) {
      resizeListeners.push(listener);
    };
    this.addResizeListener = addResizeListener;

    var removeResizeListener = function(listener) {
      for (var i = 0; i < resizeListeners.length; i++) {
        if (resizeListeners[i] == listener[0]) {
          resizeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeResizeListener = removeResizeListener;

    var _addViewEndChangeListener = function(listener) {
      viewEndChangeListeners.push(listener);
    };
    this.addViewEndChangeListener = _addViewEndChangeListener;

    var _removeViewEndChangeListener = function(listener) {
      for (var i = 0; i < viewEndChangeListeners.length; i++) {
        if (viewEndChangeListeners[i] == listener[0]) {
          viewEndChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeViewEndChangeListener = _removeViewEndChangeListener;

    var _addZoomChangeListener = function(listener) {
      zoomChangeListeners.push(listener);
    };
    this.addZoomChangeListener = _addZoomChangeListener;

    var _removeZoomChangeListener = function(listener) {
      for (var i = 0; i < zoomChangeListeners.length; i++) {
        if (zoomChangeListeners[i] == listener[0]) {
          zoomChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeZoomChangeListener = _removeZoomChangeListener;

    var _addVideoPauseListener = function(listener) {
      videoset.addEventListener('videoset-pause', listener);
    };
    this.addVideoPauseListener = _addVideoPauseListener;

    var _removeVideoPauseListener = function(listener) {
      videoset.removeEventListener('videoset-pause', listener);
    };
    this.removeVideoPauseListener = _removeVideoPauseListener;

    var _addVideoPlayListener = function(listener) {
      videoset.addEventListener('videoset-play', listener);
    };
    this.addVideoPlayListener = _addVideoPlayListener;

    var _removeVideoPlayListener = function(listener) {
      videoset.removeEventListener('videoset-play', listener);
    };
    this.removeVideoPlayListener = _removeVideoPlayListener;

    var _makeVideoVisibleListener = function(listener) {
      videoset.addEventListener('video-made-visible', listener);
    };
    this.makeVideoVisibleListener = _makeVideoVisibleListener;

    var _removeVideoVisibleListener = function(listener) {
      videoset.removeEventListener('video-made-visible', listener);
    };
    this.removeVideoVisibleListener = _removeVideoVisibleListener;

    var _addPlaybackRateChangeListener = function(listener) {
      playbackRateChangeListeners.push(listener);
    };
    this.addPlaybackRateChangeListener = _addPlaybackRateChangeListener;

    var _addVideoDrawListener = function(listener) {
      videoset.addEventListener('videoset-draw', listener);
    };
    this.addVideoDrawListener = _addVideoDrawListener;

    var _removeVideoDrawListener = function(listener) {
      videoset.removeEventListener('videoset-draw', listener);
    };
    this.removeVideoDrawListener = _removeVideoDrawListener;

    var _addDatasetLoadedListener = function(listener) {
      datasetLoadedListeners.push(listener);
    };
    this.addDatasetLoadedListener = _addDatasetLoadedListener;

    var _removeDatasetLoadedListener = function(listener) {
      for (var i = 0; i < datasetLoadedListeners.length; i++) {
        if (datasetLoadedListeners[i] == listener[0]) {
          datasetLoadedListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeDatasetLoadedListener = _removeDatasetLoadedListener;

    var _getProjection = function(desiredProjectionType) {
      projectionType = typeof (desiredProjectionType) != 'undefined' ? desiredProjectionType : "mercator";
      if (projectionType == "mercator") {
        var projectionBounds = tmJSON['projection-bounds'];
        return new org.gigapan.timelapse.MercatorProjection(projectionBounds.west, projectionBounds.north, projectionBounds.east, projectionBounds.south, panoWidth, panoHeight);
      }
    };
    this.getProjection = _getProjection;

    var getProjectionType = function() {
      return projectionType;
    };
    this.getProjectionType = getProjectionType;

    var getViewStrAsProjection = function() {
      var latlng = _getProjection().pointToLatlng(view);
      return Math.round(1e5 * latlng.lat) / 1e5 + "," + Math.round(1e5 * latlng.lng) / 1e5 + "," + Math.round(1e3 * Math.log(view.scale / panoView.scale) / Math.log(2)) / 1e3 + "," + "latLng";
    };

    var getViewStrAsPoints = function(desiredView) {
      desiredView = ( typeof (desiredView) == "undefined") ? view : desiredView;
      return Math.round(1e5 * desiredView.x) / 1e5 + "," + Math.round(1e5 * desiredView.y) / 1e5 + "," + Math.round(1e3 * Math.log(desiredView.scale / panoView.scale) / Math.log(2)) / 1e3 + "," + "pts";
    };

    var _getViewStr = function(desiredView) {
      // TODO: let the user choose lat/lng or points for a dataset with projection info
      if (typeof (tmJSON['projection-bounds']) != 'undefined') {
        return getViewStrAsProjection();
      } else {
        return getViewStrAsPoints(desiredView);
      }
    };
    this.getViewStr = _getViewStr;

    var _setNewView = function(newView, doWarp, doPlay, callBack) {
      if (typeof (newView) === 'undefined' || newView == null)
        return;

      newView = _normalizeView(newView);
      if (newView.scale > _getMaxScale()) {
        newView.scale = _getMaxScale();
      }

      var defaultEndViewCallback = function() {
        isMovingToWaypoint = false;
        _removeViewEndChangeListener(this);
        parabolicMotionController = null;
        if (doPlay)
          _play();
        if (typeof (callBack) === "function")
          callBack();
      };

      if (doWarp) {
        _addViewEndChangeListener(defaultEndViewCallback);
        _warpTo(newView);
      } else {
        // If we are really close to our current location, just slide there rather than do a very short parabolic curve.
        if (newView.scale && newView.scale.toFixed(17) == view.scale.toFixed(17) && (Math.abs(newView.x - view.x) <= 1000 && Math.abs(newView.y - view.y) <= 1000)) {
          _addViewEndChangeListener(defaultEndViewCallback);
          setTargetView(newView);
        } else {
          if (!parabolicMotionController) {
            parabolicMotionController = new parabolicMotionObj.MotionController({
              animationFPS: 1000 / animateRate,
              pathSpeed: parabolicMotionPathSpeed,
              animateCallback: function(pt) {
                _warpTo(parabolicMotionObj.pixelPointToView(viewportWidth, viewportHeight, pt));
              },
              onCompleteCallback: defaultEndViewCallback
            });
          }
          var a = parabolicMotionObj.viewToPixelPoint(viewportWidth, viewportHeight, view);
          var b = parabolicMotionObj.viewToPixelPoint(viewportWidth, viewportHeight, newView);
          var path = org.gigapan.timelapse.parabolicMotion.computeParabolicPath(a, b);
          parabolicMotionController.moveAlongPath(path);
          isMovingToWaypoint = true;
        }
      }
    };
    this.setNewView = _setNewView;

    var _normalizeView = function(newView) {
      if (!newView)
        return null;

      if (newView.center) {// Center view
        var newCenterView = newView.center;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && UTIL.isNumber(newCenterView.lat) && UTIL.isNumber(newCenterView.lng) && UTIL.isNumber(newView.zoom)) {
          newView = latLngCenterViewToPixelCenter(newView);
        } else if (UTIL.isNumber(newCenterView.x) && UTIL.isNumber(newCenterView.y) && UTIL.isNumber(newView.zoom)) {
          newView = pixelCenterViewToPixelCenter(newView);
        } else {
          newView = view;
        }
      } else if (newView.bbox) {// Bounding box view
        var newViewBbox = newView.bbox;
        var newViewBboxNE = newViewBbox.ne;
        var newViewBboxSW = newViewBbox.sw;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && newViewBboxNE && newViewBboxSW && UTIL.isNumber(newViewBboxNE.lat) && UTIL.isNumber(newViewBboxNE.lng) && UTIL.isNumber(newViewBboxSW.lat) && UTIL.isNumber(newViewBboxSW.lng)) {
          newView = latLngBoundingBoxToPixelCenter(newView);
        } else if (UTIL.isNumber(newViewBbox.xmin) && UTIL.isNumber(newViewBbox.xmax) && UTIL.isNumber(newViewBbox.ymin) && UTIL.isNumber(newViewBbox.ymax)) {
          newView = pixelBoundingBoxToPixelCenter(newView);
        } else {
          newView = view;
        }
      }
      return newView;
    };
    this.normalizeView = _normalizeView;

    var getShareView = function(sharedTimestamp, desiredView) {
      sharedTimestamp = sharedTimestamp || thisObj.getCurrentTime().toFixed(2);
      var shareStr = '#v=' + _getViewStr(desiredView) + '&t=' + sharedTimestamp;
      if (datasetType == "modis" && customUI.getLocker() != "none")
        shareStr += '&l=' + customUI.getLocker();
      if (datasetType == "breathecam")
        shareStr += '&d=' + settings["url"].match(/\d\d\d\d-\d\d-\d\d/) + "&s=" + tmJSON['id'];
      return shareStr;
    };
    this.getShareView = getShareView;

    // Extract a safe view from either a view object (e.g. {center:{x:val, y:val}, zoom:val}) or
    // from an array of strings (i.e. a share URL, such as #v=44.96185,59.06233,4.5,latLng&t=0.10,
    // that has been unpacked).
    var unsafeViewToView = function(unsafe_viewParam) {
      var view = null;

      if (!unsafe_viewParam)
        return null;

      // If we have a view object and not an array of strings (i.e. an unpacked share URL) then we need to unpack
      // the view object into an array of strings so that it can be properly sanitized further down.
      if (unsafe_viewParam.center || unsafe_viewParam.bbox) {
        var tmpViewParam = [];
        if (unsafe_viewParam.center) {
          var isLatLng = false;
          var centerView = unsafe_viewParam.center;
          for (var key in centerView) {
            tmpViewParam.push(centerView[key]);
            if (key == "lat")
              isLatLng = true;
          }
          tmpViewParam.push(unsafe_viewParam.zoom);
          isLatLng ? tmpViewParam.push("latLng") : tmpViewParam.push("pts");
          unsafe_viewParam = tmpViewParam;
        } else if (unsafe_viewParam.bbox) {
          var isLatLng = false;
          var bboxView = unsafe_viewParam.bbox;
          for (var key in bboxView) {
            if (key == "ne" || key == "sw") {
              isLatLng = true;
              for (var innerKey in bboxView[key])
                tmpViewParam.push(bboxView[key][innerKey]);
            } else {
              tmpViewParam.push(bboxView[key]);
            }
          }
          isLatLng ? tmpViewParam.push("latLng") : tmpViewParam.push("pts");
          unsafe_viewParam = tmpViewParam;
        }
      }

      // If we still have a share URL (e.g. #v=44.96185,59.06233,4.5,latLng&t=0.10)
      // that has not been unpacked into an array of strings, do so now.
      if (typeof (unsafe_viewParam) === "string") {
        unsafe_viewParam = unsafe_viewParam.split(",");
      }

      if (unsafe_viewParam.indexOf("latLng") != -1) {
        if (unsafe_viewParam.length == 4)
          view = {
            center: {
              "lat": parseFloat(unsafe_viewParam[0]),
              "lng": parseFloat(unsafe_viewParam[1])
            },
            "zoom": parseFloat(unsafe_viewParam[2])
          };
        else if (unsafe_viewParam.length == 5)
          view = {
            bbox: {
              "ne": {
                "lat": parseFloat(unsafe_viewParam[0]),
                "lng": parseFloat(unsafe_viewParam[1])
              },
              "sw": {
                "lat": parseFloat(unsafe_viewParam[2]),
                "lng": parseFloat(unsafe_viewParam[3])
              }
            }
          };
      } else {// Assume points if the user did not specify latLng. Also allow for the omission of 'pts' param for backwards compatibility
        if ((unsafe_viewParam.indexOf("pts") == -1 && unsafe_viewParam.length == 3) || unsafe_viewParam.length == 4)
          view = {
            center: {
              "x": parseFloat(unsafe_viewParam[0]),
              "y": parseFloat(unsafe_viewParam[1])
            },
            "zoom": parseFloat(unsafe_viewParam[2])
          };
        else if ((unsafe_viewParam.indexOf("pts") == -1 && unsafe_viewParam.length == 4) || unsafe_viewParam.length == 5)
          view = {
            bbox: {
              "xmin": parseFloat(unsafe_viewParam[0]),
              "xmax": parseFloat(unsafe_viewParam[1]),
              "ymin": parseFloat(unsafe_viewParam[2]),
              "ymax": parseFloat(unsafe_viewParam[3])
            }
          };
      }
      return view;
    };
    this.unsafeViewToView = unsafeViewToView;

    ///////////////////////////
    // Timelapse video control
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.getThumbnailOfCurrentView = function(width, height) {
      var snaplapse = thisObj.getSnaplapse();
      if (snaplapse) {
        var snaplapseViewer = snaplapse.getSnaplapseViewer();
        if (!snaplapseViewer)
          return null;
        if (!width)
          width = 126;
        if (!height)
          height = 73;
        return snaplapseViewer.generateThumbnailURL(thumbnailServerRootTileUrl, thisObj.getBoundingBoxForCurrentView(), width, height, thisObj.getCurrentTime().toFixed(2));
      }
    };

    var _isPaused = function() {
      return videoset.isPaused();
    };
    this.isPaused = _isPaused;

    var _pause = function() {
      window.clearTimeout(customPlaybackTimeout);
      window.clearTimeout(loopStartTimeoutId);
      window.clearTimeout(loopEndTimeoutId);
      //thisObj.setPlaybackRate(originalPlaybackRate);
      videoset.pause();

      // Pano video is used for the timewarp map in editor
      if (panoVideo) {
        panoVideo.pause();
        // Rather than writing a sync function,
        // we naively resync when the video is paused
        if (panoVideo.currentTime != leader + videoset.getCurrentTime()) {
          seek_panoVideo(videoset.getCurrentTime());
        }
      }
    };
    this.pause = _pause;

    var _seek = function(t) {
      // In IE, seeking to <= 50% of the first frame causes flickering from that point forward
      var minIESeekTime = (1 / _getFps()) * 0.5;
      var seekTime = Math.min(Math.max(0, t), timelapseDurationInSeconds);
      if (isIE && seekTime < minIESeekTime)
        seekTime = minIESeekTime;
      videoset.seek(seekTime);
      seek_panoVideo(seekTime);
    };
    this.seek = _seek;

    var seekToFrame = function(frameIdx) {
      if (frameIdx < 0 || frameIdx > frames - 1)
        return;
      var seekTime = (frameIdx + timePadding) / _getFps();
      _seek(seekTime);
      seek_panoVideo(seekTime);
    };
    this.seekToFrame = seekToFrame;

    var _play = function() {
      updateCustomPlayback();
      videoset.play();

      // Pano video is used for the timewarp map in editor
      if (panoVideo && defaultUI.getMode() != "player" && !fullScreen && enablePanoVideo) {
        // Rather than writing a sync function,
        // we naively resync when the video is played
        if (panoVideo.currentTime != leader + videoset.getCurrentTime()) {
          seek_panoVideo(videoset.getCurrentTime());
        }
        panoVideo.play();
      }
    };
    this.play = _play;

    // Pano video is used for the timewarp map in editor
    var seek_panoVideo = function(t) {
      if (panoVideo && enablePanoVideo && !panoVideo.seeking && defaultUI.getMode() != "player" && !fullScreen && panoVideo.readyState >= 2) {
        panoVideo.currentTime = leader + t;
      }
    };
    this.seek_panoVideo = seek_panoVideo;

    this.setPanoVideoEnableStatus = function(status) {
      enablePanoVideo = status;
      if (status == false)
        panoVideo.pause();
    };

    // The function is used for pausing the video for some duration
    // and optionally doing something afterwards
    var waitFor = function(seconds, callBack) {
      // True means do not save the PlaybackRate
      thisObj.setPlaybackRate(0, true);
      return setTimeout(function() {
        if (callBack)
          callBack();
        thisObj.setPlaybackRate(originalPlaybackRate);
      }, seconds * 1000);
    };
    this.waitFor = waitFor;

    this.restorePlaybackRate = function() {
      thisObj.setPlaybackRate(originalPlaybackRate);
    };

    this.setPlaybackRate = function(rate, preserveOriginalRate, skipUpdateUI) {
      if (!preserveOriginalRate)
        originalPlaybackRate = rate;
      videoset.setPlaybackRate(rate);

      // Pano video is used for the timewarp map in editor
      // TODO: This should probably be done through a listener
      if (panoVideo && defaultUI.getMode() != "player" && !fullScreen) {
        panoVideo.playbackRate = rate;
      }

      for (var i = 0; i < playbackRateChangeListeners.length; i++)
        playbackRateChangeListeners[i](rate, skipUpdateUI);
    };

    this.toggleMainControls = function() {
      defaultUI.toggleMainControls();
    };

    this.getPlaybackRate = function() {
      return videoset.getPlaybackRate();
    };

    this.getVideoPosition = function() {
      return videoset.getVideoPosition();
    };

    this.getDuration = function() {
      return timelapseDurationInSeconds;
    };

    var updateCustomPlayback = function() {
      // Startup custom playback stuff if possible
      if (loopPlayback && customLoopPlaybackRates) {
        var nextSegment = null;
        // Next segment with custom playback
        for (var i in customLoopPlaybackRates) {
          var rateObj = customLoopPlaybackRates[i];
          if (timelapseCurrentTimeInSeconds < rateObj.end) {
            if (timelapseCurrentTimeInSeconds >= rateObj.start) {
              nextSegment = rateObj;
              break;
            } else if (nextSegment === null || rateObj.start < nextSegment.start) {
              nextSegment = rateObj;
            }
          }
        }
        // Make sure playback rate matches selection
        if (nextSegment === null) {
          thisObj.setPlaybackRate(originalPlaybackRate, true);
        } else {
          var difference = nextSegment.start - timelapseCurrentTimeInSeconds;
          if (difference > 0)
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          else {
            thisObj.setPlaybackRate(nextSegment.rate, true);
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          }
        }
      }
    };

    this.setStatusLoggingEnabled = function(enable) {
      videoset.setStatusLoggingEnabled(enable);
    };

    this.setNativeVideoControlsEnabled = function(enable) {
      videoset.setNativeVideoControlsEnabled(enable);
    };

    var _getNumFrames = function() {
      return frames;
    };
    this.getNumFrames = _getNumFrames;

    var _getFps = function() {
      return videoset.getFps();
    };
    this.getFps = _getFps;

    this.getVideoWidth = function() {
      return videoWidth;
    };

    this.getVideoHeight = function() {
      return videoHeight;
    };

    this.getPanoWidth = function() {
      return panoWidth;
    };

    this.getPanoHeight = function() {
      return panoHeight;
    };

    this.getViewportWidth = function() {
      return viewportWidth;
    };

    this.getViewportHeight = function() {
      return viewportHeight;
    };

    this.getMetadata = function() {
      return metadata;
    };

    var _addTimeChangeListener = function(listener) {
      videoset.addEventListener('sync', listener);
    };
    this.addTimeChangeListener = _addTimeChangeListener;

    var _removeTimeChangeListener = function(listener) {
      videoset.removeEventListener('sync', listener);
    };
    this.removeTimeChangeListener = _removeTimeChangeListener;

    this.getCurrentTime = function() {
      return videoset.getCurrentTime();
    };

    this.setScale = function(val) {
      targetView.scale = val;
      setTargetView(targetView);
    };

    this.setScaleFromSlider = function(val) {
      targetView.scale = _zoomSliderToViewScale(val);
      setTargetView(targetView);
    };

    var _getMinScale = function() {
      return panoView.scale * 0.5;
    };
    this.getMinScale = _getMinScale;

    var _getMaxScale = function() {
      var extraScale = 1;
      if (levelThreshold < 0) {
        // If levelThreshold is less than 0, we'll show a video that's always
        // artificially lower resolution than normal.  Allow additional zoom.
        // levelThreshold = 0 shows videos from 100% to 200% scale
        // levelThreshold = -1 shows videos from 200% to 400% scale
        // So leave levelThreshold = 0 unmodified, and allow 2x extra scale for levelThreshold = -1
        extraScale = Math.pow(2, -levelThreshold);
      }
      if (tmJSON['projection-bounds'])
        return 1.25 * extraScale;
      else
        return 2 * extraScale;
    };
    this.getMaxScale = _getMaxScale;

    var _viewScaleToZoomSlider = function(value) {
      var tmpValue = Math.sqrt((value - _getMinScale()) / (_getMaxScale() - _getMinScale()));
      return (1 / (Math.log(2))) * (Math.log(tmpValue + 1));
    };
    this.viewScaleToZoomSlider = _viewScaleToZoomSlider;

    var _zoomSliderToViewScale = function(value) {
      return _getMaxScale() * (Math.pow((Math.pow(2, value) - 1), 2)) - Math.pow(4, value) * _getMinScale() + 2 * Math.pow(2, value) * _getMinScale();
    };
    this.zoomSliderToViewScale = _zoomSliderToViewScale;

    var _getDatasetJSON = function() {
      return datasetJSON;
    };
    this.getDatasetJSON = _getDatasetJSON;

    var _getTmJSON = function() {
      return tmJSON;
    };
    this.getTmJSON = _getTmJSON;

    var _fullScreen = function() {
      var viewerDiv = $('#' + viewerDivId)[0];
      if (browserSupportsFullScreen) {
        if (fullScreen) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
          }
        } else {
          if (viewerDiv.requestFullscreen) {
            viewerDiv.requestFullscreen();
          } else if (viewerDiv.msRequestFullscreen) {
            viewerDiv.msRequestFullscreen();
          } else if (viewerDiv.mozRequestFullScreen) {
            viewerDiv.mozRequestFullScreen();
          } else if (viewerDiv.webkitRequestFullScreen) {
            viewerDiv.webkitRequestFullScreen();
          }
        }
      } else {
        // Fallback to 'fill' screen
        var $timeMachineDiv = $("#" + timeMachineDivId);
        if (fullScreen) {
          $timeMachineDiv.css({
            width: preFullScreenProperties.width,
            height: preFullScreenProperties.height,
            zIndex: preFullScreenProperties.zIndex
          });
        } else {
          preFullScreenProperties = {
            width: "auto",
            height: $timeMachineDiv.height(),
            zIndex: $timeMachineDiv.css("zIndex")
          };
          $timeMachineDiv.css({
            width: "100%",
            height: "100%",
            zIndex: 9001
          });
        }
        resizeViewer();
        thisObj.changeFullScreenState();
      }
    };
    this.fullScreen = _fullScreen;

    var initializeUI = function() {
      var $timeMachineDiv = $("#" + timeMachineDivId);
      var $viewerDiv = $("#" + viewerDivId);

      var originalVideoWidth = datasetJSON["video_width"] - datasetJSON["tile_width"];
      var originalVideoHeight = datasetJSON["video_height"] - datasetJSON["tile_height"];

      var viewerBottomPx = 0;
      if (editorEnabled && UTIL.getSharedDataType() != "presentation")
        viewerBottomPx = 210;
      else {
        if (presentationSliderEnabled)
          viewerBottomPx = 100;
      }

      var userDefinedtimeMachineDivWidth = UTIL.getElementStyle("#" + timeMachineDivId, "width");
      var userDefinedtimeMachineDivHeight = UTIL.getElementStyle("#" + timeMachineDivId, "height");

      // If the user does not specify width and height for the div containing the Time Machine,
      // then default to the dimensions of the dataset specified in its json.
      if ($timeMachineDiv.css("position") == "static" || userDefinedtimeMachineDivWidth == null || userDefinedtimeMachineDivHeight == null) {
        $timeMachineDiv.css({
          "position": "absolute",
          "top": "0px",
          "left": "0px",
          "width": userDefinedtimeMachineDivWidth ? userDefinedtimeMachineDivWidth : originalVideoWidth + "px",
          "height": userDefinedtimeMachineDivHeight ? userDefinedtimeMachineDivHeight : (originalVideoHeight + viewerBottomPx) + "px"
        });
      }

      $viewerDiv.css({
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": viewerBottomPx + "px",
        "width": "auto",
        "height": "auto"
      });

      resizeViewer();

      window.onresize = onresize;
    };

    var onresize = function() {
      var $viewerDiv = $("#" + viewerDivId);
      if (viewportWidth == $viewerDiv.width() && viewportHeight == $viewerDiv.height())
        return;
      resizeViewer();
      // TODO implement a resize listener and put this in the snaplapseViewer class
      if (snaplapse)
        snaplapse.getSnaplapseViewer().resizeUI();
      // TODO implement a resize listener and put this in the snaplapseViewer class
      if (snaplapseForPresentationSlider)
        snaplapseForPresentationSlider.getSnaplapseViewer().resizeUI();
      // TODO implement a resize listener and put this in the scaleBar class
      if (scaleBar)
        scaleBar.updateCachedVideoSize();
      // TODO implement a resize listener and put this in the visualizer class
      if (visualizer && defaultUI)
        visualizer.setMode(defaultUI.getMode(), false);
      // TODO implement a resize listener and put this in the annotator class
      if (annotator)
        annotator.resizeUI();
      // TODO implement a resize listener and put this in the changeDetectionTool class
      if (changeDetectionTool)
        changeDetectionTool.resizeUI();
      updateLocationContextUI();
      // Auto-center any viewer jQuery dialogs so they do not go off screen.
      $("#" + viewerDivId + " .ui-dialog-content").dialog("option", "position", {
        my: "center",
        at: "center",
        of: window
      });
      // Run listeners
      for (var i = 0; i < resizeListeners.length; i++)
        resizeListeners[i](viewportWidth, viewportHeight);
    };
    this.onresize = onresize;

    var setInitialView = function() {
      if (initialView) {
        view = _normalizeView(initialView);
      } else if (loadSharedViewFromUnsafeURL(UTIL.getUnsafeHashString())) {
        // loadSharedViewFromUnsafeURL() sets our view (if valid) and returns a boolean
      } else {
        view = null;
      }
    };

    var resizeViewer = function() {
      var $viewerDiv = $("#" + viewerDivId);
      viewportWidth = $viewerDiv.width();
      viewportHeight = $viewerDiv.height();

      // TODO: scale might not be correct when we unhide viewport
      if ($( "#" + viewerDivId + ":visible").length == 0) return;

      var originalVideoStretchRatio = videoStretchRatio;
      var originalVideoWidth = datasetJSON["video_width"] - datasetJSON["tile_width"];
      var originalVideoHeight = datasetJSON["video_height"] - datasetJSON["tile_height"];

      // If the video is too small, we need to stretch the video to fit the viewport,
      // so users don't see black bars around the viewport
      videoStretchRatio = Math.max(viewportWidth / originalVideoWidth, viewportHeight / originalVideoHeight);
      levelThreshold = defaultLevelThreshold - log2(videoStretchRatio);
      var scaleRatio = videoStretchRatio / originalVideoStretchRatio;

      // Update canvas size
      $(canvas).attr({
        width: viewportWidth,
        height: viewportHeight
      });
      $(blackFrameDetectionCanvas).attr({
        width: viewportWidth,
        height: viewportHeight
      });

      // Stretching the video affects the home view,
      // set home view to undefined so that it gets recomputed
      computeHomeView();

      // Set to the correct view
      if (view) {
        view.scale *= scaleRatio;
      } else {
        if (!didFirstTimeOnLoad)
          setInitialView();
        // If we still do not have a view at this point, set to home view
        view = view || $.extend({}, homeView);
      }

      _warpTo(view);
    };

    var _computeMotion = function(start, end, timeRatio) {
      var s0 = start.xmax - start.xmin;
      var s1 = end.xmax - end.xmin;
      var s1_over_s0 = s1 / s0;

      // Compute f(t), but check whether we're merely panning, in which case we shouldn't attempt to do the
      // special scaling (because it'll blow up with f(1) being NaN since we'd be dividing zero by zero).
      var f_of_t = (Math.abs(s1_over_s0 - 1) < 0.000001) ? timeRatio : (Math.pow(s1_over_s0, timeRatio) - 1) / (s1_over_s0 - 1);

      var boundsXminOffset = (end.xmin - start.xmin ) * f_of_t;
      var boundsYminOffset = (end.ymin - start.ymin ) * f_of_t;
      var boundsXmaxOffset = (end.xmax - start.xmax ) * f_of_t;
      var boundsYmaxOffset = (end.ymax - start.ymax ) * f_of_t;

      var bounds = {};
      bounds.xmin = start.xmin + boundsXminOffset;
      bounds.ymin = start.ymin + boundsYminOffset;
      bounds.xmax = start.xmax + boundsXmaxOffset;
      bounds.ymax = start.ymax + boundsYmaxOffset;

      return bounds;
    };
    this.computeMotion = _computeMotion;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    // Handle any hash variables related to time machines
    var handleHashChange = function() {
      var unsafeHashString = UTIL.getUnsafeHashString();

      // Share views
      loadSharedViewFromUnsafeURL(unsafeHashString);
      // Tours and presentations
      loadSharedDataFromUnsafeURL(unsafeHashString);
    };

    var loadSharedViewFromUnsafeURL = function(unsafe_fullURL) {
      var unsafe_matchURL = unsafe_fullURL.match(/#(.+)/);
      if (unsafe_matchURL) {
        var unsafeHashObj = UTIL.unpackVars(unsafe_matchURL[1]);
        var newView = getViewFromHash(unsafeHashObj);
        var newTime = getTimeFromHash(unsafeHashObj);

        if (newView) {
          if (didFirstTimeOnLoad) {
            _setNewView(newView, true);
          } else {
            view = _normalizeView(newView);
          }
        }
        if (newTime) {
          if (didFirstTimeOnLoad) {
            _seek(newTime);
          } else {
            initialTime = newTime;
          }
        }
        return true;
      } else {
        return false;
      }
    };
    this.loadSharedViewFromUnsafeURL = loadSharedViewFromUnsafeURL;

    // Gets safe view values (Object) from an unsafe object containing key-value pairs from the URL hash.
    var getViewFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.v) {
        var newView = unsafeViewToView(unsafeHashObj.v.split(","));
        return newView;
      }
      return null;
    };

    // Gets a safe time value (Float) from an unsafe object containing key-value pairs from the URL hash.
    // TODO: what if time is 0?
    var getTimeFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.t) {
        var newTime = parseFloat(unsafeHashObj.t);
        return newTime;
      }
      return null;
    };

    // Gets safe tour JSON from an unsafe object containing key-value pairs from the URL hash.
    // The JSON returned is safe because calls to urlStringToJSON go to carefully-designed methods that use strict encoders
    // (and naming conventions to mark strings not strictly sanitized) to ensure the input is safe.
    var getTourFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.tour) {
        if (snaplapseForSharedTour) {
          var tourJSON = snaplapseForSharedTour.urlStringToJSON(unsafeHashObj.tour);
          return tourJSON;
        }
      }
      return null;
    };

    // Gets safe presentation JSON from an unsafe object containing key-value pairs from the URL hash.
    // The JSON returned is safe because calls to urlStringToJSON go to carefully-designed methods that use strict encoders
    // (and naming conventions to mark strings not strictly sanitized) to ensure the input is safe.
    var getPresentationFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.presentation) {
        if (snaplapseForPresentationSlider) {
          var presentationJSON = snaplapseForPresentationSlider.urlStringToJSON(unsafeHashObj.presentation);
          return presentationJSON;
        }
      }
      return null;
    };

    var handleMousedownEvent = function(event) {
      if (event.which != 1 || (annotator && (event.metaKey || event.ctrlKey || event.altKey || annotator.getCanMoveAnnotation())))
        return;
      var mouseIsDown = true;
      var lastEvent;
      if (!event.pageX && !event.pageY) {
        lastEvent = $.extend({}, event);
        lastEvent.pageX = event.clientX;
        lastEvent.pageY = event.clientY;
      } else {
        lastEvent = event;
      }
      var saveMouseMove = document.onmousemove;
      var saveMouseUp = document.onmouseup;
      $(videoDiv).removeClass("openHand closedHand").addClass('closedHand');
      stopParabolicMotion();
      document.onmousemove = function(event) {
        if (mouseIsDown) {
          //if (videoset.isStalled()) return;
          // This is for the tile content holder
          if (event.shiftKey) {
            targetView.x += (lastEvent.pageX - event.pageX) * 0.2 / view.scale;
            targetView.y += (lastEvent.pageY - event.pageY) * 0.2 / view.scale;
          } else {
            targetView.x += (lastEvent.pageX - event.pageX) / view.scale;
            targetView.y += (lastEvent.pageY - event.pageY) / view.scale;
          }
          setTargetView(targetView);
          lastEvent = event;
        }
        return false;
      };
      // Make sure we release mousedown upon exiting our viewport if we are inside an iframe
      $("body").one("mouseleave", function(event) {
        if (window && (window.self !== window.top)) {
          mouseIsDown = false;
          $(videoDiv).removeClass("openHand closedHand");
          document.onmousemove = saveMouseMove;
          document.onmouseup = saveMouseUp;
        }
      });
      // Release mousedown upon mouseup
      $(document).one("mouseup", function(event) {
        mouseIsDown = false;
        $(videoDiv).removeClass("openHand closedHand");
        document.onmousemove = saveMouseMove;
        document.onmouseup = saveMouseUp;
      });
      return false;
    };
    this.handleMousedownEvent = handleMousedownEvent;

    var zoomAbout = function(zoom, x, y, isFromContextMap) {
      var newScale = limitScale(targetView.scale * zoom);
      var actualZoom = newScale / targetView.scale;
      // We want to zoom to the center of the current view if we zoom from the context map
      if (isFromContextMap == undefined) {
        targetView.x += 1 * (1 - 1 / actualZoom) * (x - $(videoDiv).offset().left - viewportWidth * 0.5) / targetView.scale;
        targetView.y += 1 * (1 - 1 / actualZoom) * (y - $(videoDiv).offset().top - viewportHeight * 0.5) / targetView.scale;
      }
      targetView.scale = newScale;
      setTargetView(targetView);
    };
    this.zoomAbout = zoomAbout;

    var handleDoubleClickEvent = function(event, isFromContextMap) {
      var eventCoords = {};
      if (!event.pageX && !event.pageY) {
        eventCoords.pageX = event.clientX;
        eventCoords.pageY = event.clientY;
      } else {
        eventCoords.pageX = event.pageX;
        eventCoords.pageY = event.pageY;
      }
      zoomAbout(2.0, eventCoords.pageX, eventCoords.pageY, isFromContextMap);
    };

    var limitScale = function(scale) {
      return Math.max(_getMinScale(), Math.min(_getMaxScale(), scale));
    };
    this.limitScale = limitScale;

    var view2string = function(view) {
      return "[view x:" + view.x + " y:" + view.y + " scale:" + view.scale + "]";
    };

    var setTargetView = function(newView, offset) {
      if (newView) {
        var tempView = {};
        tempView.scale = limitScale(newView.scale);
        if (isHyperwall) {
          targetView.x = newView.x;
          targetView.y = newView.y;
        } else {
          tempView.x = Math.max(0, Math.min(panoWidth, newView.x));
          tempView.y = Math.max(0, Math.min(panoHeight, newView.y));
          targetView.x = tempView.x;
          targetView.y = tempView.y;
        }
        targetView.scale = tempView.scale;
      } else {
        // Rather than specifying a new view, it is easier to just specify the offset for translating
        if (offset) {
          targetView.x += offset.x / view.scale;
          targetView.y += offset.y / view.scale;
        }
      }

      // ~35Hz or 12.5Hz
      if (animateInterval == null) {
        animateInterval = setInterval(function() {
          animate();
        }, animateRate);
        lastAnimationTime = UTIL.getCurrentTimeInSecs();
      }

      refresh();

      if (newView.scale != view.scale) {
        for (var i = 0; i < zoomChangeListeners.length; i++)
          zoomChangeListeners[i](targetView);
      }

      for (var i = 0; i < targetViewChangeListeners.length; i++)
        targetViewChangeListeners[i](targetView);
    };
    this.setTargetView = setTargetView;

    var point2mag = function(point) {
      return Math.sqrt(point.x * point.x + point.y * point.y);
    };

    var point2sub = function(a, b) {
      return {
        x: a.x - b.x,
        y: a.y - b.y
      };
    };

    var point2scale = function(point, scale) {
      return {
        x: point.x * scale,
        y: point.y * scale
      };
    };

    var log2 = function(x) {
      return Math.log(x) / Math.log(2);
    };

    var exp2 = function(x) {
      return Math.pow(2, x);
    };

    var checkForJoystick = function() {
      if (!isChrome) {
        return false;
      }

      var gamepad = navigator.webkitGetGamepads()[0];
      var translationSpeedConstant = 30;
      var joystickError = 0.15;
      var scalingConstant = 0.94;
      var secondaryFunctionsEnabled = true;

      if (gamepad == null) {
        return false;
      }

      // Horizontal Motion
      if (Math.abs(gamepad.axes[0]) > joystickError) {
        view.x = Math.max(0, Math.min(panoWidth, view.x + (gamepad.axes[0] * translationSpeedConstant) / view.scale));
        targetView = view;
      }

      // Vertical Motion
      if (Math.abs(gamepad.axes[1]) > joystickError) {
        view.y = Math.max(0, Math.min(panoHeight, view.y + (gamepad.axes[1] * translationSpeedConstant) / view.scale));
        targetView = view;
      }

      // Zooming in/out
      if (gamepad.axes[3] > joystickError) {
        view.scale = limitScale(view.scale * (scalingConstant + (1 - scalingConstant) * (1 - gamepad.axes[3])));
        targetView = view;
      } else if (gamepad.axes[3] < -joystickError) {
        view.scale = limitScale(view.scale / (scalingConstant + (1 - scalingConstant) * (1 + gamepad.axes[3])));
        targetView = view;
      }
      refresh();

      // Time Control
      if (secondaryFunctionsEnabled) {
        // Seek the video
        var seekFPS = 5.0;
        if (gamepad.buttons[7] && !gamepad.buttons[6]) {
          if (joystickTimers[0] > 1.0 / seekFPS) {
            thisObj.handlePlayPause();
            videoset.seek(videoset.getCurrentTime() + (1.0 / _getFps()));
            joystickTimers[0] = 0.0;
          }
          joystickTimers[0] += 0.040;
        }
        if (gamepad.buttons[6] && !gamepad.buttons[7]) {
          if (joystickTimers[1] > 1.0 / seekFPS) {
            thisObj.handlePlayPause();
            videoset.seek(videoset.getCurrentTime() - (1.0 / _getFps()));
            joystickTimers[1] = 0.0;
          }
          joystickTimers[1] += 0.040;
        }

        // Play/Pause Video
        var buttonNumberForPlay = 0;
        if (gamepad.buttons[buttonNumberForPlay] && !isJoystickButtonPressed[buttonNumberForPlay]) {
          thisObj.handlePlayPause();
          isJoystickButtonPressed[buttonNumberForPlay] = true;
        } else if (!gamepad.buttons[buttonNumberForPlay] && isJoystickButtonPressed[buttonNumberForPlay]) {
          isJoystickButtonPressed[buttonNumberForPlay] = false;
        }

        // Set FullScreen
        var buttonNumberForFullScreen = 1;
        if (gamepad.buttons[buttonNumberForFullScreen] && !isJoystickButtonPressed[buttonNumberForFullScreen]) {
          _fullScreen(!fullScreen);
          isJoystickButtonPressed[buttonNumberForFullScreen] = true;
        } else if (!gamepad.buttons[buttonNumberForFullScreen] && isJoystickButtonPressed[buttonNumberForFullScreen]) {
          isJoystickButtonPressed[buttonNumberForFullScreen] = false;
        }
      }
      return true;
    };

    var animate = function() {
      //var isJoystickWorking = checkForJoystick();

      // Compute deltaT between this animation frame and last
      var now = UTIL.getCurrentTimeInSecs();
      var deltaT = now - lastAnimationTime;
      if (deltaT < 0.001)
        deltaT = 0.001;
      else if (deltaT > 0.2)
        deltaT = 0.2;
      lastAnimationTime = now;
      deltaT = Math.min(0.5, animationFractionPerSecond * deltaT);

      // Animate translation
      var minTranslateSpeed = minTranslateSpeedPixelsPerSecond / view.scale;
      // Convert to pano coords / sec
      var minTranslateDelta = minTranslateSpeed * deltaT;
      var toGoal = point2sub(targetView, view);
      var toGoalMag = point2mag(toGoal);
      var translationDesiredDeltaT = minTranslateDelta / toGoalMag;

      var minZoomSpeed = minZoomSpeedPerSecond;
      var minZoomDelta = minZoomSpeed * deltaT;
      toGoalMag = Math.abs(log2(targetView.scale) - log2(view.scale));
      var zoomDesiredDeltaT = minZoomDelta / toGoalMag;

      var t = Math.min(1, Math.max(deltaT, Math.min(translationDesiredDeltaT, zoomDesiredDeltaT)));
      var i;
      if (t == 1) {
        view.x = targetView.x;
        view.y = targetView.y;
        view.scale = targetView.scale;
        //UTIL.log("animation finished, clearing interval");
        //if (!isJoystickWorking) {
        clearInterval(animateInterval);
        animateInterval = null;
        //}
        // We are done changing the view, run listeners specific to this.
        for (var i = 0; i < viewEndChangeListeners.length; i++)
          viewEndChangeListeners[i](view);
      } else {
        view = pixelBoundingBoxToPixelCenter(_computeMotion(pixelCenterToPixelBoundingBoxView(view).bbox, pixelCenterToPixelBoundingBoxView(targetView).bbox, t));
      }
      refresh();
      // Run listeners as the view changes
      for (var i = 0; i < viewChangeListeners.length; i++)
        viewChangeListeners[i](view);
    };

    //// Views with scale ////

    // Convert {bbox:{xmin, xmax, ymin, ymax}} OR {xmin, xmax, ymin, ymax} to {x, y, scale}
    var pixelBoundingBoxToPixelCenter = function(bbox) {
      if (!bbox)
        return null;

      // If input happens to be of the form {bbox:{xmin, xmax, ymin, ymax}}
      if (typeof (bbox.bbox) !== 'undefined')
        bbox = bbox.bbox;

      var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin), viewportHeight / (bbox.ymax - bbox.ymin));

      return {
        x: 0.5 * (bbox.xmin + bbox.xmax),
        y: 0.5 * (bbox.ymin + bbox.ymax),
        scale: scale
      };
    };
    this.pixelBoundingBoxToPixelCenter = pixelBoundingBoxToPixelCenter;

    // Convert {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}} OR {ne:{lat:val,lng:val},sw:{lat:val,lng:val}} to {x, y, scale}
    var latLngBoundingBoxToPixelCenter = function(bbox) {
      if (!bbox)
        return null;

      // If input happens to be of the form {bbox:{...}}
      if (typeof (bbox.bbox) !== 'undefined')
        bbox = bbox.bbox;

      var projection = _getProjection();
      var newViewBboxNE = bbox.ne;
      var newViewBboxSW = bbox.sw;

      var a = projection.latlngToPoint({
        lat: newViewBboxNE.lat,
        lng: newViewBboxNE.lng
      });
      var b = projection.latlngToPoint({
        lat: newViewBboxSW.lat,
        lng: newViewBboxSW.lng
      });

      var xmax = Math.max(a.x, b.x);
      var xmin = Math.min(a.x, b.x);
      var ymax = Math.max(a.y, b.y);
      var ymin = Math.min(a.y, b.y);

      var scale = Math.min(viewportWidth / (xmax - xmin), viewportHeight / (ymax - ymin));

      return {
        x: 0.5 * (xmin + xmax),
        y: 0.5 * (ymin + ymax),
        scale: scale
      };
    };
    this.latLngBoundingBoxToPixelCenter = latLngBoundingBoxToPixelCenter;

    // Convert {center:{x:val, y:val}, zoom:val} to {x, y, scale}
    var pixelCenterViewToPixelCenter = function(theView) {
      if (!theView)
        return null;

      return {
        x: theView.center.x,
        y: theView.center.y,
        scale: Math.pow(2, theView.zoom) * panoView.scale
      };
    };
    this.pixelCenterViewToPixelCenter = pixelCenterViewToPixelCenter;

    // Convert {center:{lat:val, lng:val}, zoom:val} to {x, y, scale}
    var latLngCenterViewToPixelCenter = function(theView) {
      if (!theView)
        return null;

      var point = _getProjection().latlngToPoint({
        lat: theView.center.lat,
        lng: theView.center.lng
      });
      return {
        x: point.x,
        y: point.y,
        scale: Math.pow(2, theView.zoom) * panoView.scale
      };
    };
    this.latLngCenterViewToPixelCenter = latLngCenterViewToPixelCenter;

    //// Views with zoom ////

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {center:{lat:val, lng:val}, zoom:val}
    var pixelCenterToLatLngCenterView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var projection = _getProjection();
      var latLng = projection.pointToLatlng({
        x: theView.x,
        y: theView.y
      });
      return {
        center: {
          lat: latLng.lat,
          lng: latLng.lng
        },
        zoom: scaleToZoom(theView.scale)
      };
    };
    this.pixelCenterToLatLngCenterView = pixelCenterToLatLngCenterView;

    // Convert pixel bounding box to {center:{lat, lng}, zoom:z}
    var pixelBoundingBoxToLatLngCenterView = function(bbox) {
      if (!bbox)
        return null;

      // bbox will be normalized if it is in the form {bbox:{...}}
      var centerView = pixelBoundingBoxToPixelCenter(bbox);
      var projection = _getProjection();
      var latLng = projection.pointToLatlng({
        x: centerView.x,
        y: centerView.y
      });
      return {
        center: {
          lat: latLng.lat,
          lng: latLng.lng
        },
        zoom: scaleToZoom(centerView.scale)
      };
    };
    this.pixelBoundingBoxToLatLngCenterView = pixelBoundingBoxToLatLngCenterView;

    // Convert {xmin:val, xmax:val, ymin:val, ymax:val} OR {bbox:{xmin:{x:val,y:val},xmax:{x:val,y:val}}} to {center:{x:val, y:val}, zoom:val}
    var pixelBoundingBoxToPixelCenterView = function(bbox) {
      if (!bbox)
        return null;
      if (bbox.bbox)
        bbox = _normalizeView(bbox);

      var pixelFit = pixelBoundingBoxToPixelCenter(bbox);
      return {
        center: {
          x: pixelFit.x,
          y: pixelFit.y
        },
        zoom: scaleToZoom(pixelFit.scale)
      };
    };
    this.pixelBoundingBoxToPixelCenterView = pixelBoundingBoxToPixelCenterView;

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {bbox:{xmin:val,xmax:val,ymin:val,ymax:val}}
    var pixelCenterToPixelBoundingBoxView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var halfWidth = 0.5 * viewportWidth / theView.scale;
      var halfHeight = 0.5 * viewportHeight / theView.scale;
      return {
        bbox: {
          xmin: theView.x - halfWidth,
          xmax: theView.x + halfWidth,
          ymin: theView.y - halfHeight,
          ymax: theView.y + halfHeight
        }
      };
    };
    this.pixelCenterToPixelBoundingBoxView = pixelCenterToPixelBoundingBoxView;

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}}
    var pixelCenterToLatLngBoundingBoxView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var pixelBound = pixelCenterToPixelBoundingBoxView(theView).bbox;
      var projection = _getProjection();
      var min = projection.pointToLatlng({
        x: pixelBound.xmin,
        y: pixelBound.ymin
      });
      var max = projection.pointToLatlng({
        x: pixelBound.xmax,
        y: pixelBound.ymax
      });
      return {
        bbox: {
          ne: min,
          sw: max
        }
      };
    };
    this.pixelCenterToLatLngBoundingBoxView = pixelCenterToLatLngBoundingBoxView;

    // Convert {xmin:val, xmax:val, ymin:val, ymax:val} OR {bbox:{xmin:{x:val,y:val},xmax:{x:val,y:val}}} to {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}}
    var pixelBoundingBoxToLatLngBoundingBoxView = function(bbox) {
      if (!bbox)
        return null;
      return pixelCenterToLatLngBoundingBoxView(pixelBoundingBoxToPixelCenter(bbox));
    };
    this.pixelBoundingBoxToLatLngBoundingBoxView = pixelBoundingBoxToLatLngBoundingBoxView;

    var onPanoLoadSuccessCallback = function(data, desiredView, doWarp) {
      UTIL.log('onPanoLoadSuccessCallback(' + JSON.stringify(data) + ', ' + view + ', ' + ')');
      isSplitVideo = 'frames_per_fragment' in data;
      framesPerFragment = isSplitVideo ? data['frames_per_fragment'] : data['frames'];
      secondsPerFragment = isSplitVideo ? framesPerFragment / data['fps'] : 1 / data['fps'] * (data['frames'] - 1);
      UTIL.log("isSplitVideo=[" + isSplitVideo + "], framesPerFragment=[" + framesPerFragment + "], secondsPerFragment=[" + secondsPerFragment + "]");
      panoWidth = data['width'];
      panoHeight = data['height'];
      tileWidth = data['tile_width'];
      tileHeight = data['tile_height'];
      videoWidth = data['video_width'];
      videoHeight = data['video_height'];
      videoset.setFps(data['fps']);
      var framesToSkipAtStart = (data['frames'] < skippedFramesAtStart) ? 0 : skippedFramesAtStart;
      var framesToSkipAtEnd = (data['frames'] < skippedFramesAtEnd) ? 0 : skippedFramesAtEnd;
      frames = data['frames'] - framesToSkipAtEnd - framesToSkipAtStart;
      videoset.setDuration((1 / data['fps']) * frames);
      videoset.setLeader((data['leader'] + framesToSkipAtStart) / data['fps']);
      videoset.setIsSplitVideo(isSplitVideo);
      videoset.setSecondsPerFragment(secondsPerFragment);
      maxLevel = data['nlevels'] - 1;
      levelInfo = data['level_info'];
      metadata = data;
      timelapseDurationInSeconds = (frames - 0.7) / data['fps'];

      // Set capture time
      if (tmJSON["capture-times"]) {
        tmJSON["capture-times"].splice(tmJSON["capture-times"].length - framesToSkipAtEnd, framesToSkipAtEnd);
        tmJSON["capture-times"].splice(0, framesToSkipAtStart);
        captureTimes = tmJSON["capture-times"];
      } else {
        for (var i = 0; i < frames; i++) {
          captureTimes.push("--");
        }
      }
    };

    var refresh = function() {
      if (viewerType == "webgl" || !isFinite(view.scale))
        return;

      var bestIdx = computeBestVideo(targetView);
      if (bestIdx != currentIdx) {
        currentVideo = addTileidx(bestIdx);
        currentIdx = bestIdx;
      }

      var activeVideos = videoset.getActiveVideos();
      for (var key in activeVideos) {
        var video = activeVideos[key];
        repositionVideo(video);
      }
    };

    var getTimelapseCurrentTimeInSeconds = function() {
      return timelapseCurrentTimeInSeconds;
    };
    this.getTimelapseCurrentTimeInSeconds = getTimelapseCurrentTimeInSeconds;

    var getCurrentFrameNumber = function() {
      return Math.floor(timelapseCurrentTimeInSeconds * _getFps());
    };
    this.getCurrentFrameNumber = getCurrentFrameNumber;

    var frameNumberToTime = function(value) {
      return (value + timePadding) / _getFps();
    };
    this.frameNumberToTime = frameNumberToTime;

    // Update the scale bar and the context map
    // Need to call this when changing the view
    var updateLocationContextUI = function() {
      if (!defaultUI)
        return null;
      if (scaleBar == undefined && contextMap == undefined && defaultUI.getMode() == "player")
        return null;
      if (visualizer || contextMap || scaleBar) {
        // Need to get the projection dynamically when the viewer size changes
        var videoViewer_projection;
        if (tmJSON['projection-bounds'])
          videoViewer_projection = _getProjection();

        if (isHyperwall && !masterView)
          masterView = thisObj.getView();

        var desiredView = isHyperwall ? masterView : view;

        var latlngCenter;
        if (videoViewer_projection) {
          latlngCenter = videoViewer_projection.pointToLatlng(desiredView);
        }
        // Update the scale bar
        if (scaleBar && videoViewer_projection) {
          scaleBar.setScaleBar(desiredView, latlngCenter);
        }
        // Update context maps
        if (visualizer || contextMap) {
          var desiredBound = pixelCenterToPixelBoundingBoxView(desiredView).bbox;
          if (videoViewer_projection && contextMap && enableContextMap == true) {
            contextMap.setMap(desiredBound, latlngCenter);
          }
          if (visualizer) {
            visualizer.setMap(desiredBound);
          }
        }// End of if (visualizer || contextMap)
      }// End of if (visualizer || contextMap || scaleBar)
    };
    this.updateLocationContextUI = updateLocationContextUI;

    var loadSharedDataFromUnsafeURL = function(unsafe_fullURL, playOnLoad) {
      var unsafe_matchURL = unsafe_fullURL.match(/#(.+)/);
      if (unsafe_matchURL) {
        var unsafe_sharedVars = UTIL.unpackVars(unsafe_matchURL[1]);
        // Can be a tour or a presentation slider
        var unsafe_sharedData;
        var snaplapseForSharedData;
        // Find if shared data exists in the URL
        if (unsafe_sharedVars.tour && snaplapseForSharedTour) {
          unsafe_sharedData = unsafe_sharedVars.tour;
          snaplapseForSharedData = snaplapseForSharedTour;
          UTIL.addGoogleAnalyticEvent('window', 'onHashChange', 'url-load-tour');
        } else if (unsafe_sharedVars.presentation && snaplapseForPresentationSlider) {
          unsafe_sharedData = unsafe_sharedVars.presentation;
          snaplapseForSharedData = snaplapseForPresentationSlider;
          UTIL.addGoogleAnalyticEvent('window', 'onHashChange', 'url-load-presentation');
        }
        // Handle the shared data
        if (unsafe_sharedData) {
          var snaplapseViewerForSharedData = snaplapseForSharedData.getSnaplapseViewer();
          if (snaplapseViewerForSharedData) {
            // Sanitize and parse data
            var sharedData = snaplapseForSharedData.urlStringToJSON(unsafe_sharedData);
            if (sharedData) {
              // Tours
              if (playOnLoad && unsafe_sharedVars.tour) {
                var onLoad = function() {
                  snaplapseViewerForSharedData.removeEventListener('snaplapse-loaded', onLoad);
                  $("#" + viewerDivId + " .tourLoadOverlay").css("visibility", "visible");
                  //$("#" + viewerDivId + " .tourLoadOverlayPlay").css("visibility", "visible");
                  snaplapseViewerForSharedData.animateTourOverlayAndPlay(0);
                };
                snaplapseViewerForSharedData.addEventListener('snaplapse-loaded', onLoad);
              }
              // Load the tour or presentation slider, depending upon what is contained in sharedData.
              snaplapseViewerForSharedData.loadNewSnaplapse(sharedData, playOnLoad);
            }
          }
        }
      }
    };
    this.loadSharedDataFromUnsafeURL = loadSharedDataFromUnsafeURL;

    var needFirstAncestor = function(tileidx) {
      //UTIL.log("need ancestor for " + dumpTileidx(tileidx));
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        //UTIL.log("checking " + dumpTileidx(a) + ": present=" + !!tiles[a] + ", ready=" + (tiles[a]?tiles[a].video.ready:"n/a"));
        if (tiles[a] && tiles[a].video.ready) {
          tiles[a].needed = true;
          //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": " + dumpTileidx(a));
          return;
        }
      }
      //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": none found");
    };

    var findFirstNeededAncestor = function(tileidx) {
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        if (tiles[a] && tiles[a].needed)
          return a;
      }
      return false;
    };

    var addTileidx = function(tileidx) {
      var url = getTileidxUrl(tileidx);
      var geom = tileidxGeometry(tileidx);
      //UTIL.log("adding tile " + dumpTileidx(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
      var video = videoset.addVideo(url, geom);
      video.tileidx = tileidx;
      UTIL.log(videoset.videoName(video) + ': Added, with ' + getTileidxName(tileidx) + ' and url ' + url);
      return video;
    };

    var deleteTileidx = function(tileidx) {
      var tile = tiles[tileidx];
      if (!tile) {
        UTIL.error('deleteTileidx(' + dumpTileidx(tileidx) + '): not loaded');
        return;
      }
      UTIL.log("removing tile " + dumpTileidx(tileidx) + " ready=" + tile.video.ready);

      videoset.deleteVideo(tile.video);
      delete tiles[tileidx];
    };

    var getTileidxUrl = function(tileidx) {
      //var shardIndex = (getTileidxRow(tileidx) % 2) * 2 + (getTileidxColumn(tileidx) % 2);
      //var urlPrefix = url.replace("//", "//t" + shardIndex + ".");
      var fragmentSpecifier = isSplitVideo ? "_" + videoset.getFragment(videoset.getCurrentTime()) : "";
      var videoURL = datasetPath + getTileidxLevel(tileidx) + "/" + getTileidxRow(tileidx) + "/" + getTileidxColumn(tileidx) + fragmentSpecifier + mediaType;
      //return ( isIE9 ? videoURL + "?time=" + new Date().getTime() : videoURL);
      return videoURL;
    };

    var computeBestVideo = function(theView) {
      //UTIL.log("computeBestVideo " + view2string(theView));
      var level = scale2level(view.scale);
      var levelScale = Math.pow(2, maxLevel - level);
      var col = Math.round((theView.x - (videoWidth * levelScale * 0.5)) / (tileWidth * levelScale));
      col = Math.max(col, 0);
      col = Math.min(col, levelInfo[level].cols - 1);
      var row = Math.round((theView.y - (videoHeight * levelScale * 0.5)) / (tileHeight * levelScale));
      row = Math.max(row, 0);
      row = Math.min(row, levelInfo[level].rows - 1);
      //UTIL.log("computeBestVideo l=" + level + ", c=" + col + ", r=" + row);
      return tileidxCreate(level, col, row);
    };

    var scale2level = function(scale) {
      // Minimum level is 0, which has one tile
      // Maximum level is maxLevel, which is displayed 1:1 at scale=1
      var idealLevel = Math.log(scale) / Math.log(2) + maxLevel;
      var selectedLevel = Math.floor(idealLevel + levelThreshold);
      selectedLevel = Math.max(selectedLevel, 0);
      selectedLevel = Math.min(selectedLevel, maxLevel);
      //UTIL.log('scale2level('+scale+'): idealLevel='+idealLevel+', ret='+selectedLevel);
      return selectedLevel;
    };

    var tileidxGeometry = function(tileidx) {
      var levelScale = Math.pow(2, maxLevel - getTileidxLevel(tileidx));

      // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
      var left = view.scale * (getTileidxColumn(tileidx) * tileWidth * levelScale - view.x) + viewportWidth * 0.5;
      var right = Math.round(left + view.scale * levelScale * videoWidth);
      left = Math.round(left);

      var top = view.scale * (getTileidxRow(tileidx) * tileHeight * levelScale - view.y) + viewportHeight * 0.5;
      var bottom = Math.round(top + view.scale * levelScale * videoHeight);
      top = Math.round(top);

      return {
        left: left,
        top: top,
        width: (right - left),
        height: (bottom - top)
      };
    };

    var repositionVideo = function(video) {
      videoset.repositionVideo(video, tileidxGeometry(video.tileidx));
    };

    this.writeStatusToLog = function() {
      videoset.writeStatusToLog();
    };

    this.getTiles = function() {
      return tiles;
    };

    ///////////////////////////
    // Tile index
    //
    // Represent tile coord as a 31-bit integer so we can use it as an index
    // l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)
    // 31-bit representation
    //
    var tileidxCreate = function(l, c, r) {
      return (l << 27) + (r << 14) + c;
    };

    var getTileidxLevel = function(t) {
      return t >> 27;
    };

    var getTileidxRow = function(t) {
      return 8191 & (t >> 14);
    };

    var getTileidxColumn = function(t) {
      return 16383 & t;
    };

    var getTileidxParent = function(t) {
      return tileidxCreate(getTileidxLevel(t) - 1, getTileidxColumn(t) >> 1, getTileidxRow(t) >> 1);
    };

    var getTileidxName = function(t) {
      return 'tileidx(' + getTileidxLevel(t) + ',' + getTileidxRow(t) + ',' + getTileidxColumn(t) + ')';
    };

    var dumpTileidx = function(t) {
      return "{l:" + getTileidxLevel(t) + ",c:" + getTileidxColumn(t) + ",r:" + getTileidxRow(t) + "}";
    };

    function validateAndSetDatasetIndex(newDatasetIndex) {
      // Make sure the datasetIndex is a valid number, and within the range of datasets for this timelapse.
      if (!UTIL.isNumber(newDatasetIndex)) {
        datasetIndex = 0;
      } else {
        datasetIndex = Math.max(0, Math.min(newDatasetIndex, tmJSON["datasets"].length - 1));
      }
    }

    function getMetadataCacheBreaker() {
      return ( enableMetadataCacheBreaker ? ("?" + new Date().getTime()) : "");
    }

    var handleLeavePageWithEditor = function() {
      if ((editorEnabled && snaplapse && snaplapse.getKeyframes().length > 0) || (annotator && annotator.getAnnotationList().length > 0)) {
        return "You are attempting to leave this page while creating a tour.";
      }
    };

    function setupUIHandlers() {
      // Alert when an editor (tour or annotator) is up and the user tries to leave the page.
      if (editorEnabled || annotator) {
        $(window).on('beforeunload', handleLeavePageWithEditor);
      }

      // On URL hash change, do share view related stuff
      window.onhashchange = handleHashChange;
    }

    var isCurrentTimeAtOrPastDuration = function() {
      // Fix the numbers, but subtract 0 from each to convert back to float since toFixed gives a string
      var num1Fixed = timelapseCurrentTimeInSeconds.toFixed(3) - 0;
      var num2Fixed = timelapseDurationInSeconds.toFixed(3) - 0;
      if (isIE9)
        num1Fixed += 0.07;
      return num1Fixed >= num2Fixed;
    };
    this.isCurrentTimeAtOrPastDuration = isCurrentTimeAtOrPastDuration;

    function setupTimelapse() {
      _addTimeChangeListener(function(t) {
        if (annotator)
          annotator.updateAnnotationPositions();

        timelapseCurrentTimeInSeconds = t;
        timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(t * _getFps()));
        if (timelapseCurrentTimeInSeconds.toFixed(3) < 0 || (timelapseCurrentTimeInSeconds.toFixed(3) == 0 && thisObj.getPlaybackRate() < 0)) {
          timelapseCurrentTimeInSeconds = 0;
          _pause();
          _seek(0);
        }

        if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
          timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
          if (!thisObj.isPaused()) {
            if (snaplapse != null && snaplapse.isPlaying())
              return;
            if (loopPlayback) {
              if (loopDwell) {
                if (doingLoopingDwell)
                  return;
                doingLoopingDwell = true;
                updateCustomPlayback();
                _pause();
                loopStartTimeoutId = window.setTimeout(function() {
                  _seek(0);
                  loopEndTimeoutId = window.setTimeout(function() {
                    _play();
                    doingLoopingDwell = false;
                  }, startDwell * 1000);
                }, endDwell * 1000);
              } else {
                updateCustomPlayback();
                _seek(0);
                _pause();
                _play();
              }
            } else {
              _pause();
            }
          }
        }
        $("#" + viewerDivId + " .currentTime").html(UTIL.formatTime(timelapseCurrentTimeInSeconds, true));
        $("#" + viewerDivId + " .currentCaptureTime").html(UTIL.htmlForTextWithEmbeddedNewlines(captureTimes[timelapseCurrentCaptureTimeIndex]));
        $("#" + viewerDivId + " .timelineSlider").slider("value", (timelapseCurrentTimeInSeconds * _getFps() - timePadding));
      });

      _addTargetViewChangeListener(function(view) {
        $("#" + viewerDivId + " .zoomSlider").slider("value", _viewScaleToZoomSlider(view.scale));
      });

      _addViewChangeListener(function() {
        // TODO: move to the annotator
        if (annotator)
          annotator.updateAnnotationPositions();
        if (!isHyperwall)
          updateLocationContextUI();
      });

      _addVideoPauseListener(function() {
        // The videoset might cause playback to pause, such as when it decides
        // it's hit the end (even though the current time might not be >= duration),
        // so we need to make sure the play button is updated.
        if (doingLoopingDwell)
          return;
        // TODO: UI Class should handle this
        if (customUI) {
          $("#" + viewerDivId + " .customPlay").button({
            icons: {
              primary: "ui-icon-custom-play"
            },
            text: false
          }).attr({
            "title": "Play"
          });
          if (customUI.getLocker() != "month") {
            // The UI when the month locker is enabled is handled in customUI.js
            $("#" + viewerDivId + " .modisCustomPlay").button({
              icons: {
                primary: "ui-icon-custom-play"
              },
              text: false
            }).attr({
              "title": "Play"
            });
          }
        }
        // TODO: UI Class should handle this
        $("#" + viewerDivId + " .playbackButton").button({
          icons: {
            secondary: "ui-icon-custom-play"
          }
        }).attr('title', 'Play');
        $("#" + viewerDivId + " .playbackButton").removeClass("pause").addClass("play").attr('title', 'Play');
      });

      _addVideoPlayListener(function() {
        // Always make sure that when we are playing, the button status is updated
        if (doingLoopingDwell)
          return;
        // TODO: UI Class should handle this
        if (customUI) {
          $("#" + viewerDivId + " .customPlay").button({
            icons: {
              primary: "ui-icon-custom-pause"
            },
            text: false
          }).attr({
            "title": "Pause"
          });
          if (customUI.getLocker() != "month") {
            // The UI when the month locker is enabled is handled in customUI.js
            $("#" + viewerDivId + " .modisCustomPlay").button({
              icons: {
                primary: "ui-icon-custom-pause"
              },
              text: false
            }).attr({
              "title": "Pause"
            });
          }
        }
        // TODO: UI Class should handle this
        $("#" + viewerDivId + " .playbackButton").button({
          icons: {
            secondary: "ui-icon-custom-pause"
          }
        }).attr('title', 'Pause');
        $("#" + viewerDivId + " .playbackButton").removeClass("play").addClass("pause").attr('title', 'Pause');
      });

      _makeVideoVisibleListener(function(videoId) {
        // This is the first video of the dataset being displayed
        if (videoId == firstVideoId) {
          if (desiredInitialDate) {
            initialTime = findExactOrClosestCaptureTime(String(desiredInitialDate)) / _getFps();
          }
          if (initialTime == 0) {
            timelapseCurrentTimeInSeconds = 0;
            // Fixes Safari/IE bug which causes the video to not be displayed if the video has no leader and the initial
            // time is zero (the video seeked event is never fired, so videoset never gets the cue that the video
            // should be displayed).  The fix is to simply seek half a frame in.  Yeah, the video won't be starting at
            // *zero*, but the displayed frame will still be the right one, so...good enough.  :-)

            // 201506 - Chrome now seems to suffer from a similar problem in that we need to seek a bit further into the
            // frame so as to not show the leader. Since so many quirks exist for the 0 frame case, we just always seek
            // half a frame in when we are trying to load from the start of the video.
            //if (videoset.getLeader() <= 0 && (isSafari || isIE)) {
            var quarterOfAFrame = 1 / _getFps() / 4;
            _seek(quarterOfAFrame);
            //}
          } else {
            timelapseCurrentTimeInSeconds = initialTime;
            _seek(initialTime);
          }

          if (didFirstTimeOnLoad) {
            timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(timelapseCurrentTimeInSeconds * _getFps()));
            // Recreate timeline slider.
            // There seems to be an issue with the jQuery UI slider widget, since just changing the max value and refreshing
            // the slider does not proplerly update the available range. So we have to manually recreate it...
            if (customUI) {
              customUI.resetCustomTimeline();
            } else {
              defaultUI.resetTimelineSlider();
            }
          } else {
            loadSharedDataFromUnsafeURL(UTIL.getUnsafeHashString());
            didFirstTimeOnLoad = true;
            // Fire onTimeMachinePlayerReady the first time the page is loaded.
            if (typeof (settings["onTimeMachinePlayerReady"]) === "function") {
              settings["onTimeMachinePlayerReady"](timeMachineDivId);
            }
          }
          hideSpinner(viewerDivId);
          if (typeof onNewTimelapseLoadCompleteCallBack === "function")
            onNewTimelapseLoadCompleteCallBack();

          for (var i = 0; i < datasetLoadedListeners.length; i++)
            datasetLoadedListeners[i]();

        }
      });

      snaplapseForSharedTour = new org.gigapan.timelapse.Snaplapse(thisObj, settings, "noUI");

      // Always add to the DOM. We need it when we display tours, even without the editor UI actually visible.
      $("#" + videoDivId).append('<div class="snaplapse-annotation-description"><div></div></div>');

      if (editorEnabled) {
        snaplapse = new org.gigapan.timelapse.Snaplapse(thisObj, settings);

        // TODO:
        // Disabled by default because of odd behavior in Chrome. Causes an endless 'waiting for socket' error to appear
        // if too many tabs/windows are open with Time Machines loaded. The behavior is a bit similar to the Chrome
        // cache bug in the sense that once you close a window, one that was stuck will start to work.
        // Visualizer loads a top level video to be used as a context map in the editor. It seeks when the main video also seeks.
        // Most likely that is at the heart of the problem.
        //
        // Timewarp visualizer that shows the location of the current view and transitions between keyframes
        if (enableContextMapOnDefaultUI && !tmJSON['projection-bounds'])
          visualizer = new org.gigapan.timelapse.Visualizer(thisObj, snaplapse, visualizerGeometry);
      }

      if (presentationSliderEnabled)
        snaplapseForPresentationSlider = new org.gigapan.timelapse.Snaplapse(thisObj, settings, "presentation");
      if (annotatorEnabled)
        annotator = new org.gigapan.timelapse.Annotator(thisObj);
      if (useThumbnailServer && settings["showThumbnailTool"]) {
        var view = thisObj.getView();
        var scaleOffset = 40 / view.scale;
        var thumbnailToolOptions = {};
        thumbnailTool = new ThumbnailTool(thisObj, thumbnailToolOptions);
      }
      if (changeDetectionEnabled) {
        var changeDetectionOptions = {};
        changeDetectionTool = new ChangeDetectionTool(thisObj, thumbnailTool, changeDetectionOptions);
      }

      defaultUI = new org.gigapan.timelapse.DefaultUI(thisObj, settings);
      if (useCustomUI)
        customUI = new org.gigapan.timelapse.CustomUI(thisObj, settings);

      if(timelineMetadataVisualizerEnabled) {
        timelineMetadataVisualizer = new org.gigapan.timelapse.TimelineMetadataVisualizer(thisObj);
      }

      // TODO(pdille):
      // Bring back this feature for those with RealPlayer/DivX or other plugins that take-over the video tag element.
      //handlePluginVideoTagOverride();

      // Must be placed after customUI is created
      if (settings["scaleBarOptions"] && tmJSON['projection-bounds'])
        scaleBar = new org.gigapan.timelapse.ScaleBar(settings["scaleBarOptions"], thisObj);

      if (isHyperwall)
        customUI.handleHyperwallChangeUI();

      if (settings["contextMapOptions"] && tmJSON['projection-bounds'] /*&& typeof google !== "undefined"*/) {
        if (!isHyperwall || fields.showMap)
          contextMap = new org.gigapan.timelapse.ContextMap(settings["contextMapOptions"], thisObj, settings);
      }

      thisObj.setPlaybackRate(playbackSpeed);

      setupUIHandlers();
      //setupSliderHandlers(viewerDivId);

      // The UI is now ready and we can display it
      $("#" + viewerDivId).css("visibility", "visible");
      if (viewerType == "webgl")
        hideSpinner(viewerDivId);

      // Force initial focus on viewer
      $(videoDiv).focus();
    }

    this.switchLayer = function(layerNum) {
      var newIndex = layerNum * tmJSON["sizes"].length;
      datasetLayer = layerNum;
      validateAndSetDatasetIndex(newIndex);
      loadTimelapseCallback(tmJSON);
    };

    var loadNewTimeline = function(url, newTimelineStyle) {
      currentTimelineStyle = newTimelineStyle;
      var rootUrl = url.substring(0, url.lastIndexOf("/") + 1);
      var file = url.substring(url.lastIndexOf("/") + 1, url.length);
      UTIL.ajax("json", rootUrl, file + getMetadataCacheBreaker(), loadNewTimelineCallback);
    };
    this.loadNewTimeline = loadNewTimeline;

    var loadNewTimelineCallback = function(json) {
      captureTimes = json["capture-times"];
      frames = captureTimes.length;
      timelapseDurationInSeconds = (frames - 0.7) / _getFps();
      videoset.setDuration((1 / _getFps()) * frames);
      timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(timelapseCurrentTimeInSeconds * _getFps()));

      if (currentTimelineStyle == "customUI") {
        $("#" + viewerDivId + " .controls").hide();
        $("#" + viewerDivId + " .customControl").show().css("z-index", "19");
        if ($previousCustomUIElements)
          $previousCustomUIElements.appendTo("#" + viewerDivId + " .customControl");
        $("#" + viewerDivId + " .timelineSliderFiller").css("right", "21px").hide();
        $("#" + viewerDivId + " .captureTime").hide();
        $("#" + viewerDivId + " .customControl .customHelpLabel").css({"bottom" : "44px", "z-index" : "inherit"});

        customUI.resetCustomTimeline();
      } else {
        $previousCustomUIElements = $("#" + viewerDivId + " .customControl").css("z-index", "inherit").children().not(".customHelpLabel, .customHelpCheckbox").detach();
        $("#" + viewerDivId + " .controls").show();
        $("#" + viewerDivId + " .helpPlayerLabel").hide();
        $("#" + viewerDivId + " .customControl .customHelpLabel").css({"bottom" : "27px", "z-index" : "19"});
        $("#" + viewerDivId + " .timelineSliderFiller").css("right", "85px").show();
        $("#" + viewerDivId + " .captureTime").show();
        $("#" + viewerDivId + " .help").hide();

        defaultUI.resetTimelineSlider();
      }
    };

    var loadTimelapse = function(url, desiredView, desiredTime, preserveViewAndTime, desiredDate, onLoadCompleteCallBack) {

      if (preserveViewAndTime) {
        // TODO: Assumes dates of the form yyyy-mm-dd hh:mm:ss
        desiredDate = timelapse.getCurrentCaptureTime().substr(11, 8);
        desiredView = timelapse.getView();
      }

      if (didFirstTimeOnLoad && desiredDate && settings["url"].indexOf(url) >= 0) {
        var newFrame = findExactOrClosestCaptureTime(String(desiredDate));
        timelapse.seekToFrame(newFrame);
        if (desiredView)
          timelapse.warpTo(desiredView);
        return;
      }

      showSpinner(viewerDivId);

      settings["url"] = url;
      // Add trailing slash to url if it was omitted
      if (settings["url"].charAt(settings["url"].length - 1) != "/")
        settings["url"] += "/";

      // If the user specifies a starting view, use it.
      if (desiredView && typeof (desiredView) === "object") {
        initialView = desiredView;
      } else {
        initialView = null;
      }
      settings["initialView"] = initialView;

      // Set the initial desired date
      desiredInitialDate = desiredDate;

      // If the user specifies a starting time, use it.
      if (desiredTime && typeof (desiredTime) === "number") {
        initialTime = desiredTime;
        settings["initialTime"] = initialTime;
      } else {
        initialTime = 0;
      }

      // Set the call back
      onNewTimelapseLoadCompleteCallBack = onLoadCompleteCallBack;

      UTIL.ajax("json", settings["url"], "tm.json" + getMetadataCacheBreaker(), loadTimelapseCallback);
    };
    this.loadTimelapse = loadTimelapse;

    var loadTimelapseCallback = function(json) {
      tmJSON = json;
      // Assume tiles and json are on same host
      tileRootPath = settings["url"];

      // layer + size = index of dataset
      validateAndSetDatasetIndex(datasetLayer * tmJSON["sizes"].length);
      var path = tmJSON["datasets"][datasetIndex]['id'] + "/";
      datasetPath = settings["url"] + path;
      UTIL.ajax("json", settings["url"], path + "r.json" + getMetadataCacheBreaker(), loadVideoSetCallback);
    };

    // NOTE: Assumes dates are being used as capture times and a date string (of various formats) is being passed in.
    // 2015-04-08 16:30:25.000
    // 2015-04-08 16:30:25
    // 2015-04-08 16:30
    // 16:30:25
    // 16:30
    // Wed Apr 08 2015 16:30:25 GMT-0400 (Eastern Daylight Time)
    // Wed Apr 08 2015, 16:30:25.000
    var findExactOrClosestCaptureTime = function(timeToFind, direction) {
      var low = 0, high = captureTimes.length - 1, i, newCompare;
      if (!timeToFind)
        return null;
      // Requested date may not have seconds
      var subStrLength = captureTimes[0].match(/\d\d:\d\d:\d\d/) ? 8 : 5;
      // FireFox/IE cannot parse a Date in the form of "Thu Apr 09 2015, 08:52:35.000" (milliseconds must be removed)
      var sanitized_timeToFind = timeToFind.split(".")[0];
      // If a date string has dashes (i.e. 2015-04-09 08:52:35 GMT-0400), replace with slashes since IE/FireFox Date parser does not support this.
      // However, be sure not to remove the dash from the timezone field.
      var dashSubString = sanitized_timeToFind.match(/\d\d\d\d-\d\d-\d\d/);
      if (dashSubString) {
        var slashSubString = dashSubString[0].replace(/-/g, "/");
        sanitized_timeToFind.replace(dashSubString, slashSubString);
      }
      sanitized_timeToFind = new Date(sanitized_timeToFind);
      var tmpNewCompare = new Date(captureTimes[Math.max(0, frames - 1)].replace(/-/g, "/"));
      // If date parsing fails, we assume the input only included the hour, min, [sec], so manually insert a year, month, day based on captureTime array
      if (String(sanitized_timeToFind).indexOf("Invalid") >= 0) {
        var yearMonthDay = tmpNewCompare.getFullYear() + "/" + (1e2 + (tmpNewCompare.getMonth() + 1) + '').substr(1) + "/" + (1e2 + (tmpNewCompare.getDate()) + '').substr(1) + " ";
        sanitized_timeToFind = new Date(yearMonthDay + timeToFind);
      }
      // Convert to epoch time for comparisons
      sanitized_timeToFind = sanitized_timeToFind.getTime();
      while (low <= high) {
        i = Math.floor((low + high) / 2);
        newCompare = (new Date(captureTimes[i].replace(/-/g, "/"))).getTime();
        if (newCompare < sanitized_timeToFind) {
          low = i + 1;
          continue;
        } else if (newCompare > sanitized_timeToFind) {
          high = i - 1;
          continue;
        }
        // Exact match
        return i;
      }
      if (low >= captureTimes.length)
        return (captureTimes.length - 1);
      if (high < 0)
        return 0;
      // No exact match. Now find the closest and alter direction if requested by user
      var lowCompare = Date.parse(new Date(captureTimes[low].replace(/-/g, "/")));
      var highCompare = Date.parse(new Date(captureTimes[high].replace(/-/g, "/")));
      var timeToFindCompare = Date.parse(captureTimes[low].replace(/-/g, "/").substr(0, 11) + sanitized_timeToFind);
      if (Math.abs(lowCompare - timeToFindCompare) > Math.abs(highCompare - timeToFindCompare)) {
        i = (direction === "up") ? low : high;
      } else {
        i = (direction === "down") ? high : low;
      }
      return i;
    };
    this.findExactOrClosestCaptureTime = findExactOrClosestCaptureTime;

    var loadVideoSetCallback = function(data) {
      datasetJSON = data;

      // We are loading a new timelapse and in order for code that should only be run when the
      // first video of a timelapse is displayed, we need to reset the firstVideoId to the next
      // id that the videoset class will use. See _makeVideoVisibleListener() where we check for
      // first time videos.
      firstVideoId = videoDivId + "_" + (videoset.getCurrentVideoId() + 1);

      // Reset currentIdx so that we'll load in the new tile with the different resolution.  We don't null the
      // currentVideo here because 1) it will be assigned in the refresh() method when it compares the bestIdx
      // and the currentIdx; and 2) we want currentVideo to be non-null so that the VideosetStats can keep
      // track of what video replaced it.
      currentIdx = null;
      onPanoLoadSuccessCallback(data, null, true);

      // We've already loaded the UI, so just do new dataset specific setup.
      if (didFirstTimeOnLoad) {
        // Reset home view
        computeHomeView();

        setInitialView();

        if (!view)
          view = $.extend({}, homeView);
        _warpTo(view);
        timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(videoset.getCurrentTime() * _getFps()));
      } else {
        initializeUI();
        setupTimelapse();
      }

      if (visualizer) {
        topLevelVideo.src = getTileidxUrl(0);
        topLevelVideo.geometry = tileidxGeometry(0);
        leader = videoset.getLeader();
        visualizer.loadContextMap();
        panoVideo = visualizer.clonePanoVideo(topLevelVideo);
      }
    };

    function loadPlayerControlsTemplate(html) {
      // Add player_template.html to the DOM
      $("#" + timeMachineDivId).html(html);
      var $viewerDiv = $("#" + viewerDivId);

      // Hide the UI because it is not ready yet
      $viewerDiv.css("visibility", "hidden");

      var tmp = document.getElementById("{REPLACE}");
      $(tmp).attr("id", timeMachineDivId + "_timelapse");
      videoDivId = $(tmp).attr("id");
      videoDiv = document.getElementById(videoDivId);
      firstVideoId = videoDivId + "_1";

      // Prevent the UI from being selected by the user.
      $viewerDiv.attr('unselectable', 'on').css({
        '-moz-user-select': 'none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      });

      // Setup data pane container for overlays
      dataPanesId = tmp.id + "_dataPanes";
      $("#" + videoDivId).append("<div id=" + dataPanesId + " class='dataPanesContainer'></div>");

      if (viewerType == "video") {
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj);
      } else {
        canvas = document.createElement('canvas');
        canvas.id = videoDivId + "_canvas";
        videoDiv.appendChild(canvas);
        blackFrameDetectionCanvas = document.createElement('canvas');
        blackFrameDetectionCanvas.id = videoDivId + "_canvas_blackFrameDetection";
        blackFrameDetectionCanvas.style.display = "none";
        if (blackFrameDetection)
          videoDiv.appendChild(blackFrameDetectionCanvas);
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj, canvas.id, blackFrameDetectionCanvas.id);
      }

      // Setup viewport event handlers.
      videoDiv['onmousedown'] = handleMousedownEvent;
      videoDiv['ondblclick'] = handleDoubleClickEvent;

      $(videoDiv).mousewheel(thisObj.handleMousescrollEvent);
      // Disable this feature, since in older browsers this can cause scrolling to be slower than native.
      // In addition, scrolling breaks horribly for Opera <= 12 when this is enabled.
      $.event.special.mousewheel.settings.adjustOldDeltas = false;

      if (hasTouchSupport) {
        document.addEventListener("touchstart", touch2Mouse, true);
        document.addEventListener("touchmove", touch2Mouse, true);
        document.addEventListener("touchend", touch2Mouse, true);
        document.addEventListener("touchcancel", touch2Mouse, true);
        $("#" + timeMachineDivId).on("touchstart", function(e) {
          if (tapped && e.originalEvent.touches.length == 2) {
            //stop single tap callback
            clearTimeout(tapped);
            tapped = null;
            e.preventDefault();
            return;
          }

          var theTouch = e.originalEvent.changedTouches[0];

          if (!tapped) {//if tap is not set, set up single tap
            // wait 300ms then run single click code
            tapped = setTimeout(function() {
              if (draggingSlider) {
                //stop single tap callback
                clearTimeout(tapped);
                tapped = null;
                return;
              }
              tapped = null;
              var mouseEvent = document.createEvent("MouseEvent");
              mouseEvent.initMouseEvent('click', true, true, window, 1, theTouch.screenX, theTouch.screenY, theTouch.clientX, theTouch.clientY, false, false, false, false, 0, null);
              theTouch.target.dispatchEvent(mouseEvent);
            }, 350);
          } else {// we consider a double tap to be tap within 300ms of last tap.
            // stop single tap callback
            clearTimeout(tapped);
            tapped = null;
            var mouseEvent = document.createEvent("MouseEvent");
            mouseEvent.initMouseEvent('dblclick', true, true, window, 1, theTouch.screenX, theTouch.screenY, theTouch.clientX, theTouch.clientY, false, false, false, false, 0, null);
            theTouch.target.dispatchEvent(mouseEvent);
          }
          e.preventDefault();
        });
      }

      $("body").on("keydown.tm_keydown", handleKeydownEvent).on("keyup.tm_keyup", handleKeyupEvent);

      // Remove focus from other UI elements (such as the timeline) when
      // the view port is clicked. This ensures when, for example, keyboard shortcuts
      // are used that the view port is the one that receives the events.
      $(videoDiv).attr("tabindex", 2013).on("click", function() {
        $(this).focus();
      });

      // When you do a path from an external css file in IE, it is actually relative to the document and not the css file. This is against the spec. ARGH!
      // So we have a choice: Do multiple paths in the css file, getting a 404 in Chrome for invalid relative paths OR we do the style in the document itself,
      // which in any browser will reslove relative paths correctly. We choose the latter to keep the message console clean.
      $('<style type="text/css">.closedHand {cursor: url("' + rootAppURL + 'css/cursors/closedhand.cur"), move !important;} .openHand {cursor: url("' + rootAppURL + 'css/cursors/openhand.cur"), move !important;} .tiledContentHolder {cursor: url("' + rootAppURL + 'css/cursors/openhand.cur"), move;}</style>').appendTo($('head'));

      loadTimelapse(settings["url"], settings["initialView"], settings["initialTime"]);
    }

    function setupSliderHandlers(viewerDivId) {
      var $viewerDiv = $("#" + viewerDivId);
      $viewerDiv.on("mouseover mouseup", ".ui-slider-handle", function() {
        $(this).removeClass("openHand closedHand").addClass("openHand");
      });

      $viewerDiv.on({
        slide: function() {
          $(this).removeClass("openHand closedHand").addClass("closedHand");
          $viewerDiv.on("mousemove", ".ui-slider-handle", function() {
            $(this).removeClass("openHand closedHand").addClass("closedHand");
          });
        },
        slidestop: function() {
          $viewerDiv.on("mousemove", ".ui-slider-handle", function() {
            $(this).removeClass("openHand closedHand").addClass("openHand");
          });
        },
        mouseover: function() {
          $(this).removeClass("openHand closedHand");
        }
      });
    }

    function handlePluginVideoTagOverride() {
      if (browserSupported && $("#1").is("EMBED")) {
        $("#player").hide();
        $("#time_warp_composer").hide();
        $("#html5_overridden_message").show();
      }
    }

    var showSpinner = function(viewerDivId) {
      UTIL.log("showSpinner");
      $("#" + viewerDivId + " .spinnerOverlay").show();
    };
    this.showSpinner = showSpinner;

    var hideSpinner = function(viewerDivId) {
      UTIL.log("hideSpinner");
      $("#" + viewerDivId + " .spinnerOverlay").hide();
    };
    this.hideSpinner = hideSpinner;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    // TODO: This is because of goofy user agent for Google hyperwall
    if (settings["viewerType"] == "webgl") {
      UTIL.setMediaType(settings["mediaType"]);
      browserSupported = true;
    } else {
      browserSupported = UTIL.browserSupported(settings["mediaType"]);
    }

    if (!browserSupported) {
      UTIL.ajax("html", rootAppURL, "templates/browser_not_supported_template.html", function(html) {
        $("#" + timeMachineDivId).html(html);
      });
      return;
    }

    mediaType = UTIL.getMediaType();

    if (settings["viewerType"])
      UTIL.setViewerType(settings["viewerType"]);

    viewerType = UTIL.getViewerType();

    // Set default loop dwell time
    // TODO: This should probably be set not just for landsat, but for all short datasets.
    // TODO: This should probably move to the setup function.
    if (datasetType == "landsat" && loopDwell == undefined) {
      loopDwell = {
        "startDwell": defaultLoopDwellTime,
        "endDwell": defaultLoopDwellTime
      };
      startDwell = defaultLoopDwellTime;
      endDwell = defaultLoopDwellTime;
    }

    UTIL.log('Timelapse("' + settings["url"] + '")');
    UTIL.ajax("html", rootAppURL, "templates/player_template.html", loadPlayerControlsTemplate);
  };
})();
