//======================================================================================================================
// Class for managing a snaplapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Timelapse
// * Math.uuid (http://www.broofa.com/blog/?p=151)
//
// Authors:
// * Randy Sarget (randy.sargent@gmail.com)
// * Paul Dille (pdille@andrew.cmu.edu)
// * Chris Bartley (bartley@cmu.edu)
//======================================================================================================================

//======================================================================================================================
// VERIFY NAMESPACE
//======================================================================================================================
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org)
   {
   org = {};
   }
else
   {
   if (typeof org != "object")
      {
      var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
      alert(orgExistsMessage);
      throw new Error(orgExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan)
   {
   org.gigapan = {};
   }
else
   {
   if (typeof org.gigapan != "object")
      {
      var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
      alert(orgGigapanExistsMessage);
      throw new Error(orgGigapanExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse)
   {
   org.gigapan.timelapse = {};
   }
else
   {
   if (typeof org.gigapan.timelapse != "object")
      {
      var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
      alert(orgGigapanTimelapseExistsMessage);
      throw new Error(orgGigapanTimelapseExistsMessage);
      }
   }
//======================================================================================================================

//======================================================================================================================
// DEPENDECIES
//======================================================================================================================
if (!org.gigapan.Util)
   {
   var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Snaplapse";
   alert(noUtilMsg);
   throw new Error(noUtilMsg);
   }
if (!org.gigapan.timelapse.Timelapse)
   {
   var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Snaplapse";
   alert(noVideosetMsg);
   throw new Error(noVideosetMsg);
   }
if (!Math.uuid)
   {
   var noMathUUID = "The Math.uuid library is required by org.gigapan.timelapse.Snaplapse";
   alert(noMathUUID);
   throw new Error(noMathUUID);
   }
//======================================================================================================================

//======================================================================================================================
// CODE
//======================================================================================================================

(function()
   {
   var UTIL = org.gigapan.Util;
   org.gigapan.timelapse.Snaplapse = function(timelapse)
      {
      var eventListeners = {};
      var keyframes = [];
      var keyframesById = {};
      var keyframeIntervals = [];
      var currentKeyframeInterval = null;
      var isCurrentlyPlaying = false;
      var warpStartingTime = null;
      var timeCounterIntervalHandle = null;

      timelapse.getVideoset().addEventListener('stall-status-change',
                                               function(isStalled)
                                                  {
                                                  if (isCurrentlyPlaying)
                                                     {
                                                     if (isStalled)
                                                        {
                                                        UTIL.log("videoset stall-status-change listener: pausing time warp time counter interval");
                                                        pauseTimeCounterInterval();
                                                        }
                                                     else
                                                        {
                                                        UTIL.log("videoset stall-status-change listener: resuming time warp time counter interval");
                                                        resumeTimeCounterInterval();
                                                        }
                                                     }
                                                  });
      this.getAsJSON = function()
         {
         var snaplapseJSON = {};
         snaplapseJSON['snaplapse'] = {};
         snaplapseJSON['snaplapse']['keyframes'] = keyframes;
         return JSON.stringify(snaplapseJSON, null, 3);
         };

      this.loadFromJSON = function(json)
         {
         try
            {
            var obj = JSON.parse(json);

            if (typeof obj['snaplapse'] != 'undefined' &&
                typeof obj['snaplapse']['keyframes'] != 'undefined')
               {
               UTIL.log("Found [" + obj['snaplapse']['keyframes'].length + "] keyframes in the json:\n\n" + json);
               for (var i = 0; i < obj['snaplapse']['keyframes'].length; i++)
                  {
                  var keyframe = obj['snaplapse']['keyframes'][i];
                  if (typeof keyframe['time'] != 'undefined' &&
                      typeof keyframe['bounds'] != 'undefined' &&
                      typeof keyframe['bounds']['xmin'] != 'undefined' &&
                      typeof keyframe['bounds']['ymin'] != 'undefined' &&
                      typeof keyframe['bounds']['xmax'] != 'undefined' &&
                      typeof keyframe['bounds']['ymax'] != 'undefined')
                     {
                     // NOTE: if is-description-visible is undefined, then we define it as *true* in order to maintain
                     // backward compatibility with older time warps which don't have this property.
                     this.recordKeyframe(null,
                                         keyframe['time'],
                                         keyframe['bounds'],
                                         keyframe['description'],
                                         (typeof keyframe['is-description-visible'] == 'undefined') ? true : keyframe['is-description-visible'],
                                         keyframe['duration']);
                     }
                  else
                     {
                     UTIL.error("Ignoring invalid keyframe during snaplapse load.")
                     }
                  }
               }
            else
               {
               UTIL.error("ERROR: Invalid snaplapse file.");
               return false;
               }
            }
         catch(e)
            {
            UTIL.error("ERROR: Invalid snaplapse file.\n\n" + e.name + " while parsing snaplapse JSON: " + e.message, e);
            return false;
            }

         return true;
         };

      this.duplicateKeyframe = function(idOfSourceKeyframe)
         {
         var keyframeCopy = this.getKeyframeById(idOfSourceKeyframe);
         this.recordKeyframe(idOfSourceKeyframe,
                             keyframeCopy['time'],
                             keyframeCopy['bounds'],
                             keyframeCopy['description'],
                             keyframeCopy['is-description-visible'],
                             keyframeCopy['duration']);
         };

      this.recordKeyframe = function(idOfKeyframeToAppendAfter, time, bounds, description, isDescriptionVisible, duration)
         {
         if (typeof bounds == 'undefined')
            {
            bounds = timelapse.getBoundingBoxForCurrentView();
            }

         // create the new keyframe
         var keyframeId = Math.uuid(20);
         var keyframe = {};
         keyframe['id'] = keyframeId;
         keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime((typeof time == 'undefined') ? timelapse.getCurrentTime() : time);
         keyframe['bounds'] = {};
         keyframe['bounds'].xmin = bounds.xmin;
         keyframe['bounds'].ymin = bounds.ymin;
         keyframe['bounds'].xmax = bounds.xmax;
         keyframe['bounds'].ymax = bounds.ymax;
         keyframe['duration'] = sanitizeDuration(duration);
         keyframe['description'] = (typeof description == 'undefined') ? '' : description;
         keyframe['is-description-visible'] = (typeof isDescriptionVisible == 'undefined') ? false : isDescriptionVisible;

         // determine where the new keyframe will be inserted
         var insertionIndex = keyframes.length;
         if (typeof idOfKeyframeToAppendAfter != 'undefined' && idOfKeyframeToAppendAfter != null)
            {
            for (var j = 0; j < keyframes.length; j++)
               {
               if (idOfKeyframeToAppendAfter == keyframes[j]['id'])
                  {
                  insertionIndex = j + 1;
                  break;
                  }
               }
            }

         keyframes.splice(insertionIndex, 0, null);
         keyframes[insertionIndex] = keyframe;
         keyframesById[keyframeId] = keyframe;

         var listeners = eventListeners['keyframe-added'];
         if (listeners)
            {
            for (var i = 0; i < listeners.length; i++)
               {
               try
                  {
                  listeners[i](cloneFrame(keyframe), insertionIndex);
                  }
               catch(e)
                  {
                  UTIL.error(e.name + " while calling snaplapse 'keyframe-added' event listener: " + e.message, e);
                  }
               }
            }
         };

      this.setTextAnnotationForKeyframe = function(keyframeId, description, isDescriptionVisible)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            keyframesById[keyframeId]['description'] = description;
            keyframesById[keyframeId]['is-description-visible'] = isDescriptionVisible;
            return true;
            }
         return false;
         };

      var sanitizeDuration = function(rawDuration)
         {
         if (typeof rawDuration != 'undefined' && rawDuration != null)
            {
            var rawDurationStr = rawDuration + '';
            if (rawDurationStr.length > 0)
               {
               var num = parseFloat(rawDurationStr);

               if (!isNaN(num) && (num >= 0))
                  {
                  return num.toFixed(1) - 0;
                  }
               }
            }
         return null;
         };

      this.setDurationForKeyframe = function(keyframeId, duration)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            keyframesById[keyframeId]['duration'] = sanitizeDuration(duration);
            }
         };

      this.updateTimeAndPositionForKeyframe = function(keyframeId)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            var bounds = timelapse.getBoundingBoxForCurrentView();
            var keyframe = keyframesById[keyframeId];
            keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime(timelapse.getCurrentTime());
            keyframe['bounds'] = {};
            keyframe['bounds'].xmin = bounds.xmin;
            keyframe['bounds'].ymin = bounds.ymin;
            keyframe['bounds'].xmax = bounds.xmax;
            keyframe['bounds'].ymax = bounds.ymax;

            var listeners = eventListeners['keyframe-modified'];
            if (listeners)
               {
               for (var i = 0; i < listeners.length; i++)
                  {
                  try
                     {
                     listeners[i](cloneFrame(keyframe));
                     }
                  catch(e)
                     {
                     UTIL.error(e.name + " while calling snaplapse 'keyframe-modified' event listener: " + e.message, e);
                     }
                  }
               }
            }
         };

      this.deleteKeyframeById = function(keyframeId)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            var indexToDelete = -1;
            for (var i = 0; i < keyframes.length; i++)
               {
               if (keyframeId == keyframes[i]['id'])
                  {
                  indexToDelete = i;
                  }
               }
            keyframes.splice(indexToDelete, 1);
            delete keyframesById[keyframeId];
            return true;
            }
         return false;
         };

      this.getKeyframes = function()
         {
         var keyframesClone = [];
         for (var i = 0; i < keyframes.length; i++)
            {
            keyframesClone[i] = cloneFrame(keyframes[i]);
            }
         return keyframesClone;
         };

      this.play = function(startingKeyframeId)
         {
         UTIL.log("play(): playing time warp!");
         if (keyframes.length > 1)
            {
            if (!isCurrentlyPlaying)
               {
               isCurrentlyPlaying = true;

               // find the starting keyframe
               var startingKeyframeIndex = 0;
               for (var j=0; j<keyframes.length; j++)
                  {
                  if (keyframes[j]['id'] == startingKeyframeId)
                     {
                     startingKeyframeIndex = j;
                     break;
                     }
                  }

               // compute the keyframe intervals
               keyframeIntervals = [];
               for (var k = startingKeyframeIndex+1; k < keyframes.length; k++)
                  {
                  var previousKeyframeInterval = (keyframeIntervals.length > 0) ? keyframeIntervals[keyframeIntervals.length - 1] : null;
                  var keyframeInterval = new org.gigapan.timelapse.KeyframeInterval(keyframes[k - 1], keyframes[k], previousKeyframeInterval);
                  keyframeIntervals[keyframeIntervals.length] = keyframeInterval;
                  UTIL.log("   play(): created keyframe interval (" + (keyframeIntervals.length - 1) + "): between time [" + keyframes[k - 1]['time'] + "] and [" + keyframes[k]['time'] + "]: " + keyframeInterval);
                  }

               // make sure playback is stopped
               timelapse.pause();

               // jump to the proper time
               timelapse.seek(keyframeIntervals[0].getStartingTime());

               // initialize the current keyframe interval
               warpStartingTime = new Date().getTime();
               setCurrentKeyframeInterval(keyframeIntervals[0]);

               // start playback
               UTIL.log("play(): starting time warp playback");
               timelapse.play();

               // Set an interval which calls the timeCounterHandler.  This is much more reliable than adding
               // a listener to the timelapse because the video element doesn't actually fire time change events
               // for every time change.
               startTimeCounterInterval();

               var listeners = eventListeners['play'];
               if (listeners)
                  {
                  for (var i = 0; i < listeners.length; i++)
                     {
                     try
                        {
                        listeners[i]();
                        }
                     catch(e)
                        {
                        UTIL.error(e.name + " while calling snaplapse 'play' event listener: " + e.message, e);
                        }
                     }
                  }
               }
            }
         };

      var _stop = function(willJumpToLastKeyframe)
         {
         if (isCurrentlyPlaying)
            {
            isCurrentlyPlaying = false;

            // stop playback
            timelapse.pause();

            // clear the time counter interval
            stopTimeCounterInterval();

            if (typeof willJumpToLastKeyframe != 'undefined' && willJumpToLastKeyframe)
               {
               timelapse.seek(keyframes[keyframes.length - 1]['time']);
               timelapse.warpToBoundingBox(keyframes[keyframes.length - 1]['bounds']);
               }

            var listeners = eventListeners['stop'];
            if (listeners)
               {
               for (var i = 0; i < listeners.length; i++)
                  {
                  try
                     {
                     listeners[i]();
                     }
                  catch(e)
                     {
                     UTIL.error(e.name + " while calling snaplapse 'stop' event listener: " + e.message, e);
                     }
                  }
               }
            }
         };
      this.stop = _stop;

      this.getKeyframeById = function(keyframeId)
         {
         if (keyframeId)
            {
            var keyframe = keyframesById[keyframeId];
            if (keyframe)
               {
               return cloneFrame(keyframe);
               }
            }
         return null;
         };

      this.getNumKeyframes = function()
         {
         return keyframes.length;
         };

      this.isPlaying = function()
         {
         return isCurrentlyPlaying;
         };

      this.addEventListener = function(eventName, listener)
         {
         if (eventName && listener && typeof(listener) == "function")
            {
            if (!eventListeners[eventName])
               {
               eventListeners[eventName] = [];
               }

            eventListeners[eventName].push(listener);
            }
         };

      this.removeEventListener = function(eventName, listener)
         {
         if (eventName && eventListeners[eventName] && listener && typeof(listener) == "function")
            {
            for (var i = 0; i < eventListeners[eventName].length; i++)
               {
               if (listener == eventListeners[eventName][i])
                  {
                  eventListeners[eventName].splice(i, 1);
                  return;
                  }
               }
            }
         };

      var cloneFrame = function(frame)
         {
         var frameCopy = null;
         if (frame)
            {
            frameCopy = {};
            frameCopy['id'] = frame['id'];
            frameCopy['time'] = frame['time'];
            frameCopy['duration'] = frame['duration'];
            frameCopy['description'] = frame['description'];
            frameCopy['is-description-visible'] = frame['is-description-visible'];
            frameCopy['bounds'] = {};
            frameCopy['bounds'].xmin = frame['bounds'].xmin;
            frameCopy['bounds'].ymin = frame['bounds'].ymin;
            frameCopy['bounds'].xmax = frame['bounds'].xmax;
            frameCopy['bounds'].ymax = frame['bounds'].ymax;
            }

         return frameCopy;
         };

      var setCurrentKeyframeInterval = function(newKeyframeInterval)
         {
         UTIL.log("setCurrentKeyframeInterval(" + newKeyframeInterval + ")");

         currentKeyframeInterval = newKeyframeInterval;

         if (currentKeyframeInterval != null)
            {
            timelapse.setPlaybackRate(currentKeyframeInterval.getPlaybackRate());
            var keyframeStartingTime = currentKeyframeInterval.getStartingTime();
            timelapse.seek(keyframeStartingTime);              // make sure we're on track
            updateWarpStartingTime(keyframeStartingTime);      // update the warp starting time since we just corrected with a seek
            }

         // notify listeners
         var listeners = eventListeners['keyframe-interval-change'];
         if (listeners)
            {
            for (var i = 0; i < listeners.length; i++)
               {
               try
                  {
                  listeners[i](cloneFrame(currentKeyframeInterval ? currentKeyframeInterval.getStartingFrame() : keyframes[keyframes.length - 1]));
                  }
               catch(e)
                  {
                  UTIL.error(e.name + " while calling snaplapse 'keyframe-interval-change' event listener: " + e.message, e);
                  }
               }
            }
         };

      var startTimeCounterInterval = function()
         {
         // record starting timestamp
         warpStartingTime = new Date().getTime();

         createTimeCounterInterval();
         };

      var stopTimeCounterInterval = function()
         {
         clearInterval(timeCounterIntervalHandle);
         };

      var resumeTimeCounterInterval = function()
         {
         // update the starting timestamp since we're resuming from a stall
         updateWarpStartingTime(timelapse.getCurrentTime());

         createTimeCounterInterval();
         };

      var pauseTimeCounterInterval = function()
         {
         stopTimeCounterInterval();
         };

      var createTimeCounterInterval = function()
         {
         timeCounterIntervalHandle = setInterval(function()
                                                    {
                                                    timeCounterHandler();
                                                    }, 20);
         };

      var updateWarpStartingTime = function(videoTime)
         {
         if (currentKeyframeInterval.getActualDuration() > 0)
            {
            var elapsedVideoTimePercentage = Math.abs(videoTime - currentKeyframeInterval.getStartingTime()) / currentKeyframeInterval.getActualDuration();
            var oldWarpStartingTime = warpStartingTime;
            warpStartingTime = new Date().getTime() - (currentKeyframeInterval.getDesiredDurationInMillis() * elapsedVideoTimePercentage + currentKeyframeInterval.getStartingRunningDurationInMillis());
            UTIL.log("updateWarpStartingTime(): adjusted warp starting time by [" + (warpStartingTime - oldWarpStartingTime) + "] millis (videoTime="+videoTime+")");
            }
         };

      var timeCounterHandler = function()
         {
         // compute how much time (in millis) has already elapsed
         var elapsedTimeInMillis = new Date().getTime() - warpStartingTime;

         //UTIL.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> timeCounterHandler(" + elapsedTimeInMillis + ")");

         // update the current keyframe interval based on the elapsed time
         var foundMatchingInterval = false;
         do
            {
            var containsElapsedTime = currentKeyframeInterval.containsElapsedTime(elapsedTimeInMillis);
            if (containsElapsedTime)
               {
               foundMatchingInterval = true;
               }
            else
               {
               setCurrentKeyframeInterval(currentKeyframeInterval.getNextKeyframeInterval());
               }
            }
         while (!foundMatchingInterval && currentKeyframeInterval != null);

         if (currentKeyframeInterval)
            {
            // compute the frame for the current time
            var frameBounds = currentKeyframeInterval.computeFrameBoundsForElapsedTime(elapsedTimeInMillis);
            if (frameBounds)
               {
               // warp to the correct view
               timelapse.warpToBoundingBox(frameBounds);
               }
            else
               {
               UTIL.error("Failed to compute time warp frame for time [" + elapsedTimeInMillis + "]");
               _stop(true);
               }
            }
         else
            {
            UTIL.error("Failed to compute current keyframe interval for time [" + elapsedTimeInMillis + "]");
            _stop(true);
            }
         };
      };

   org.gigapan.timelapse.Snaplapse.normalizeTime = function(t)
      {
      return parseFloat(t.toFixed(6));
      };

   org.gigapan.timelapse.KeyframeInterval = function(startingFrame, endingFrame, previousKeyframeInterval)
      {
      var nextKeyframeInterval = null;
      var timeDirection = (startingFrame['time'] <= endingFrame['time']) ? 1 : -1;
      var actualDuration = parseFloat(Math.abs(endingFrame['time'] - startingFrame['time']).toFixed(6));
      var desiredDuration = startingFrame['duration'] == null ? actualDuration : startingFrame['duration'];
      var desiredDurationInMillis = desiredDuration * 1000;
      var startingRunningDurationInMillis = 0;
      var endingRunningDurationInMillis = desiredDurationInMillis;
      if (previousKeyframeInterval != null)
         {
         previousKeyframeInterval.setNextKeyframeInterval(this);
         var previousRunningDurationInMillis = previousKeyframeInterval.getEndingRunningDurationInMillis();
         endingRunningDurationInMillis += previousRunningDurationInMillis;
         startingRunningDurationInMillis = previousRunningDurationInMillis
         }

      var playbackRate = null;
      if (desiredDuration == 0 || actualDuration == 0)
         {
         playbackRate = 0;
         }
      else
         {
         playbackRate = timeDirection * actualDuration / desiredDuration;
         }

      this.getStartingFrame = function()
         {
         return startingFrame;
         };

      this.getStartingTime = function()
         {
         return startingFrame['time'];
         };

      this.getEndingTime = function()
         {
         return endingFrame['time'];
         };

      this.getActualDuration = function()
         {
         return actualDuration;
         };

      this.getDesiredDurationInMillis = function()
         {
         return desiredDurationInMillis;
         };

      this.getNextKeyframeInterval = function()
         {
         return nextKeyframeInterval;
         };

      this.setNextKeyframeInterval = function(theNextKeyframeInterval)
         {
         nextKeyframeInterval = theNextKeyframeInterval;
         };

      this.getPlaybackRate = function()
         {
         return playbackRate;
         };

      this.getStartingRunningDurationInMillis = function()
         {
         return startingRunningDurationInMillis;
         };

      this.getEndingRunningDurationInMillis = function()
         {
         return endingRunningDurationInMillis;
         };

      this.containsElapsedTime = function(millis)
         {
         return startingRunningDurationInMillis <= millis && millis <= endingRunningDurationInMillis;
         };

      this.computeFrameBoundsForElapsedTime = function(elapsedMillis)
         {
         if (this.containsElapsedTime(elapsedMillis))
            {
            var timePercentage = (elapsedMillis - startingRunningDurationInMillis) / desiredDurationInMillis;

            var boundsXminOffset = (endingFrame['bounds'].xmin - startingFrame['bounds'].xmin ) * timePercentage;
            var boundsYminOffset = (endingFrame['bounds'].ymin - startingFrame['bounds'].ymin ) * timePercentage;
            var boundsXmaxOffset = (endingFrame['bounds'].xmax - startingFrame['bounds'].xmax ) * timePercentage;
            var boundsYmaxOffset = (endingFrame['bounds'].ymax - startingFrame['bounds'].ymax ) * timePercentage;

            var bounds = {};
            bounds.xmin = startingFrame['bounds'].xmin + boundsXminOffset;
            bounds.ymin = startingFrame['bounds'].ymin + boundsYminOffset;
            bounds.xmax = startingFrame['bounds'].xmax + boundsXmaxOffset;
            bounds.ymax = startingFrame['bounds'].ymax + boundsYmaxOffset;

            return bounds;
            }

         return null;
         };

      this.toString = function()
         {
         return 'KeyframeInterval' +
                '[startTime=' + startingFrame['time'] +
                ',endTime=' + endingFrame['time'] +
                ',actualDuration=' + actualDuration +
                ',desiredDuration=' + desiredDuration +
                ',playbackRate=' + playbackRate +
                ',timeDirection=' + timeDirection +
                ',startingRunningDurationInMillis=' + startingRunningDurationInMillis +
                ',endingRunningDurationInMillis=' + endingRunningDurationInMillis +
                ']';
         };
      };

   })();
