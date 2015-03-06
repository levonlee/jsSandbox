/*
 * Copyright 2005 Joe Walker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Declare a constructor function to which we can add real functions.
 * @constructor
 */

/**
 * Version 1.83 (02/21/06)
 */

function DWREngine() { }

/**
 * Set an alternative error handler from the default alert box.
 * @see http://getahead.ltd.uk/dwr/browser/engine/errors
 */
DWREngine.setErrorHandler = function(handler) {
  DWREngine._errorHandler = handler;
};

/**
 * Set an alternative warning handler from the default alert box.
 * @see http://getahead.ltd.uk/dwr/browser/engine/errors
 */
DWREngine.setWarningHandler = function(handler) {
  DWREngine._warningHandler = handler;
};

/**
 * Set a default timeout value for all calls. 0 (the default) turns timeouts off.
 * @see http://getahead.ltd.uk/dwr/browser/engine/errors
 */
DWREngine.setTimeout = function(timeout) {
  DWREngine._timeout = timeout;
};

/**
 * The Pre-Hook is called before any DWR remoting is done.
 * @see http://getahead.ltd.uk/dwr/browser/engine/hooks
 */
DWREngine.setPreHook = function(handler) {
  DWREngine._preHook = handler;
};

/**
 * The Post-Hook is called after any DWR remoting is done.
 * @see http://getahead.ltd.uk/dwr/browser/engine/hooks
 */
DWREngine.setPostHook = function(handler) {
  DWREngine._postHook = handler;
};

/** XHR remoting method constant. See DWREngine.setMethod() */
DWREngine.XMLHttpRequest = 1;

/** XHR remoting method constant. See DWREngine.setMethod() */
DWREngine.IFrame = 2;

/**
 * Set the preferred remoting method.
 * @param newmethod One of DWREngine.XMLHttpRequest or DWREngine.IFrame
 * @see http://getahead.ltd.uk/dwr/browser/engine/options
 */
DWREngine.setMethod = function(newmethod) {
  if (newmethod != DWREngine.XMLHttpRequest && newmethod != DWREngine.IFrame) {
    DWREngine._handleError("Remoting method must be one of DWREngine.XMLHttpRequest or DWREngine.IFrame");
    return;
  }
  DWREngine._method = newmethod;
};

/**
 * Which HTTP verb do we use to send results? Must be one of "GET" or "POST".
 * @see http://getahead.ltd.uk/dwr/browser/engine/options
 */
DWREngine.setVerb = function(verb) {
  if (verb != "GET" && verb != "POST") {
    DWREngine._handleError("Remoting verb must be one of GET or POST");
    return;
  }
  DWREngine._verb = verb;
};

/**
 * Ensure that remote calls happen in the order in which they were sent? (Default: false)
 * @see http://getahead.ltd.uk/dwr/browser/engine/ordering
 */
DWREngine.setOrdered = function(ordered) {
  DWREngine._ordered = ordered;
};

/**
 * Do we ask the XHR object to be asynchronous? (Default: true)
 * @see http://getahead.ltd.uk/dwr/browser/engine/options
 */
DWREngine.setAsync = function(async) {
  DWREngine._async = async;
};

/**
 * The default message handler.
 * @see http://getahead.ltd.uk/dwr/browser/engine/errors
 */
DWREngine.defaultMessageHandler = function(message) {
  if (typeof message == "object" && message.name == "Error" && message.description) {
    alert("Error: " + message.description);
  }
  else {
    alert(message);
  }
};

/**
 * For reduced latency you can group several remote calls together using a batch.
 * @see http://getahead.ltd.uk/dwr/browser/engine/batch
 */
DWREngine.beginBatch = function() {
  if (DWREngine._batch) {
    DWREngine._handleError("Batch already started.");
    return;
  }
  // Setup a batch
  DWREngine._batch = {};
  DWREngine._batch.map = {};
  DWREngine._batch.paramCount = 0;
  DWREngine._batch.map.callCount = 0;
  DWREngine._batch.ids = [];
  DWREngine._batch.preHooks = [];
  DWREngine._batch.postHooks = [];
};

/**
 * Finished grouping a set of remote calls together. Go and execute them all.
 * @see http://getahead.ltd.uk/dwr/browser/engine/batch
 */
DWREngine.endBatch = function(options) {
  var batch = DWREngine._batch;
  if (batch == null) {
    DWREngine._handleError("No batch in progress.");
    return;
  }
  // Merge the global batch level properties into the batch meta data
  if (options && options.preHook) batch.preHooks.unshift(options.preHook);
  if (options && options.postHook) batch.postHooks.push(options.postHook);
  if (DWREngine._preHook) batch.preHooks.unshift(DWREngine._preHook);
  if (DWREngine._postHook) batch.postHooks.push(DWREngine._postHook);

  if (batch.method == null) batch.method = DWREngine._method;
  if (batch.verb == null) batch.verb = DWREngine._verb;
  if (batch.async == null) batch.async = DWREngine._async;
  if (batch.timeout == null) batch.timeout = DWREngine._timeout;

  batch.completed = false;

  // We are about to send so this batch should not be globally visible
  DWREngine._batch = null;

  // If we are in ordered mode, then we don't send unless the list of sent
  // items is empty
  if (!DWREngine._ordered) {
    DWREngine._sendData(batch);
    DWREngine._batches[DWREngine._batches.length] = batch;
  }
  else {
    if (DWREngine._batches.length == 0) {
      // We aren't waiting for anything, go now.
      DWREngine._sendData(batch);
      DWREngine._batches[DWREngine._batches.length] = batch;
    }
    else {
      // Push the batch onto the waiting queue
      DWREngine._batchQueue[DWREngine._batchQueue.length] = batch;
    }
  }
};

//==============================================================================
// Only private stuff below here
//==============================================================================

/** A function to call if something fails. */
DWREngine._errorHandler = DWREngine.defaultMessageHandler;

/** A function to call to alert the user to some breakage. */
DWREngine._warningHandler = DWREngine.defaultMessageHandler;

/** A function to be called before requests are marshalled. Can be null. */
DWREngine._preHook = null;

/** A function to be called after replies are received. Can be null. */
DWREngine._postHook = null;

/** An array of the batches that we have sent and are awaiting a reply on. */
DWREngine._batches = [];

/** In ordered mode, the array of batches waiting to be sent */
DWREngine._batchQueue = [];

/** A map of known ids to their handler objects */
DWREngine._handlersMap = {};

/** What is the default remoting method */
DWREngine._method = DWREngine.XMLHttpRequest;

/** What is the default remoting verb (ie GET or POST) */
DWREngine._verb = "POST";

/** Do we attempt to ensure that calls happen in the order in which they were sent? */
DWREngine._ordered = false;

/** Do we make the calls async? */
DWREngine._async = true;

/** The current batch (if we are in batch mode) */
DWREngine._batch = null;

/** The global timeout */
DWREngine._timeout = 0;

/** ActiveX objects to use when we want to convert an xml string into a DOM object. */
DWREngine._DOMDocument = ["Msxml2.DOMDocument.5.0", "Msxml2.DOMDocument.4.0", "Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"];

/** The ActiveX objects to use when we want to do an XMLHttpRequest call. */
DWREngine._XMLHTTP = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];

/**
 * @private Send a request. Called by the Javascript interface stub
 * @param path part of URL after the host and before the exec bit without leading or trailing /s
 * @param scriptName The class to execute
 * @param methodName The method on said class to execute
 * @param func The callback function to which any returned data should be passed
 *       if this is null, any returned data will be ignored
 * @param vararg_params The parameters to pass to the above class
 */
DWREngine._execute = function(path, scriptName, methodName, vararg_params) {
  var singleShot = false;
  if (DWREngine._batch == null) {
    DWREngine.beginBatch();
    singleShot = true;
  }
  // To make them easy to manipulate we copy the arguments into an args array
  var args = [];

  /* added by Rob Gonda */
	  var oWddx = new WddxSerializer();
  /* end added by Rob Gonda */

  for (var i = 0; i < arguments.length - 3; i++) {
	  /* removed by Rob Gonda */
    	//args[i] = arguments[i + 3];
	  /* end removed by Rob Gonda */

	  /* added by Rob Gonda */
	  	if (typeof arguments[i + 3] == "function") {args[i] = arguments[i + 3];}
	  	else {args[i] = oWddx.serialize(arguments[i + 3]);}
	  /* end added by Rob Gonda */
  }
  // All the paths MUST be to the same servlet
  if (DWREngine._batch.path == null) {
    DWREngine._batch.path = path;
  }
  else {
    if (DWREngine._batch.path != path) {
      DWREngine._handleError("Can't batch requests to multiple DWR Servlets.");
      return;
    }
  }
  // From the other params, work out which is the function (or object with
  // call meta-data) and which is the call parameters
  var params;
  var callData;
  var firstArg = args[0];
  var lastArg = args[args.length - 1];

  if (typeof firstArg == "function") {
    callData = { callback:args.shift() };
    params = args;
  }
  else if (typeof lastArg == "function") {
    callData = { callback:args.pop() };
    params = args;
  }
  else if (typeof lastArg == "object" && lastArg.callback != null && typeof lastArg.callback == "function") {
    callData = args.pop();
    params = args;
  }
  else if (firstArg == null) {
    // This could be a null callback function, but if the last arg is also
    // null then we can't tell which is the function unless there are only
    // 2 args, in which case we don't care!
    if (lastArg == null && args.length > 2) {
      if (DWREngine._warningHandler) {
        DWREngine._warningHandler("Ambiguous nulls at start and end of parameter list. Which is the callback function?");
      }
    }
    callData = { callback:args.shift() };
    params = args;
  }
  else if (lastArg == null) {
    callData = { callback:args.pop() };
    params = args;
  }
  else {
    if (DWREngine._warningHandler) {
      DWREngine._warningHandler("Missing callback function or metadata object.");
    }
    return;
  }

  // Get a unique ID for this call
  var random = Math.floor(Math.random() * 10001);
  var id = (random + "_" + new Date().getTime()).toString();
  var prefix = "c" + DWREngine._batch.map.callCount + "-";
  DWREngine._batch.ids.push(id);

  // batchMetaData stuff the we allow in callMetaData for convenience
  if (callData.method != null) {
    DWREngine._batch.method = callData.method;
    delete callData.method;
  }
  if (callData.verb != null) {
    DWREngine._batch.verb = callData.verb;
    delete callData.verb;
  }
  if (callData.async != null) {
    DWREngine._batch.async = callData.async;
    delete callData.async;
  }
  if (callData.timeout != null) {
    DWREngine._batch.timeout = callData.timeout;
    delete callData.timeout;
  }

  // callMetaData stuff that we handle with the rest of the batchMetaData
  if (callData.preHook != null) {
    DWREngine._batch.preHooks.unshift(callData.preHook);
    delete callData.preHook;
  }
  if (callData.postHook != null) {
    DWREngine._batch.postHooks.push(callData.postHook);
    delete callData.postHook;
  }

  // Default the error and warning handlers
  if (callData.errorHandler == null) callData.errorHandler = DWREngine._errorHandler;
  if (callData.warningHandler == null) callData.warningHandler = DWREngine._warningHandler;

  // Save the callMetaData
  DWREngine._handlersMap[id] = callData;

  DWREngine._batch.map[prefix + "scriptName"] = scriptName;
  DWREngine._batch.map[prefix + "methodName"] = methodName;
  DWREngine._batch.map[prefix + "id"] = id;

  // Serialize the parameters into batch.map
  DWREngine._addSerializeFunctions();
  for (i = 0; i < params.length; i++) {
    DWREngine._serializeAll(DWREngine._batch, [], params[i], prefix + "param" + i);
  }
  DWREngine._removeSerializeFunctions();

  // Now we have finished remembering the call, we incr the call count
  DWREngine._batch.map.callCount++;
  if (singleShot) {
    DWREngine.endBatch();
  }
};

/**
 * @private Actually send the block of data in the batch object.
 */
DWREngine._sendData = function(batch) {
  // If the batch is empty, don't send anything
  if (batch.map.callCount == 0) return;
  // Call any pre-hooks
  for (var i = 0; i < batch.preHooks.length; i++) {
    batch.preHooks[i]();
  }
  batch.preHooks = null;
  // Set a timeout
  if (batch.timeout && batch.timeout != 0) {
    batch.interval = setInterval(function() {
      clearInterval(batch.interval);
      DWREngine._abortRequest(batch);
    }, batch.timeout);
  }
  // A quick string to help people that use web log analysers
  var statsInfo;
  if (batch.map.callCount == 1) {
    statsInfo = batch.map["c0-scriptName"] + "." + batch.map["c0-methodName"] + ".dwr";
  }
  else {
    statsInfo = "Multiple." + batch.map.callCount + ".dwr";
  }

  // Get setup for XMLHttpRequest if possible
  if (batch.method == DWREngine.XMLHttpRequest) {
    if (window.XMLHttpRequest) {
      batch.req = new XMLHttpRequest();
    }
    // IE5 for the mac claims to support window.ActiveXObject, but throws an error when it's used
    else if (window.ActiveXObject && !(navigator.userAgent.indexOf('Mac') >= 0 && navigator.userAgent.indexOf("MSIE") >= 0)) {
      batch.req = DWREngine._newActiveXObject(DWREngine._XMLHTTP);
    }
  }

  /* removed by Rob Gonda */
   //var query = "";
  /* end removed by Rob Gonda */
  
  /* added by Rob Gonda */
	  var query = "method=initajax&";
	/* var query = "method=init&"; */  
  /* end added by Rob Gonda */

  var prop;
  if (batch.req) {
    batch.map.xml = "true";
    // Proceed using XMLHttpRequest
    if (batch.async) {
      batch.req.onreadystatechange = function() {
        DWREngine._stateChange(batch);
      };
    }
    // Workaround for Safari 1.x POST bug
    var indexSafari = navigator.userAgent.indexOf('Safari/');
    if (indexSafari >= 0) {
      // So this is Safari, are we on 1.x? POST is broken
      var version = navigator.userAgent.substring(indexSafari + 7);
      var verNum = parseInt(version, 10);
      if (verNum < 400) {
        batch.verb == "GET";
      }
    }
    if (batch.verb == "GET") {
      // Some browsers (Opera/Safari2) seem to fail to convert the value
      // of batch.map.callCount to a string in the loop below so we do it
      // manually here.
      batch.map.callCount = "" + batch.map.callCount;

      for (prop in batch.map) {
        var qkey = encodeURIComponent(prop);
        var qval = encodeURIComponent(batch.map[prop]);
        if (qval == "") {
          if (DWREngine._warningHandler) {
            DWREngine._warningHandler("Found empty qval for qkey=" + qkey);
          }
        }
        query += qkey + "=" + qval + "&";
      }
      query = query.substring(0, query.length - 1);

      try {
        /* removed by Rob Gonda */
			//batch.req.open("GET", batch.path + "/exec/" + statsInfo + "?" + query, batch.async);
        /* end removed by Rob Gonda */
		
        /* added by Rob Gonda */
			batch.req.open("GET", batch.path + "?" + query, batch.async);
			batch.req.setRequestHeader("Referer", location.href);
        /* end added by Rob Gonda */

        batch.req.send(null);
        if (!batch.async) {
          DWREngine._stateChange(batch);
        }
      }
      catch (ex) {
        DWREngine._handleMetaDataError(null, ex);
      }
    }
    else {
      for (prop in batch.map) {
        if (typeof batch.map[prop] != "function") {
	      /* removed by Rob Gonda */
	          //query += prop + "=" + batch.map[prop] + "\n";
	      /* end removed by Rob Gonda */

	      /* added by Rob Gonda */
    	      query += prop + "=" + batch.map[prop] + "&";
	      /* end added by Rob Gonda */
        }
      }

      try {
        // This might include Safari too, but it shouldn't do any harm
        //   if (navigator.userAgent.indexOf('Gecko') >= 0) {
        //     batch.req.setRequestHeader('Connection', 'close');
        //   }

        /* removed by Rob Gonda */
	        //batch.req.open("POST", batch.path + "/exec/" + statsInfo, batch.async);
	        //batch.req.setRequestHeader('Content-Type', 'text/plain');
        /* end removed by Rob Gonda */
			
        /* added by Rob Gonda */
			batch.req.open("POST", batch.path, batch.async);
			batch.req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");			
			batch.req.setRequestHeader("Referer", location.href);
        /* end by Rob Gonda */

        batch.req.send(query);
        if (!batch.async) {
          DWREngine._stateChange(batch);
        }
      }
      catch (ex) {
        DWREngine._handleMetaDataError(null, ex);
      }
    }
  }
  else {
    batch.map.xml = "false";
    var idname = "dwr-if-" + batch.map["c0-id"];
    // Proceed using iframe
    batch.div = document.createElement('div');
    batch.div.innerHTML = "<iframe frameborder='0' width='0' height='0' id='" + idname + "' name='" + idname + "'></iframe>";
    document.body.appendChild(batch.div);
    batch.iframe = document.getElementById(idname);
    batch.iframe.setAttribute('style', 'width:0px; height:0px; border:0px;');

    if (batch.verb == "GET") {
      for (prop in batch.map) {
        if (typeof batch.map[prop] != "function") {
          query += encodeURIComponent(prop) + "=" + encodeURIComponent(batch.map[prop]) + "&";
        }
      }
      query = query.substring(0, query.length - 1);

	  /* removed by Rob Gonda */
	      //batch.iframe.setAttribute('src', batch.path + "/exec/" + statsInfo + "?" + query);
	  /* removed by Rob Gonda */
	  
	   /* added by Rob Gonda */
		  batch.iframe.setAttribute('src', batch.path + "?" + query);
	   /* end added by Rob Gonda */

      document.body.appendChild(batch.iframe);
    }
    else {
      batch.form = document.createElement('form');
      batch.form.setAttribute('id', 'dwr-form');
	  /* removed by Rob Gonda */
	      //batch.form.setAttribute('action', batch.path + "/exec" + statsInfo);
	  /* end removed by Rob Gonda */
      
	   /* added by Rob Gonda */
		  batch.form.setAttribute('action', batch.path);
	   /* end added by Rob Gonda */

      batch.form.setAttribute('target', idname);
      batch.form.target = idname;
      batch.form.setAttribute('method', 'post');
      for (prop in batch.map) {
        var formInput = document.createElement('input');
        formInput.setAttribute('type', 'hidden');
        formInput.setAttribute('name', prop);
        formInput.setAttribute('value', batch.map[prop]);
        batch.form.appendChild(formInput);
      }

      document.body.appendChild(batch.form);
      batch.form.submit();
    }
  }
};

/**
 * @private Called by XMLHttpRequest to indicate that something has happened
 */
DWREngine._stateChange = function(batch) {
  if (!batch.completed && batch.req.readyState == 4) {
    	try {
			/* removed by Rob Gonda */
		      //var reply = batch.req.responseText;
			/* end removed by Rob Gonda */
			
			/* Added by Rob Gonda */
			var reply = batch.req.responseText.replace(/<meta name="coldfusionmxedition"[^>]*>/gi, "");
			/* end Added by Rob Gonda */
	
			try 
			{
				if(batch.req.status !== undefined && batch.req.status != 0){
					var status = batch.req.status;
				}
				else {
					var status = 13030;
				}
			} 
			catch (e) {
		    	// 13030 is the custom code to indicate the condition -- in Mozilla/FF --
				// when the o object's status and statusText properties are
				// unavailable, and a query attempt throws an exception.
				var status = 13030;
			}  

			if (reply == null || reply == "") {
				//DWREngine._handleMetaDataError(null, "No data received from server");
				return;
	  		}
	
			// This should get us out of 404s etc.
	  		if (reply.search("DWREngine._handle") == -1) {
				//DWREngine._handleMetaDataError(null, "Invalid reply from server");
				return;
	  		}
	
			if (status != 200) {
				if (reply == null) reply = "Unknown error occured";
				//DWREngine._handleMetaDataError(null, reply);
				return;
	  		}

  			eval(reply);

  // We're done. Clear up
  DWREngine._clearUp(batch);
    }
    catch (ex) {
      if (ex == null) ex = "Unknown error occured";
      DWREngine._handleMetaDataError(null, ex);
    }
    finally {
      // If there is anything on the queue waiting to go out, then send it.
      // We don't need to check for ordered mode, here because when ordered mode
      // gets turned off, we still process *waiting* batches in an ordered way.
      if (DWREngine._batchQueue.length != 0) {
        var sendbatch = DWREngine._batchQueue.shift();
        DWREngine._sendData(sendbatch);
        DWREngine._batches[DWREngine._batches.length] = sendbatch;
      }
    }
  }
};

/**
 * @private Called by reply scripts generated as a result of remote requests
 * @param id The identifier of the call that we are handling a response for
 * @param reply The data to pass to the callback function
 */
DWREngine._handleResponse = function(id, reply) {
  // Clear this callback out of the list - we don't need it any more
  var handlers = DWREngine._handlersMap[id];
  DWREngine._handlersMap[id] = null;
  // TODO: How can we do this - delete DWREngine._handlersMap.id
  if (handlers) {
    // Error handlers inside here indicate an error that is nothing to do
    // with DWR so we handle them differently.
    try {
      if (handlers.callback) handlers.callback(reply);
    }
    catch (ex) {
      DWREngine._handleMetaDataError(handlers, ex);
    }
  }

  // Finalize the call for IFrame transport 
  if (DWREngine._method == DWREngine.IFrame) {
    var responseBatch = DWREngine._batches[DWREngine._batches.length-1];	
    // Only finalize after the last call has been handled
    if (responseBatch.map["c"+(responseBatch.map.callCount-1)+"-id"] == id) {
      DWREngine._clearUp(responseBatch);
    }
  }
};

/**
 * @private This method is called by Javascript that is emitted by server
 */
DWREngine._handleServerError = function(id, error) {
  // Clear this callback out of the list - we don't need it any more
  var handlers = DWREngine._handlersMap[id];
  DWREngine._handlersMap[id] = null;
  if (error.message) {
    DWREngine._handleMetaDataError(handlers, error.message, error);
  }
  else {
    DWREngine._handleMetaDataError(handlers, error);
  }
};

/**
 * @private Called as a result of a request timeout
 */ 
DWREngine._abortRequest = function(batch) {
  if (batch && batch.metadata != null && !batch.completed) {
    DWREngine._clearUp(batch);
    if (batch.req) batch.req.abort();
    // Call all the timeout errorHandlers
    var handlers;
    var id;
    for (var i = 0; i < batch.ids.length; i++) {
      id = batch.ids[i];
      handlers = DWREngine._handlersMap[id];
      DWREngine._handleMetaDataError(handlers, "Timeout");
    }
  }
};

/**
 * @private A call has finished by whatever means and we need to shut it all down.
 */
DWREngine._clearUp = function(batch) {
  if (batch.completed) {
    alert("double complete");
    return;
  }

  // IFrame tidyup
  if (batch.div) batch.div.parentNode.removeChild(batch.div);
  if (batch.iframe) batch.iframe.parentNode.removeChild(batch.iframe);
  if (batch.form) batch.form.parentNode.removeChild(batch.form);

  // XHR tidyup: avoid IE handles increase
  if (batch.req) delete batch.req;

  for (var i = 0; i < batch.postHooks.length; i++) {
    batch.postHooks[i]();
  }
  batch.postHooks = null;

  // TODO: There must be a better way???
  for (var i = 0; i < DWREngine._batches.length; i++) {
    if (DWREngine._batches[i] == batch) {
      DWREngine._batches.splice(i, 1);

      break;
    }
  }

  batch.completed = true;
};

/**
 * @private Generic error handling routing to save having null checks everywhere.
 */
DWREngine._handleError = function(reason, ex) {
  if (DWREngine._errorHandler) {
    DWREngine._errorHandler(reason, ex);
  }
};

/**
 * @private Generic error handling routing to save having null checks everywhere.
 */
DWREngine._handleMetaDataError = function(handlers, reason, ex) {
  if (handlers && typeof handlers.errorHandler == "function") {
    handlers.errorHandler(reason, ex);
  }
  else {
    DWREngine._handleError(reason, ex);
  }
};

/**
 * @private Hack a polymorphic dwrSerialize() function on all basic types. Yeulch
 */
DWREngine._addSerializeFunctions = function() {
  Object.prototype.dwrSerialize = DWREngine._serializeObject;
  Array.prototype.dwrSerialize = DWREngine._serializeArray;
  Boolean.prototype.dwrSerialize = DWREngine._serializeBoolean;
  Number.prototype.dwrSerialize = DWREngine._serializeNumber;
  String.prototype.dwrSerialize = DWREngine._serializeString;
  Date.prototype.dwrSerialize = DWREngine._serializeDate;
};

/**
 * @private Remove the hacked polymorphic dwrSerialize() function on all basic types.
 */
DWREngine._removeSerializeFunctions = function() {
  delete Object.prototype.dwrSerialize;
  delete Array.prototype.dwrSerialize;
  delete Boolean.prototype.dwrSerialize;
  delete Number.prototype.dwrSerialize;
  delete String.prototype.dwrSerialize;
  delete Date.prototype.dwrSerialize;
};

/**
 * @private Marshall a data item
 * @param batch A map of variables to how they have been marshalled
 * @param referto An array of already marshalled variables to prevent recurrsion
 * @param data The data to be marshalled
 * @param name The name of the data being marshalled
 */
DWREngine._serializeAll = function(batch, referto, data, name) {
  if (data == null) {
    batch.map[name] = "null:null";
    return;
  }

  switch (typeof data) {
  case "boolean":
    batch.map[name] = "boolean:" + data;
    break;

  case "number":
    batch.map[name] = "number:" + data;
    break;

  case "string":
    batch.map[name] = "string:" + encodeURIComponent(data);
    break;

  case "object":
    if (data.dwrSerialize) {
      batch.map[name] = data.dwrSerialize(batch, referto, data, name);
    }
    else if (data.nodeName) {
      batch.map[name] = DWREngine._serializeXml(batch, referto, data, name);
    }
    else {
      if (DWREngine._warningHandler) {
        DWREngine._warningHandler("Object without dwrSerialize: " + typeof data + ", attempting default converter.");
      }
      batch.map[name] = "default:" + data;
    }
    break;

  case "function":
    // We just ignore functions.
    break;

  default:
    if (DWREngine._warningHandler) {
      DWREngine._warningHandler("Unexpected type: " + typeof data + ", attempting default converter.");
    }
    batch.map[name] = "default:" + data;
    break;
  }
};

/** @private Have we already converted this object? */
DWREngine._lookup = function(referto, data, name) {
  var lookup;
  // Can't use a map: http://getahead.ltd.uk/ajax/javascript-gotchas
  for (var i = 0; i < referto.length; i++) {
    if (referto[i].data == data) {
      lookup = referto[i];
      break;
    }
  }
  if (lookup) {
    return "reference:" + lookup.name;
  }
  referto.push({ data:data, name:name });
  return null;
};

/** @private Marshall an object */
DWREngine._serializeObject = function(batch, referto, data, name) {
  var ref = DWREngine._lookup(referto, this, name);
  if (ref) return ref;

  if (data.nodeName) {
    return DWREngine._serializeXml(batch, referto, data, name);
  }

  // treat objects as an associative arrays
  var reply = "Object:{";
  var element;
  for (element in this)  {
    if (element != "dwrSerialize") {
      batch.paramCount++;
      var childName = "c" + DWREngine._batch.map.callCount + "-e" + batch.paramCount;
      DWREngine._serializeAll(batch, referto, this[element], childName);

      reply += encodeURIComponent(element);
      reply += ":reference:";
      reply += childName;
      reply += ", ";
    }
  }

  if (reply.substring(reply.length - 2) == ", ") {
    reply = reply.substring(0, reply.length - 2);
  }
  reply += "}";

  return reply;
};

/** @private Marshall an object */
DWREngine._serializeXml = function(batch, referto, data, name) {
  var ref = DWREngine._lookup(referto, this, name);
  if (ref) {
    return ref;
  }
  var output;
  if (window.XMLSerializer) {
    var serializer = new XMLSerializer();
    output = serializer.serializeToString(data);
  }
  else {
    output = data.toXml;
  }
  return "XML:" + encodeURIComponent(output);
};

/** @private Marshall an array */
DWREngine._serializeArray = function(batch, referto, data, name) {
  var ref = DWREngine._lookup(referto, this, name);
  if (ref) return ref;

  var reply = "Array:[";
  for (var i = 0; i < this.length; i++) {
    if (i != 0) {
      reply += ",";
    }

    batch.paramCount++;
    var childName = "c" + DWREngine._batch.map.callCount + "-e" + batch.paramCount;
    DWREngine._serializeAll(batch, referto, this[i], childName);
    reply += "reference:";
    reply += childName;
  }
  reply += "]";

  return reply;
};

/** @private Marshall a Boolean */
DWREngine._serializeBoolean = function(batch, referto, data, name) {
  return "Boolean:" + this;
};

/** @private Marshall a Number */
DWREngine._serializeNumber = function(batch, referto, data, name) {
  return "Number:" + this;
};

/** @private Marshall a String */
DWREngine._serializeString = function(batch, referto, data, name) {
  return "String:" + encodeURIComponent(this);
};

/** @private Marshall a Date */
DWREngine._serializeDate = function(batch, referto, data, name) {
  return "Date:" + this.getTime();
};

/** @private Convert an XML string into a DOM object. */
DWREngine._unserializeDocument = function(xml) {
  var dom;
  if (window.DOMParser) {
    var parser = new DOMParser();
    dom = parser.parseFromString(xml, "text/xml");
    if (!dom.documentElement || dom.documentElement.tagName == "parsererror") {
      var message = dom.documentElement.firstChild.data;
      message += "\n" + dom.documentElement.firstChild.nextSibling.firstChild.data;
      throw message;
    }
    return dom;
  }
  else if (window.ActiveXObject) {
    dom = DWREngine._newActiveXObject(DWREngine._DOMDocument);
    dom.loadXML(xml);
    // What happens on parse fail with IE?
    return dom;
  }
  //else if (window.XMLHttpRequest) {
  //  // Hack with XHR to get at Safari's parser
  //  var req = new XMLHttpRequest;
  //  var url = "data:application/xml;charset=utf-8," + encodeURIComponent(xml);
  //  req.open("GET", url, false);
  //  req.send(null);
  //  return req.responseXML;
  //}
  else {
    var div = document.createElement('div');
    div.innerHTML = xml;
    return div;
  }
};

/**
 * @private Helper to find an ActiveX object that works.
 * @param axarray An array of strings to attempt to create ActiveX objects from
 */
DWREngine._newActiveXObject = function(axarray) {
  var returnValue;  
  for (var i = 0; i < axarray.length; i++) {
    try {
      returnValue = new ActiveXObject(axarray[i]);
      break;
    }
    catch (ex) {
    }
  }
  return returnValue;
};

/** @private To make up for the lack of encodeURIComponent() on IE5.0 */
if (typeof window.encodeURIComponent === 'undefined') {
  DWREngine._utf8 = function(wide) {
    wide = "" + wide; // Make sure it is a string
    var c;
    var s;
    var enc = "";
    var i = 0;
    while (i < wide.length) {
      c = wide.charCodeAt(i++);
      // handle UTF-16 surrogates
      if (c >= 0xDC00 && c < 0xE000) continue;
      if (c >= 0xD800 && c < 0xDC00) {
        if (i >= wide.length) continue;
        s = wide.charCodeAt(i++);
        if (s < 0xDC00 || c >= 0xDE00) continue;
        c = ((c - 0xD800) << 10) + (s - 0xDC00) + 0x10000;
      }
      // output value
      if (c < 0x80) {
        enc += String.fromCharCode(c);
      }
      else if (c < 0x800) {
        enc += String.fromCharCode(0xC0 + (c >> 6), 0x80 + (c & 0x3F));
      }
      else if (c < 0x10000) {
        enc += String.fromCharCode(0xE0 + (c >> 12), 0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
      }
      else {
        enc += String.fromCharCode(0xF0 + (c >> 18), 0x80 + (c >> 12 & 0x3F), 0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
      }
    }
    return enc;
  }

  DWREngine._hexchars = "0123456789ABCDEF";

  DWREngine._toHex = function(n) {
    return DWREngine._hexchars.charAt(n >> 4) + DWREngine._hexchars.charAt(n & 0xF);
  }

  DWREngine._okURIchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

  window.encodeURIComponent = function(s)  {
    s = DWREngine._utf8(s);
    var c;
    var enc = "";
    for (var i= 0; i<s.length; i++) {
      if (DWREngine._okURIchars.indexOf(s.charAt(i)) == -1) {
        enc += "%" + DWREngine._toHex(s.charCodeAt(i));
      }
      else {
        enc += s.charAt(i);
      }
    }
    return enc;
  }
}

/** @private To make up for the lack of Array.splice() on IE5.0 */
if (typeof Array.prototype.splice === 'undefined') {
  Array.prototype.splice = function(ind, cnt)
  {
    if (arguments.length == 0) {
      return ind;
    }
    if (typeof ind != "number") {
      ind = 0;
    }
    if (ind < 0) {
      ind = Math.max(0,this.length + ind);
    }
    if (ind > this.length) {
      if (arguments.length > 2) {
        ind = this.length;
      }
      else {
        return [];
      }
    }
    if (arguments.length < 2) {
      cnt = this.length-ind;
    }

    cnt = (typeof cnt == "number") ? Math.max(0, cnt) : 0;
    removeArray = this.slice(ind, ind + cnt);
    endArray = this.slice(ind + cnt);
    this.length = ind;

    for (var i = 2; i < arguments.length; i++) {
      this[this.length] = arguments[i];
    }
    for (i = 0; i < endArray.length; i++) {
      this[this.length] = endArray[i];
    }

    return removeArray;
  }
}

/** @private To make up for the lack of Array.shift() on IE5.0 */
if (typeof Array.prototype.shift === 'undefined') {
  Array.prototype.shift = function(str) {
    var val = this[0];
    for (var i = 1; i < this.length; ++i) {
      this[i - 1] = this[i];
    }
    this.length--;
    return val;
  }
}

/** @private To make up for the lack of Array.unshift() on IE5.0 */
if (typeof Array.prototype.unshift === 'undefined') {
  Array.prototype.unshift = function() {
    var i = unshift.arguments.length;
    for (var j = this.length - 1; j >= 0; --j) {
      this[j + i] = this[j];
    }
    for (j = 0; j < i; ++j) {
      this[j] = unshift.arguments[j];
    }
  }
}

/** @private To make up for the lack of Array.push() on IE5.0 */
if (typeof Array.prototype.push === 'undefined') {
  Array.prototype.push = function() {
    var sub = this.length;
    for (var i = 0; i < push.arguments.length; ++i) {
      this[sub] = push.arguments[i];
      sub++;
    }
  }
}

/** @private To make up for the lack of Array.pop() on IE5.0 */
if (typeof Array.prototype.pop === 'undefined') {
  Array.prototype.pop = function() {
    var lastElement = this[this.length - 1];
    this.length--;
    return lastElement;
  }
}

/*
 * Copyright 2005 Joe Walker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Declare a constructor function to which we can add real functions.
 * @constructor
 */
/**
 * Version 1.47 (01/18/06)
 */
function DWRUtil() { }

/**
 * Enables you to react to return being pressed in an input
 * @see http://getahead.ltd.uk/dwr/browser/util/selectrange
 */
DWRUtil.onReturn = function(event, action) {
  if (!event) {
    event = window.event;
  }
  if (event && event.keyCode && event.keyCode == 13) {
    action();
  }
};

/**
 * Select a specific range in a text box. Useful for 'google suggest' type functions.
 * @see http://getahead.ltd.uk/dwr/browser/util/selectrange
 */
DWRUtil.selectRange = function(ele, start, end) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("selectRange() can't find an element with id: " + orig + ".");
    return;
  }
  if (ele.setSelectionRange) {
    ele.setSelectionRange(start, end);
  }
  else if (ele.createTextRange) {
    var range = ele.createTextRange();
    range.moveStart("character", start);
    range.moveEnd("character", end - ele.value.length);
    range.select();
  }
  ele.focus();
};

/**
 * Find the element in the current HTML document with the given id or ids
 * @see http://getahead.ltd.uk/dwr/browser/util/$
 */
var $;
if (!$ && document.getElementById) {
  $ = function() {
    var elements = new Array();
    for (var i = 0; i < arguments.length; i++) {
      var element = arguments[i];
      if (typeof element == 'string') {
        element = document.getElementById(element);
      }
      if (arguments.length == 1) {
        return element;
      }
      elements.push(element);
    }
    return elements;
  }
}
else if (!$ && document.all) {
  $ = function() {
    var elements = new Array();
    for (var i = 0; i < arguments.length; i++) {
      var element = arguments[i];
      if (typeof element == 'string') {
        element = document.all[element];
      }
      if (arguments.length == 1) {
        return element;
      }
      elements.push(element);
    }
    return elements;
  }
}

/**
 * Like toString but aimed at debugging
 * @see http://getahead.ltd.uk/dwr/browser/util/todescriptivestring
 */
DWRUtil.toDescriptiveString = function(data, level, depth) {
  var reply = "";
  var i = 0;
  var value;
  var obj;
  if (level == null) level = 0;
  if (depth == null) depth = 0;
  if (data == null) return "null";
  if (DWRUtil._isArray(data)) {
    if (data.length == 0) reply += "[]";
    else {
      if (level != 0) reply += "[\n";
      else reply = "[";
      for (i = 0; i < data.length; i++) {
        try {
          obj = data[i];
          if (obj == null || typeof obj == "function") {
            continue;
          }
          else if (typeof obj == "object") {
            if (level > 0) value = DWRUtil.toDescriptiveString(obj, level - 1, depth + 1);
            else value = DWRUtil._detailedTypeOf(obj);
          }
          else {
            value = "" + obj;
            value = value.replace(/\/n/g, "\\n");
            value = value.replace(/\/t/g, "\\t");
          }
        }
        catch (ex) {
          value = "" + ex;
        }
       if (level != 0)  {
          reply += DWRUtil._indent(level, depth + 2) + value + ", \n";
       }
        else {
          if (value.length > 13) value = value.substring(0, 10) + "...";
          reply += value + ", ";
          if (i > 5) {
            reply += "...";
            break;
          }
        }
      }
      if (level != 0) reply += DWRUtil._indent(level, depth) + "]";
      else reply += "]";
    }
    return reply;
  }
  if (typeof data == "string" || typeof data == "number" || DWRUtil._isDate(data)) {
    return data.toString();
  }
  if (typeof data == "object") {
    var typename = DWRUtil._detailedTypeOf(data);
    if (typename != "Object")  reply = typename + " ";
    if (level != 0) reply += "{\n";
    else reply = "{";
    var isHtml = DWRUtil._isHTMLElement(data);
    for (var prop in data) {
      if (isHtml) {
        // HTML nodes have far too much stuff. Chop out the constants
        if (prop.toUpperCase() == prop || prop == "title" ||
          prop == "lang" || prop == "dir" || prop == "className" ||
          prop == "form" || prop == "name" || prop == "prefix" ||
          prop == "namespaceURI" || prop == "nodeType" ||
          prop == "firstChild" || prop == "lastChild" ||
          prop.match(/^offset/)) {
          continue;
        }
      }
      value = "";
      try {
        obj = data[prop];
        if (obj == null || typeof obj == "function") {
          continue;
        }
        else if (typeof obj == "object") {
          if (level > 0) {
            value = "\n";
            value += DWRUtil._indent(level, depth + 2);
            value = DWRUtil.toDescriptiveString(obj, level - 1, depth + 1);
          }
          else {
            value = DWRUtil._detailedTypeOf(obj);
          }
        }
        else {
          value = "" + obj;
          value = value.replace(/\/n/g, "\\n");
          value = value.replace(/\/t/g, "\\t");
        }
      }
      catch (ex) {
        value = "" + ex;
      }
      if (level == 0 && value.length > 13) value = value.substring(0, 10) + "...";
      var propStr = prop;
      if (propStr.length > 30) propStr = propStr.substring(0, 27) + "...";
      if (level != 0) reply += DWRUtil._indent(level, depth + 1);
      reply += prop + ":" + value + ", ";
      if (level != 0) reply += "\n";
      i++;
      if (level == 0 && i > 5) {
        reply += "...";
        break;
      }
    }
    reply += DWRUtil._indent(level, depth);
    reply += "}";
    return reply;
  }
  return data.toString();
};

/**
 * @private Indenting for DWRUtil.toDescriptiveString
 */
DWRUtil._indent = function(level, depth) {
  var reply = "";
  if (level != 0) {
    for (var j = 0; j < depth; j++) {
      reply += "\u00A0\u00A0";
    }
    reply += " ";
  }
  return reply;
};

/**
 * Setup a GMail style loading message.
 * @see http://getahead.ltd.uk/dwr/browser/util/useloadingmessage
 */
DWRUtil.useLoadingMessage = function(message) {
  var loadingMessage;
  if (message) loadingMessage = message;
  else loadingMessage = "Loading";
  DWREngine.setPreHook(function() {
    var disabledZone = $('disabledZone');
	  
    if (!disabledZone) {
      disabledZone = document.createElement('div');
      disabledZone.setAttribute('id', 'disabledZone');
      disabledZone.style.position = "absolute";
      disabledZone.style.zIndex = "1000";
      disabledZone.style.left = "0px";
      disabledZone.style.top = "0px";
      disabledZone.style.width = "100%";
      disabledZone.style.height = "100%";
      document.body.appendChild(disabledZone);
      var messageZone = document.createElement('div');
      messageZone.setAttribute('id', 'messageZone');
      messageZone.style.position = "absolute";
      messageZone.style.top = "0px";
      messageZone.style.right = "0px";
      messageZone.style.background = "red";
      messageZone.style.color = "white";
      messageZone.style.fontFamily = "Arial,Helvetica,sans-serif";
      messageZone.style.padding = "4px";
      disabledZone.appendChild(messageZone);
      var text = document.createTextNode(loadingMessage);
      messageZone.appendChild(text);
    }
    else {
      $('messageZone').innerHTML = loadingMessage;
      disabledZone.style.visibility = 'visible';
    }
  });
  DWREngine.setPostHook(function() {
    $('disabledZone').style.visibility = 'hidden';
  });
}

/**
 * Set the value an HTML element to the specified value.
 * @see http://getahead.ltd.uk/dwr/browser/util/setvalue
 */
DWRUtil.setValue = function(ele, val) {
  if (val == null) val = "";

  var orig = ele;
  var nodes, i;

  ele = $(ele);
  // We can work with names and need to sometimes for radio buttons
  if (ele == null) {
    nodes = document.getElementsByName(orig);
    if (nodes.length >= 1) {
      ele = nodes.item(0);
    }
  }
  if (ele == null) {
    DWRUtil.debug("setValue() can't find an element with id/name: " + orig + ".");
    return;
  }

  if (DWRUtil._isHTMLElement(ele, "select")) {
    if (ele.type == "select-multiple" && DWRUtil._isArray(val)) {
      DWRUtil._selectListItems(ele, val);
      }
    else {
      DWRUtil._selectListItem(ele, val);
    }
    return;
  }

  if (DWRUtil._isHTMLElement(ele, "input")) {
    if (nodes && ele.type == "radio") {
      for (i = 0; i < nodes.length; i++) {
        if (nodes.item(i).type == "radio") {
          nodes.item(i).checked = (nodes.item(i).value == val);
        }
      }
    }
    else {
      switch (ele.type) {
      case "checkbox":
      case "check-box":
      case "radio":
        ele.checked = (val == true);
        return;
      default:
        ele.value = val;
        return;
      }
    }
  }

  if (DWRUtil._isHTMLElement(ele, "textarea")) {
    ele.value = val;
    return;
  }

  // If the value to be set is a DOM object then we try importing the node
  // rather than serializing it out
  if (val.nodeType) {
    if (val.nodeType == 9 /*Node.DOCUMENT_NODE*/) {
      val = val.documentElement;
    }

    val = DWRUtil._importNode(ele.ownerDocument, val, true);
    ele.appendChild(val);
    return;
  }

  // Fall back to innerHTML
  ele.innerHTML = val;
};

/**
 * @private Find multiple items in a select list and select them. Used by setValue()
 * @param ele The select list item
 * @param val The array of values to select
 */
DWRUtil._selectListItems = function(ele, val) {
  // We deal with select list elements by selecting the matching option
  // Begin by searching through the values
  var found  = false;
  var i;
  var j;
  for (i = 0; i < ele.options.length; i++) {
    ele.options[i].selected = false;
    for (j = 0; j < val.length; j++) {
      if (ele.options[i].value == val[j]) {
        ele.options[i].selected = true;
      }
    }
  }
  // If that fails then try searching through the visible text
  if (found) return;

  for (i = 0; i < ele.options.length; i++) {
    for (j = 0; j < val.length; j++) {
      if (ele.options[i].text == val[j]) {
        ele.options[i].selected = true;
      }
    }
  }
};

/**
 * @private Find an item in a select list and select it. Used by setValue()
 * @param ele The select list item
 * @param val The value to select
 */
DWRUtil._selectListItem = function(ele, val) {
  // We deal with select list elements by selecting the matching option
  // Begin by searching through the values
  var found  = false;
  var i;
  for (i = 0; i < ele.options.length; i++) {
    if (ele.options[i].value == val) {
      ele.options[i].selected = true;
      found = true;
    }
    else {
      ele.options[i].selected = false;
    }
  }

  // If that fails then try searching through the visible text
  if (found) return;

  for (i = 0; i < ele.options.length; i++) {
    if (ele.options[i].text == val) {
      ele.options[i].selected = true;
      break;
    }
  }
}

/**
 * Read the current value for a given HTML element.
 * @see http://getahead.ltd.uk/dwr/browser/util/getvalue
 */
DWRUtil.getValue = function(ele) {
  var orig = ele;
  ele = $(ele);
  // We can work with names and need to sometimes for radio buttons, and IE has
  // an annoying bug where
  var nodes = document.getElementsByName(orig);
  if (ele == null && nodes.length >= 1) {
    ele = nodes.item(0);
  }
  if (ele == null) {
    DWRUtil.debug("getValue() can't find an element with id/name: " + orig + ".");
    return "";
  }

  if (DWRUtil._isHTMLElement(ele, "select")) {
    // This is a bit of a scam because it assumes single select
    // but I'm not sure how we should treat multi-select.
    var sel = ele.selectedIndex;
    if (sel != -1) {
      var reply = ele.options[sel].value;
      if (reply == null || reply == "") {
        reply = ele.options[sel].text;
      }

      return reply;
    }
    else {
      return "";
    }
  }

  if (DWRUtil._isHTMLElement(ele, "input")) {
    if (nodes && ele.type == "radio") {
      for (i = 0; i < nodes.length; i++) {
        if (nodes.item(i).type == "radio") {
          if (nodes.item(i).checked) {
            return nodes.item(i).value;
          }
        }
      }
    }
    switch (ele.type) {
    case "checkbox":
    case "check-box":
    case "radio":
      return ele.checked;
    default:
      return ele.value;
    }
  }

  if (DWRUtil._isHTMLElement(ele, "textarea")) {
    return ele.value;
  }

  if (ele.textContent) return ele.textContent;
  else if (ele.innerText) return ele.innerText;
  return ele.innerHTML;
};

/**
 * getText() is like getValue() except that it reads the text (and not the value) from select elements
 * @see http://getahead.ltd.uk/dwr/browser/util/gettext
 */
DWRUtil.getText = function(ele) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("getText() can't find an element with id: " + orig + ".");
    return "";
  }

  if (!DWRUtil._isHTMLElement(ele, "select")) {
    DWRUtil.debug("getText() can only be used with select elements. Attempt to use: " + DWRUtil._detailedTypeOf(ele) + " from  id: " + orig + ".");
    return "";
  }

  // This is a bit of a scam because it assumes single select
  // but I'm not sure how we should treat multi-select.
  var sel = ele.selectedIndex;
  if (sel != -1) {
    return ele.options[sel].text;
  }
  else {
    return "";
  }
};

/**
 * Given a map, call setValue() for all the entries in the map using the entry key as an element id
 * @see http://getahead.ltd.uk/dwr/browser/util/setvalues
 */
DWRUtil.setValues = function(map) {
  for (var property in map) {
    var ele = $(property);
    if (ele != null) {
      var value = map[property];
      DWRUtil.setValue(property, value);
    }
  }
};

/**
 * Given a map, call getValue() for all the entries in the map using the entry key as an element id.
 * Given a string or element that refers to a form, create an object from the elements of the form.
 * @see http://getahead.ltd.uk/dwr/browser/util/getvalues
 */
DWRUtil.getValues = function(data) {
  var ele;
  if (typeof data == "string") ele = $(data);
  if (DWRUtil._isHTMLElement(data)) ele = data;
  if (ele != null) {
    if (ele.elements == null) {
      alert("getValues() requires an object or reference to a form element.");
      return null;
    }
    var reply = {};
    var value;
    for (var i = 0; i < ele.elements.length; i++) {
      if (ele[i].id != null) value = ele[i].id;
      else if (ele[i].value != null) value = ele[i].value;
      else value = "element" + i;
      reply[value] = DWRUtil.getValue(ele[i]);
    }
    return reply;
  }
  else {
    for (var property in data) {
      var ele = $(property);
      if (ele != null) {
        data[property] = DWRUtil.getValue(property);
      }
    }
    return data;
  }
};

/**
 * Add options to a list from an array or map.
 * @see http://getahead.ltd.uk/dwr/browser/lists
 */
DWRUtil.addOptions = function(ele, data, cellFuncs, options) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("addOptions() can't find an element with id: " + orig + ".");
    return;
  }
  var useOptions = DWRUtil._isHTMLElement(ele, "select");
  var useLi = DWRUtil._isHTMLElement(ele, ["ul", "ol"]);
  if (!useOptions && !useLi) {
    DWRUtil.debug("addOptions() can only be used with select elements. Attempt to use: " + DWRUtil._detailedTypeOf(ele));
    return;
  }
  if (data == null) return;
  /* added by Jeff Lester */
  if (!options) options = {};
  options.data = data;
  if (!options.optCreator) options.optCreator = DWRUtil._defaultOptCreator;
  /* end added by Jeff Lester */
  var rowNum;

  var text;
  var value;
  var opt;
  /* added by Jeff Lester */
  if (DWRUtil._isWDDX(data)) {
  //this code does not mix well with the cell functions -- Kenton  
    for (rowNum = 0; rowNum < data.getRowCount(); rowNum++) {
    	//changed functionality to get cell functions to work 2/12/06 - Kenton Gray
      var opt = options.optCreator(options);
      options.rowData = data.getRow(rowNum);
      options.rowIndex = rowNum;
      options.rowNum = rowNum;
      options.data = null;
      options.cellNum = -1;
      opt = DWRUtil._addNewOpt(cellFuncs, options);
      if (opt != null) ele.appendChild(opt);
    }
  /* end added by Jeff Lester */
  } else if (DWRUtil._isArray(data)) {
    // Loop through the data that we do have
    for (var i = 0; i < data.length; i++) {
      if (useOptions) {
        if (arguments[2] != null) {
          if (arguments[3] != null) {
            text = DWRUtil._getValueFrom(data[i], arguments[3]);
            value = DWRUtil._getValueFrom(data[i], arguments[2]);
          }
          else {
            value = DWRUtil._getValueFrom(data[i], arguments[2]);
            text = value;
          }
        }
        else
        {
          text = DWRUtil._getValueFrom(data[i], arguments[3]);
          value = text;
        }
        if (text || value) {
          opt = new Option(text, value);
          ele.options[ele.options.length] = opt;
        }
      }
      else {
        li = document.createElement("li");
        value = DWRUtil._getValueFrom(data[i], arguments[2]);
        if (value != null) {
          li.innerHTML = value;
          ele.appendChild(li);
        }
      }
    }
  }
  else if (arguments[3] != null) {
    for (var prop in data) {
      if (!useOptions) {
        alert("DWRUtil.addOptions can only create select lists from objects.");
        return;
      }
      value = DWRUtil._getValueFrom(data[prop], arguments[2]);
      text = DWRUtil._getValueFrom(data[prop], arguments[3]);
      if (text || value) {
        opt = new Option(text, value);
        ele.options[ele.options.length] = opt;
      }
    }
  }
  else {
    for (var prop in data) {
      if (!useOptions) {
        DWRUtil.debug("DWRUtil.addOptions can only create select lists from objects.");
        return;
      }
      if (typeof data[prop] == "function") {
        // Skip this one it's a function.
        text = null;
        value = null;
      }
      else if (arguments[2]) {
        text = prop;
        value = data[prop];
      }
      else {
        text = data[prop];
        value = prop;
      }
      if (text || value) {
        opt = new Option(text, value);
        ele.options[ele.options.length] = opt;
      }
    }
  }
};

/**
 * @private Get the data from an array function for DWRUtil.addOptions
 */
DWRUtil._getValueFrom = function(data, method) {
  if (method == null) return data;
  else if (typeof method == 'function') return method(data);
  else return data[method];
}

/**
 * Remove all the options from a select list (specified by id)
 * @see http://getahead.ltd.uk/dwr/browser/lists
 */
DWRUtil.removeAllOptions = function(ele) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("removeAllOptions() can't find an element with id: " + orig + ".");
    return;
  }
  var useOptions = DWRUtil._isHTMLElement(ele, "select");
  var useLi = DWRUtil._isHTMLElement(ele, ["ul", "ol"]);
  if (!useOptions && !useLi) {
    DWRUtil.debug("removeAllOptions() can only be used with select, ol and ul elements. Attempt to use: " + DWRUtil._detailedTypeOf(ele));
    return;
  }
  if (useOptions) {
    ele.options.length = 0;
  }
  else {
    while (ele.childNodes.length > 0) {
      ele.removeChild(ele.firstChild);
    }
  }
};

/**
 * Create rows inside a the table, tbody, thead or tfoot element (given by id).
 * @see http://getahead.ltd.uk/dwr/browser/tables
 */
DWRUtil.addRows = function(ele, data, cellFuncs, options) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("addRows() can't find an element with id: " + orig + ".");
    return;
  }
  if (!DWRUtil._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
    DWRUtil.debug("addRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + DWRUtil._detailedTypeOf(ele));
    return;
  }
  if (!options) options = {};
  options.data = data;
  if (!options.rowCreator) options.rowCreator = DWRUtil._defaultRowCreator;
  if (!options.cellCreator) options.cellCreator = DWRUtil._defaultCellCreator;
  var tr, rowNum;
  
  /* added by Rob Gonda */
  if (DWRUtil._isWDDX(data)) {
  //this code does not mix well with the cell functions -- Kenton  
  if (options.includeLabel) {
	  var tr = options.rowCreator(options);
	    for (var col in data) {
		  if (typeof (data[col]) == "object") {
	      var td;
	      td = options.cellCreator({"data" : col, "cellNum" : rowNum});
	      td.appendChild(document.createTextNode(col));
	      tr.appendChild(td);
		  }
		}
	    if (tr != null) ele.appendChild(tr);
	}
	
    for (rowNum = 0; rowNum < data.getRowCount(); rowNum++) {
    	//changed functionality to get cell functions to work 2/12/06 - Kenton Gray
      var tr = options.rowCreator(options);
      options.rowData = data.getRow(rowNum);
      options.rowIndex = rowNum;
      options.rowNum = rowNum;
      options.data = null;
      options.cellNum = -1;
      tr = DWRUtil._addRowInner(cellFuncs, options);
      if (tr != null) ele.appendChild(tr);
    }
  }
  /* end added by Rob Gonda */
  else if (DWRUtil._isArray(data)) {
    for (rowNum = 0; rowNum < data.length; rowNum++) {
      options.rowData = data[rowNum];
      options.rowIndex = rowNum;
      options.rowNum = rowNum;
      options.data = null;
      options.cellNum = -1;
      tr = DWRUtil._addRowInner(cellFuncs, options);
      if (tr != null) ele.appendChild(tr);
    }
  }
  else if (typeof data == "object") {
    rowNum = 0;
    for (var rowIndex in data) {
	  if (typeof(data[rowIndex]) == "object") { // added by Rob Gonda
	      options.rowData = data[rowIndex];
	      options.rowIndex = rowIndex;
	      options.rowNum = rowNum;
	      options.data = null;
	      options.cellNum = -1;
	      tr = DWRUtil._addRowInner(cellFuncs, options);
	      if (tr != null) ele.appendChild(tr);
	      rowNum++;
	 } // added by Rob Gonda
    }
  }
};

/**
 * @private Internal function to draw a single row of a table.
 */
DWRUtil._addRowInner = function(cellFuncs, options) {

  var tr = options.rowCreator(options);
  if (tr == null) return null;
  for (var cellNum = 0; cellNum < cellFuncs.length; cellNum++) {
    var func = cellFuncs[cellNum];
    var td;
    if (typeof func == "string") {
      options.data = null;
      options.cellNum = cellNum;
      td = options.cellCreator(options);
      td.appendChild(document.createTextNode(func));
    }
    else {
      /* readded by Kenton Gray */
	  var reply = func(options.rowData);
      /* removed by Kenton Gray */
	  //	var reply = options.rowData[cellNum];

      options.data = reply;
      options.cellNum = cellNum;
      td = options.cellCreator(options);
      if (DWRUtil._isHTMLElement(reply, "td")) td = reply;
      else if (DWRUtil._isHTMLElement(reply)) td.appendChild(reply);
      else td.innerHTML = reply;
    }
    tr.appendChild(td);
  }
  return tr;
};

/* added by Jeff Lester */
/**
 * @private Internal function to draw a single row of a table.
 */
DWRUtil._addNewOpt = function(cellFuncs, options) {

  var opt = options.optCreator(options);
  if (opt == null) return null;
    var valFunc = cellFuncs[0];
    var textFunc = cellFuncs[1];
    if (typeof valFunc == "string") {
      options.data = null;
      opt.value = valFunc;
    } else {
      var reply = valFunc(options.rowData);
      options.data = reply;
      opt.value = reply;
    }
    if (typeof textFunc == "string") {
      options.data = null;
      opt.appendChild(document.createTextNode(textFunc));
    } else {
      var reply = textFunc(options.rowData);
      options.data = reply;
      opt.appendChild(document.createTextNode(reply));
    }
  return opt;
};
/* end added by Jeff Lester */

/**
 * @private Default row creation function
 */
DWRUtil._defaultRowCreator = function(options) {
  return document.createElement("tr");
};

/* added by Jeff Lester */
/**
 * @private Default option creation function
 */
DWRUtil._defaultOptCreator = function(options) {
  return document.createElement("option");
};
/* end added by Jeff Lester */

/**
 * @private Default cell creation function
 */
DWRUtil._defaultCellCreator = function(options) {
  return document.createElement("td");
};

/**
 * Remove all the children of a given node.
 * @see http://getahead.ltd.uk/dwr/browser/tables
 */
DWRUtil.removeAllRows = function(ele) {
  var orig = ele;
  ele = $(ele);
  if (ele == null) {
    DWRUtil.debug("removeAllRows() can't find an element with id: " + orig + ".");
    return;
  }
  if (!DWRUtil._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
    DWRUtil.debug("removeAllRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + DWRUtil._detailedTypeOf(ele));
    return;
  }
  while (ele.childNodes.length > 0) {
    ele.removeChild(ele.firstChild);
  }
};

/**
 * @private Is the given node an HTML element (optionally of a given type)?
 * @param ele The element to test
 * @param nodeName eg "input", "textarea" - check for node name (optional)
 *         if nodeName is an array then check all for a match.
 */
DWRUtil._isHTMLElement = function(ele, nodeName) {
  if (ele == null || typeof ele != "object" || ele.nodeName == null) {
    return false;
  }

  if (nodeName != null) {
    var test = ele.nodeName.toLowerCase();

    if (typeof nodeName == "string") {
      return test == nodeName.toLowerCase();
    }

    if (DWRUtil._isArray(nodeName)) {
      var match = false;
      for (var i = 0; i < nodeName.length && !match; i++) {
        if (test == nodeName[i].toLowerCase()) {
          match =  true;
        }
      }
      return match;
    }

    DWRUtil.debug("DWRUtil._isHTMLElement was passed test node name that is neither a string or array of strings");
    return false;
  }

  return true;
};

/**
 * @private Like typeOf except that more information for an object is returned other than "object"
 */
DWRUtil._detailedTypeOf = function(x) {
  var reply = typeof x;
  if (reply == "object") {
    reply = Object.prototype.toString.apply(x);  // Returns "[object class]"
    reply = reply.substring(8, reply.length-1);  // Just get the class bit
  }
  return reply;
};

/**
 * @private Array detector. Work around the lack of instanceof in some browsers.
 */
DWRUtil._isArray = function(data) {
  return (data && data.join) ? true : false;
};

/**
 * @private WDDX detector. Work around the lack of instanceof in some browsers.
 * added by Rob Gonda
 */
DWRUtil._isWDDX = function(data) {
  return (data && data.dump) ? true : false;
};

/**
 * @private Date detector. Work around the lack of instanceof in some browsers.
 */
DWRUtil._isDate = function(data) {
  return (data && data.toUTCString) ? true : false;
};

/**
 * @private Used by setValue. Gets around the missing functionallity in IE.
 */
DWRUtil._importNode = function(doc, importedNode, deep) {
  var newNode;

  if (importedNode.nodeType == 1 /*Node.ELEMENT_NODE*/) {
    newNode = doc.createElement(importedNode.nodeName);

    for (var i = 0; i < importedNode.attributes.length; i++) {
      var attr = importedNode.attributes[i];
      if (attr.nodeValue != null && attr.nodeValue != '') {
        newNode.setAttribute(attr.name, attr.nodeValue);
      }
    }

    if (typeof importedNode.style != "undefined") {
      newNode.style.cssText = importedNode.style.cssText;
    }
  }
  else if (importedNode.nodeType == 3 /*Node.TEXT_NODE*/) {
    newNode = doc.createTextNode(importedNode.nodeValue);
  }

  if (deep && importedNode.hasChildNodes()) {
    for (i = 0; i < importedNode.childNodes.length; i++) {
      newNode.appendChild(DWRUtil._importNode(doc, importedNode.childNodes[i], true));
    }
  }

  return newNode;
}

/**
 * Used internally when some message needs to get to the programmer
 */
DWRUtil.debug = function(message) {
  alert(message);
}


DWRUtil.serializeForm = function(frm) {
	var vals = {};
	for (var loop=0; loop < frm.elements.length; loop++) {
		if (frm.elements[loop].type == 'text' || frm.elements[loop].type == 'select-one' || frm.elements[loop].type == 'hidden' || frm.elements[loop].type == 'radio') {
			vals[frm.elements[loop].name] = frm.elements[loop].value;
		} else if (frm.elements[loop].type == 'checkbox') {
			if (frm.elements[loop].checked == true) {
				if (vals[frm.elements[loop].name]) {
					vals[frm.elements[loop].name] = vals[frm.elements[loop].name] + ',' + frm.elements[loop].value;
				} else {
					vals[frm.elements[loop].name] = frm.elements[loop].value;
				}
			}
		}
	}
	return vals;
}

///////////////////////////////////////////////////////////////////////////
//
//	Filename:		wddx.js
//
//	Authors:		Simeon Simeonov (simeons@allaire.com)
//					Nate Weiss (nweiss@icesinc.com)
//
//	Last Modified:	February 2, 2001
//
///////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
//
//	WddxSerializer
//
///////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
// 	serializeValue() serializes any value that can be serialized
//	returns true/false
function wddxSerializer_serializeValue(obj)
{
	var bSuccess = true;
	var val;

	if (obj == null)
	{
		// Null value
		this.write("<null/>");
	}
	else if (typeof(val = obj.valueOf()) == "string")
	{
		// String value
		this.serializeString(val);
	}
	else if (typeof(val = obj.valueOf()) == "number")
	{
		// Distinguish between numbers and date-time values

		if (
			typeof(obj.getTimezoneOffset) == "function" &&
			typeof(obj.toGMTString) == "function")
		{
			// Possible Date
			// Note: getYear() fix is from David Flanagan's 
			// "JS: The Definitive Guide". This code is Y2K safe.
			this.write("<dateTime>" + 
				(obj.getYear() < 1000 ? 1900+obj.getYear() : obj.getYear()) + "-" + (obj.getMonth() + 1) + "-" + obj.getDate() +
				"T" + obj.getHours() + ":" + obj.getMinutes() + ":" + obj.getSeconds());
            if (this.useTimezoneInfo)
            {
            	this.write(this.timezoneString);
            }
            this.write("</dateTime>");
		}
		else
		{
			// Number value
			this.write("<number>" + val + "</number>");
		}
	}
	else if (typeof(val = obj.valueOf()) == "boolean")
	{
		// Boolean value
		this.write("<boolean value='" + val + "'/>");
	}
	else if (typeof(obj) == "object")
	{
		if (typeof(obj.wddxSerialize) == "function")
		{
			// Object knows how to serialize itself
			bSuccess = obj.wddxSerialize(this);
		}
		else if (
			typeof(obj.join) == "function" &&
			typeof(obj.reverse) == "function" &&
			typeof(obj.sort) == "function" &&
			typeof(obj.length) == "number")
		{
			// Possible Array
			this.write("<array length='" + obj.length + "'>");
			for (var i = 0; bSuccess && i < obj.length; ++i)
			{
				bSuccess = this.serializeValue(obj[i]);
			}
			this.write("</array>");
		}
		else
		{
			// Some generic object; treat it as a structure

			// Use the wddxSerializationType property as a guide as to its type			
			if (typeof(obj.wddxSerializationType) == 'string')
			{              
				this.write('<struct type="'+ obj.wddxSerializationType +'">')
			}  
			else
			{                                                       
				this.write("<struct>");
			}
						
			for (var prop in obj)
			{  
				if (prop != 'wddxSerializationType')
				{                          
				    bSuccess = this.serializeVariable(prop, obj[prop]);
					if (! bSuccess)
					{
						break;
					}
				}
			}
			
			this.write("</struct>");
		}
	}
	else
	{
		// Error: undefined values or functions
		bSuccess = false;
	}

	// Successful serialization
	return bSuccess;
}



///////////////////////////////////////////////////////////////////////////
// serializeAttr() serializes an attribute (such as a var tag) using JavaScript 
// functionality available in NS 3.0 and above
function wddxSerializer_serializeAttr(s)
{
	for (var i = 0; i < s.length; ++i)
    {
    	this.write(this.at[s.charAt(i)]);
    }
}


///////////////////////////////////////////////////////////////////////////
// serializeAttrOld() serializes a string using JavaScript functionality
// available in IE 3.0. We don't support special characters for IE3, so
// just throw the unencoded text and hope for the best
function wddxSerializer_serializeAttrOld(s)
{
	this.write(s);
}


///////////////////////////////////////////////////////////////////////////
// serializeString() serializes a string using JavaScript functionality
// available in NS 3.0 and above
function wddxSerializer_serializeString(s)
{
	this.write("<string>");
	for (var i = 0; i < s.length; ++i)
    {
		if (s.charCodeAt(i) > 255) 
			this.write(s.charAt(i));
		else
    	    this.write(this.et[s.charAt(i)]);
    }
	this.write("</string>");
}


///////////////////////////////////////////////////////////////////////////
// serializeStringOld() serializes a string using JavaScript functionality
// available in IE 3.0
function wddxSerializer_serializeStringOld(s)
{
	this.write("<string><![CDATA[");
	
	pos = s.indexOf("]]>");
	if (pos != -1)
	{
		startPos = 0;
		while (pos != -1)
		{
			this.write(s.substring(startPos, pos) + "]]>]]&gt;<![CDATA[");
			
			startPos = pos + 3;
			if (startPos < s.length)
			{
				pos = s.indexOf("]]>", startPos);
			}
			else
			{
				// Work around bug in indexOf()
				// "" will be returned instead of -1 if startPos > length
				pos = -1;
			}                               
		}
		this.write(s.substring(startPos, s.length));
	}
	else
	{
		this.write(s);
	}
			
	this.write("]]></string>");
}


///////////////////////////////////////////////////////////////////////////
// serializeVariable() serializes a property of a structure
// returns true/false
function wddxSerializer_serializeVariable(name, obj)
{
	var bSuccess = true;
	
	if (typeof(obj) != "function")
	{
		this.write("<var name='");
		this.preserveVarCase ? this.serializeAttr(name) : this.serializeAttr(name.toLowerCase());
		this.write("'>");

		bSuccess = this.serializeValue(obj);
		this.write("</var>");
	}

	return bSuccess;
}


///////////////////////////////////////////////////////////////////////////
// write() appends text to the wddxPacket buffer
function wddxSerializer_write(str)
{
	this.wddxPacket[this.wddxPacket.length] = str;
}


///////////////////////////////////////////////////////////////////////////
// writeOld() appends text to the wddxPacket buffer using IE 3.0 (JS 1.0)
// functionality. Unfortunately, the += operator has quadratic complexity
// which will cause slowdowns for large packets.
function wddxSerializer_writeOld(str)
{
	this.wddxPacket += str;
}


///////////////////////////////////////////////////////////////////////////
// initPacket() initializes the WDDX packet
function wddxSerializer_initPacket()
{
	this.wddxPacket = new Array();
}


///////////////////////////////////////////////////////////////////////////
// initPacketOld() initializes the WDDX packet for use with IE 3.0 (JS 1.0)
function wddxSerializer_initPacketOld()
{
	this.wddxPacket = "";
}


///////////////////////////////////////////////////////////////////////////
// extractPacket() extracts the WDDX packet as a string
function wddxSerializer_extractPacket()
{
	return this.wddxPacket.join("");
}


///////////////////////////////////////////////////////////////////////////
// extractPacketOld() extracts the WDDX packet as a string (IE 3.0/JS 1.0)
function wddxSerializer_extractPacketOld()
{
	return this.wddxPacket;
}


///////////////////////////////////////////////////////////////////////////
// serialize() creates a WDDX packet for a given object
// returns the packet on success or null on failure
function wddxSerializer_serialize(rootObj)
{
	this.initPacket();

	this.write("<wddxPacket version='1.0'><header/><data>");
	var bSuccess = this.serializeValue(rootObj);
	this.write("</data></wddxPacket>");

	if (bSuccess)
	{
		return this.extractPacket();
	}
	else
	{	
		return null;
	}
}


///////////////////////////////////////////////////////////////////////////
// WddxSerializer() binds the function properties of the object
function WddxSerializer()
{
	// Compatibility section
	if (navigator.appVersion != "" && navigator.appVersion.indexOf("MSIE 3.") == -1)
	{
    	// Character encoding table
        
    	// Encoding table for strings (CDATA)   
        var et = new Array();

    	// Numbers to characters table and 
    	// characters to numbers table
        var n2c = new Array();
        var c2n = new Array();
    
		// Encoding table for attributes (i.e. var=str)
		var at = new Array();

        for (var i = 0; i < 256; ++i)
        {
        	// Build a character from octal code
        	var d1 = Math.floor(i/64);
        	var d2 = Math.floor((i%64)/8);
        	var d3 = i%8;
        	var c = eval("\"\\" + d1.toString(10) + d2.toString(10) + d3.toString(10) + "\"");
    
    		// Modify character-code conversion tables        
        	n2c[i] = c;
            c2n[c] = i; 
            
    		// Modify encoding table
    		if (i < 32 && i != 9 && i != 10 && i != 13)
            {
            	// Control characters that are not tabs, newlines, and carriage returns
                
            	// Create a two-character hex code representation
            	var hex = i.toString(16);
                if (hex.length == 1)
                {
                	hex = "0" + hex;
                }
                
    	    	et[n2c[i]] = "<char code='" + hex + "'/>";

				// strip control chars from inside attrs
				at[n2c[i]] = "";

            }
            else if (i < 128)
            {
            	// Low characters that are not special control characters
    	    	et[n2c[i]] = n2c[i];

				// attr table
				at[n2c[i]] = n2c[i];
            }
            else
            {
            	// High characters
    	    	et[n2c[i]] = "&#x" + i.toString(16) + ";";
				at[n2c[i]] = "&#x" + i.toString(16) + ";";
            }
        }    
    
    	// Special escapes for CDATA encoding
        et["<"] = "&lt;";
        et[">"] = "&gt;";
        et["&"] = "&amp;";

		// Special escapes for attr encoding
		at["<"] = "&lt;";
        at[">"] = "&gt;";
        at["&"] = "&amp;";
		at["'"] = "&apos;";
		at["\""] = "&quot;";
		        
    	// Store tables
        this.n2c = n2c;
        this.c2n = c2n;
        this.et = et;    
		this.at = at;
        
   		// The browser is not MSIE 3.x
		this.serializeString = wddxSerializer_serializeString;
		this.serializeAttr = wddxSerializer_serializeAttr;
		this.write = wddxSerializer_write;
		this.initPacket = wddxSerializer_initPacket;
		this.extractPacket = wddxSerializer_extractPacket;
	}
	else
	{
		// The browser is most likely MSIE 3.x, it is NS 2.0 compatible
		this.serializeString = wddxSerializer_serializeStringOld;
		this.serializeAttr = wddxSerializer_serializeAttrOld;
		this.write = wddxSerializer_writeOld;
		this.initPacket = wddxSerializer_initPacketOld;
		this.extractPacket = wddxSerializer_extractPacketOld;
	}
    
	// Setup timezone information
    
    var tzOffset = (new Date()).getTimezoneOffset();

	// Invert timezone offset to convert local time to UTC time
    if (tzOffset >= 0)
    {
    	this.timezoneString = '-';
    }
    else
    {
    	this.timezoneString = '+';
    }
    this.timezoneString += Math.floor(Math.abs(tzOffset) / 60) + ":" + (Math.abs(tzOffset) % 60);
    
	// Common properties
	this.preserveVarCase = false;
    this.useTimezoneInfo = true;

    // Common functions
	this.serialize = wddxSerializer_serialize;
	this.serializeValue = wddxSerializer_serializeValue;
	this.serializeVariable = wddxSerializer_serializeVariable;
}


///////////////////////////////////////////////////////////////////////////
//
//	WddxRecordset
//
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// isColumn(name) returns true/false based on whether this is a column name
function wddxRecordset_isColumn(name)
{
	// Columns must be objects
	// WddxRecordset extensions might use properties prefixed with 
	// _private_ and these will not be treated as columns
	return (typeof(this[name]) == "object" && 
		    name.indexOf("_private_") == -1);
}

///////////////////////////////////////////////////////////////////////////
// getRowCount() returns the number of rows in the recordset
function wddxRecordset_getRowCount()
{
	var nRowCount = 0;
	for (var col in this)
	{
		if (this.isColumn(col))
		{
			nRowCount = this[col].length;
			break;
		}
	}
	return nRowCount;
}


///////////////////////////////////////////////////////////////////////////
// addColumn(name) adds a column with that name and length == getRowCount()
function wddxRecordset_addColumn(name)
{
	var nLen = this.getRowCount();
	var colValue = new Array(nLen);
	for (var i = 0; i < nLen; ++i)
	{
		colValue[i] = null;
	}
	this[this.preserveFieldCase ? name : name.toLowerCase()] = colValue;
}


///////////////////////////////////////////////////////////////////////////
// addRows() adds n rows to all columns of the recordset
function wddxRecordset_addRows(n)
{
	for (var col in this)
	{
		if (this.isColumn(col))
		{
			var nLen = this[col].length;
			for (var i = nLen; i < nLen + n; ++i)
			{
				this[col][i] = null;
			}
		}
	}
}


///////////////////////////////////////////////////////////////////////////
// getRow() returns the element in a given (row, col) position
function wddxRecordset_getRow(row)
{
	var thisRow = new Object;
	for (var col in this)
	{
		if (this.isColumn(col))
		{
			thisRow[col] = this[col][row]
		}
	}
	return thisRow;
}

///////////////////////////////////////////////////////////////////////////
// getField() returns the element in a given (row, col) position
function wddxRecordset_getField(row, col)
{
	return this[this.preserveFieldCase ? col : col.toLowerCase()][row];
}


///////////////////////////////////////////////////////////////////////////
// setField() sets the element in a given (row, col) position to value
function wddxRecordset_setField(row, col, value)
{
	this[this.preserveFieldCase ? col : col.toLowerCase()][row] = value;
}


///////////////////////////////////////////////////////////////////////////
// wddxSerialize() serializes a recordset
// returns true/false
function wddxRecordset_wddxSerialize(serializer)
{
	// Create an array and a list of column names
	var colNamesList = "";
	var colNames = new Array();
	var i = 0;
	for (var col in this)
	{
		if (this.isColumn(col))
		{
			colNames[i++] = col;

            if (colNamesList.length > 0)
			{
				colNamesList += ",";
			}
			colNamesList += col;			
		}
	}
	
	var nRows = this.getRowCount();
	
	serializer.write("<recordset rowCount='" + nRows + "' fieldNames='" + colNamesList + "'>");
	
	var bSuccess = true;
	for (i = 0; bSuccess && i < colNames.length; i++)
	{
		var name = colNames[i];
		serializer.write("<field name='" + name + "'>");
		
		for (var row = 0; bSuccess && row < nRows; row++)
		{
			bSuccess = serializer.serializeValue(this[name][row]);
		}
		
		serializer.write("</field>");
	}
	
	serializer.write("</recordset>");
	
	return bSuccess;
}


///////////////////////////////////////////////////////////////////////////
// dump(escapeStrings) returns an HTML table with the recordset data
// It is a convenient routine for debugging and testing recordsets
// The boolean parameter escapeStrings determines whether the <>& 
// characters in string values are escaped as &lt;&gt;&amp;
function wddxRecordset_dump(escapeStrings)
{
	// Get row count
	var nRows = this.getRowCount();
	
	// Determine column names
	var colNames = new Array();
	var i = 0;
	for (var col in this)
	{
		if (typeof(this[col]) == "object")
		{
			colNames[i++] = col;
		}
	}

    // Build table headers	
	var o = "<table border=1><tr><td><b>RowNumber</b></td>";
	for (i = 0; i < colNames.length; ++i)
	{
		o += "<td><b>" + colNames[i] + "</b></td>";
	}
	o += "</tr>";
	
	// Build data cells
	for (var row = 0; row < nRows; ++row)
	{
		o += "<tr><td>" + row + "</td>";
		for (i = 0; i < colNames.length; ++i)
		{
        	var elem = this.getField(row, colNames[i]);
            if (escapeStrings && typeof(elem) == "string")
            {
            	var str = "";
            	for (var j = 0; j < elem.length; ++j)
                {
                	var ch = elem.charAt(j);
                    if (ch == '<')
                    {
                    	str += "&lt;";
                    }
                    else if (ch == '>')
                    {
                    	str += "&gt;";
                    }
                    else if (ch == '&')
                    {
                    	str += "&amp;";
                    }
                    else
                    {
                    	str += ch;
                    }
                }            
				o += ("<td>" + str + "</td>");
            }
            else
            {
				o += ("<td>" + elem + "</td>");
            }
		}
		o += "</tr>";
	}

	// Close table
	o += "</table>";

	// Return HTML recordset dump
	return o;	
}


///////////////////////////////////////////////////////////////////////////
// WddxRecordset([flagPreserveFieldCase]) creates an empty recordset.
// WddxRecordset(columns [, flagPreserveFieldCase]) creates a recordset 
//   with a given set of columns provided as an array of strings.
// WddxRecordset(columns, rows [, flagPreserveFieldCase]) creates a 
//   recordset with these columns and some number of rows.
// In all cases, flagPreserveFieldCase determines whether the exact case
//   of field names is preserved. If omitted, the default value is false
//   which means that all field names will be lowercased.
function WddxRecordset()
{
	// Add default properties
	this.preserveFieldCase = false;

	// Add extensions
	if (typeof(wddxRecordsetExtensions) == "object")
	{
		for (var prop in wddxRecordsetExtensions)
		{
			// Hook-up method to WddxRecordset object
			this[prop] = wddxRecordsetExtensions[prop]
		}
	}

	// Add built-in methods
	this.getRowCount = wddxRecordset_getRowCount;
	this.addColumn = wddxRecordset_addColumn;
	this.addRows = wddxRecordset_addRows;
	this.isColumn = wddxRecordset_isColumn;
	this.getField = wddxRecordset_getField;
	this.getRow = wddxRecordset_getRow;
	this.setField = wddxRecordset_setField;
	this.wddxSerialize = wddxRecordset_wddxSerialize;
	this.dump = wddxRecordset_dump;
	
	// Perfom any needed initialization
	if (WddxRecordset.arguments.length > 0)
	{
		if (typeof(val = WddxRecordset.arguments[0].valueOf()) == "boolean")
		{
			// Case preservation flag is provided as 1st argument
			this.preserveFieldCase = WddxRecordset.arguments[0];
		}
		else
		{
			// First argument is the array of column names
			var cols = WddxRecordset.arguments[0];

			// Second argument could be the length or the preserve case flag
			var nLen = 0;
			if (WddxRecordset.arguments.length > 1)
			{
				if (typeof(val = WddxRecordset.arguments[1].valueOf()) == "boolean")
				{
					// Case preservation flag is provided as 2nd argument
					this.preserveFieldCase = WddxRecordset.arguments[1];
				}
				else
				{
					// Explicitly specified recordset length
					nLen = WddxRecordset.arguments[1];

					if (WddxRecordset.arguments.length > 2)
					{
						// Case preservation flag is provided as 3rd argument
						this.preserveFieldCase = WddxRecordset.arguments[2];
					}
				}
			}
			
			for (var i = 0; i < cols.length; ++i)
			{
 				var colValue = new Array(nLen);
				for (var j = 0; j < nLen; ++j)
				{
					colValue[j] = null;
				}
			
				this[this.preserveFieldCase ? cols[i] : cols[i].toLowerCase()] = colValue;
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////
//
// WddxRecordset extensions
//
// The WddxRecordset class has been designed with extensibility in mind.
//
// Developers can add new properties to the object and as long as their
// names are prefixed with _private_ the WDDX serialization function of
// WddxRecordset will not treat them as recordset columns.
//
// Developers can create new methods for the class outside this file as
// long as they make a call to registerWddxRecordsetExtension() with the
// name of the method and the function object that implements the method.
// The WddxRecordset constructor will automatically register all these
// methods with instances of the class.
//
// Example:
//
// If I want to add a new WddxRecordset method called addOneRow() I can
// do the following:
//
// - create the method implementation
//
// function wddxRecordset_addOneRow()
// {
// 	this.addRows(1);
// }
//
// - call registerWddxRecordsetExtension() 
//
// registerWddxRecordsetExtension("addOneRow", wddxRecordset_addOneRow);
//
// - use the new function
//
// rs = new WddxRecordset();
// rs.addOneRow();
//
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// registerWddxRecordsetExtension(name, func) can be used to extend 
// functionality by registering functions that should be added as methods 
// to WddxRecordset instances.
function registerWddxRecordsetExtension(name, func)
{
	// Perform simple validation of arguments
	if (typeof(name) == "string" && typeof(func) == "function")
	{
		// Guarantee existence of wddxRecordsetExtensions object
		if (typeof(wddxRecordsetExtensions) != "object")
		{
			// Create wddxRecordsetExtensions instance
			wddxRecordsetExtensions = new Object();
		}
		
		// Register extension; override an existing one
		wddxRecordsetExtensions[name] = func;
	}
}

///////////////////////////////////////////////////////////////////////////
//
// WddxBinary
//
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// wddxSerialize() serializes a binary value
// returns true/false
function wddxBinary_wddxSerialize(serializer) 
{
	serializer.write(
		"<binary encoding='" + this.encoding + "'>" + this.data + "</binary>");
	return true;
}

///////////////////////////////////////////////////////////////////////////
// WddxBinary() constructs an empty binary value
// WddxBinary(base64Data) constructs a binary value from base64 encoded data
// WddxBinary(data, encoding) constructs a binary value from encoded data
function WddxBinary(data, encoding)
{
	this.data = data != null ? data : "";
	this.encoding = encoding != null ? encoding : "base64";

	// Custom serialization mechanism
	this.wddxSerialize = wddxBinary_wddxSerialize;
}
