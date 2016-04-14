"use strict";
var renderer, camera, scene, raycaster, listener;

var preload = new THREE.LoadingManager();

var objLoader = new THREE.ObjectLoader( preload );
var xhrLoader = new THREE.XHRLoader( preload );
var imageLoader = new THREE.ImageLoader( preload );
var cubeTexLoader = new THREE.CubeTextureLoader();
var jsonLoader = new THREE.JSONLoader();

var mouse = new THREE.Vector2(0,0);

var raycastingActive = true;
var tempLookAtObject = null; //temp: object we are charging up, old: object we activated
var eventObject = null;
var hoverObject = null;
var resetObject = null;
var lookAtTime = 0.0;
var maxLookTime = 1.1;

var prevTime; 

var frameDelta;

var controls, manager, effect;

var events = {};
var rayStart = {};
var rayUpdate = {};
var rayEnd = {};
var rayHover = {};
var rayHoverStart = {};

var manager;

var skyNames;

var skyBox;
var skyMaterial;
var skyShader;
var cubemap;

var transition;
var isMobile = mobileCheck();

var spriteAnimators = [];
// var animTex, animator;

//Check if device can handle WebGL
if ( !webglAvailable() ) {
  window.open("fallback.html","_self");
}

//Check Mobile
function mobileCheck() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

//Setup three.js WebGL renderer
renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);

// Append the canvas element created by the renderer to document body element.
document.body.appendChild(renderer.domElement);

// Create a three.js camera.
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.3, 10000);

//Add AudioListener
listener = new THREE.AudioListener();
listener.name = 'Listener';
camera.add( listener );

// Apply VR headset positional data to camera.
controls = new THREE.VRControls(camera);

// Apply VR stereo rendering to renderer.
effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

//Set up Raycaster
raycaster = new THREE.Raycaster();

// Create a three.js scene.
scene = new THREE.Scene();

// Load an Editor json File
function loadJSON(file, _skyNames){

  xhrLoader.crossOrigin = '';

  xhrLoader.load( file, function ( text ) {

      startScene( JSON.parse(text) );

  } );

  //Load all the skyboxes
  skyNames = _skyNames;

}

//The whole start up sequence once we have a parsed JSON file
function startScene (json) {

  setProject(json);
  setScene(objLoader.parse( json.scene ));
  setScripts(json);

  unlockAudio(); //IOS only

  manager = new WebVRManager(renderer, effect, {hideButton: false});

  manager.startMode = top.managerId;

  if(skyNames !== undefined)
    loadSkyImages();

  play();

}

//Set project values
//Background & Fog
function setProject ( json ){

  //Background
  renderer.setClearColor( json.project.backgroundColor, 1 );

}

function setScene(_scene){

  scene = _scene;

  //LoadingManager
  var geometry = new THREE.SphereGeometry( 1, 32, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0x000000, transparent:true, opacity:0, side: THREE.DoubleSide} );
  transition = new THREE.Mesh( geometry, material );
  transition.position.set (0,0,0);
  scene.add( transition );

  //Manual Add

}

//Loads all scripts from the json file into the events[]
function setScripts(json){

  events = {
    init: [],
    start: [],
    stop: [],
    keydown: [],
    keyup: [],
    mousedown: [],
    mouseup: [],
    mousemove: [],
    touchstart: [],
    touchend: [],
    touchmove: [],
    update: [],
    rayStart: [],
    rayUpdate: [],
    rayHover: [],
    rayEnd: [],
    rayHoverStart: []
  };

  var scriptWrapParams = 'player,renderer,scene,camera';
  var scriptWrapResultObj = {};

  for ( var eventKey in events ) {

    scriptWrapParams += ',' + eventKey;
    scriptWrapResultObj[ eventKey ] = eventKey;

  }

  var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

  for ( var uuid in json.scripts ) {

    var object = scene.getObjectByProperty( 'uuid', uuid, true );

    if ( object === undefined ) {

      console.warn( 'APP.Player: Script without object.', uuid );
      continue;

    }

    var scripts = json.scripts[ uuid ];
    rayStart[uuid] = [];
    rayUpdate[uuid] = [];
    rayEnd[uuid] = [];
    rayHover[uuid] = [];
    rayHoverStart[uuid] = [];

    //Integrate global variables
    for ( var i = 0; i < scripts.length; i ++ ) {

      var _script = scripts[ i ];

      var functions = ( new Function( scriptWrapParams, _script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

      for ( var name in functions ) {

        if ( functions[ name ] === undefined ) continue;

        if ( events[ name ] === undefined ) {

          console.warn( 'Event type not supported (', name, ')' );
          continue;

        }
        
        switch(functions[ name ].name){

          case "rayStart":
            rayStart[object.uuid].push(functions[ name ].bind( object ) );
          break;

          case "rayUpdate":
            rayUpdate[object.uuid].push(functions[ name ].bind( object ) );
          break;

          case "rayEnd":
            rayEnd[object.uuid].push(functions[ name ].bind( object ) );
          break;

          case "rayHover": // pc only
            rayHover[object.uuid].push(functions[ name ].bind( object ) );
          break;

          case "rayHoverStart": // pc only
            rayHoverStart[object.uuid].push(functions[ name ].bind( object ) );
          break;

          default:
            events[ name ].push( functions[ name ].bind( object ) );
          break;
        }
      }
    }
  }

  dispatch( events.init, arguments );

}

// Kick off animation loop
function play(){

  document.addEventListener( 'keydown', onDocumentKeyDown );
  document.addEventListener( 'keyup', onDocumentKeyUp );
  document.addEventListener( 'touchstart', onDocumentTouchStart );
  document.addEventListener( 'touchend', onDocumentTouchEnd );
  document.addEventListener( 'touchmove', onDocumentTouchMove );

  if(!isMobile){
    document.addEventListener( 'mousedown', onDocumentMouseDown );
    document.addEventListener( 'mouseup', onDocumentMouseUp );
    document.addEventListener( 'mousemove', onDocumentMouseMove );
  }

  dispatch( events.start, arguments );

  animate();

}
//Exit to another website
function exit(_name){

  top.managerId = manager.mode;

  top.newSite(_name);
}

///////////////////////
//Runtime - Functions
///////////////////////
function raycasting(){

  //Set ray to forward vector from the camera
var vector = new THREE.Vector3( 0, 0, -1 );
  vector.applyQuaternion( camera.quaternion );

  raycaster.set( camera.position, vector.normalize() );

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects( scene.children, true );

  //if nothing got hit
  if(intersects.length === 0){

    resetRaycaster();
    return;
  }  

  //Check all the intersects and give back 
  //the first visible and event bound object
  var intersectsClean = sortIntersects(intersects);

  if(intersectsClean === null){

    resetRaycaster();

  }else{

    if(hoverObject !== intersectsClean && rayHoverStart[intersectsClean.uuid]){
      hoverObject = intersectsClean;
      dispatch( rayHoverStart[ hoverObject.uuid ] );
    }

    //If its a V2 disable the LookAt Activation
    if(manager.getViewer().id == "CardboardV2")
      return;

    //Do we look at the object we activated just before
    if(intersectsClean === eventObject)
      return;
    else{

      if(eventObject !== null){
        if(rayEnd[eventObject.uuid])  
            dispatch( rayEnd[ eventObject.uuid ] );

          eventObject = null;
      }
    }

    if(tempLookAtObject === intersectsClean){

      lookAtTime += frameDelta;

      //Trigger Event on Object
      if(lookAtTime > maxLookTime){

        if(rayStart[ tempLookAtObject.uuid ]){
          dispatch( rayStart[ tempLookAtObject.uuid ] );
          eventObject = tempLookAtObject;
        }

        lookAtTime = 0.0;
        tempLookAtObject = null;

      }

    } else {

      if(tempLookAtObject !== null){
        if(rayEnd[tempLookAtObject.uuid])  
          dispatch( rayEnd[ tempLookAtObject.uuid ] );
      }

      tempLookAtObject = intersectsClean;
    }
  }
}

//Returns the first object hit ( excluding some special cases )
function sortIntersects(_intersects){

  for(var iClean = 0; iClean < _intersects.length; iClean++){

    //Don't get crosshair and MoveToObjects
    if( !_intersects[iClean].object.position.equals(camera.position)){
      // console.log(_intersects[iClean].object);
      if(rayStart[ _intersects[iClean].object.uuid] ){//|| // should suffice
      // rayUpdate[ _intersects[iClean].object.uuid] ||
      // rayHover[ _intersects[iClean].object.uuid] ||
      // rayEnd[ _intersects[iClean].object.uuid]){
        return _intersects[iClean].object;

      }else{

        return null;
      }
    }
  }
  return null;
}

function resetRaycaster(){

  lookAtTime = 0.0;
  tempLookAtObject = null;
  resetObject = null;

  if(eventObject !== null)
    resetObject = eventObject;
  else if(hoverObject !== null)
    resetObject = hoverObject;

  hoverObject = null;
  eventObject = null;

  if(resetObject !== null &&rayEnd[resetObject.uuid])  
    dispatch( rayEnd[ resetObject.uuid ] );
  
}

//After an event is done, always call reactivate to reenable raycasting
function reactivate() {

  raycastingActive = true;

}

// Request animation frame loop function
function animate( time ) {

  if (manager.isVRMode()){
    document.getElementById ("crosshair").style.display = "block";
  }  else {
    document.getElementById ("crosshair").style.display = "none";
  }

  //Get frame delta time
  frameDelta = (time-prevTime)/1000; // formated to seconds

  //Raycaster Update
  if (manager.isVRMode() && raycastingActive)
    raycasting();

  // Update VR headset position and apply to camera.
  controls.update();

  // Sprite Animation Update
  for(var a = 0; a < spriteAnimators.length; a++){ 
    // spriteAnimators[i].update(frameDelta)
  }

  //Update Scripts
  dispatch( events.update, { time: time, delta: time - prevTime } );

  //If an object get touched/clicked do it's update function
  if(!manager.isVRMode() && manager.getViewer().id !== "CardboardV1" && eventObject !== null)
    dispatch( rayUpdate[ eventObject.uuid ] );

  // Render the scene through the manager.
  manager.render(scene, camera, time);

  prevTime = time; 
  requestAnimationFrame(animate);
}

///////////////////////
//Input - Functions
///////////////////////
function clickCast(_x, _y, _type){

  if(manager.isVRMode() && manager.getViewer().id == "CardboardV2"){

    //Set ray to forward vector from the camera
    var vector = new THREE.Vector3( 0, 0, -1 );
    vector.applyQuaternion( camera.quaternion );

    raycaster.set( camera.position, vector.normalize() );

  }else{

    mouse.x = ( _x / window.innerWidth ) * 2 - 1; // todo on pc mouse
    mouse.y = - ( _y / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
  }

  var _mouseIntersects = raycaster.intersectObjects( scene.children, true );
  var _sortedObj = sortIntersects(_mouseIntersects);

  if(_sortedObj === null){
    if(hoverObject !== null){
      if(rayEnd[hoverObject.uuid]) {
        dispatch( rayEnd[ hoverObject.uuid ] );
        hoverObject = null;

      }
    }
    return;
  }

  switch(_type) {

      case "start":
        if(rayStart[_sortedObj.uuid])
          dispatch( rayStart[ _sortedObj.uuid ] );

        if(rayUpdate[_sortedObj.uuid])
          eventObject = _sortedObj; 
     
      break;

      case "hover":

        if(hoverObject !== _sortedObj)  { // If new hover object

          if(hoverObject !== null && rayEnd[hoverObject.uuid])  
            dispatch( rayEnd[ hoverObject.uuid ] );

          hoverObject = _sortedObj; 

          if(rayHoverStart[hoverObject.uuid])  
            dispatch( rayHoverStart[ hoverObject.uuid ] );
         
        }else{ // If old hover object

          if(hoverObject !== null && rayHover[hoverObject.uuid]) 
            dispatch( rayHover[ hoverObject.uuid ] );

        }     
        
      break;

      case "end":

        if(rayEnd[_sortedObj.uuid])  
          dispatch( rayEnd[ _sortedObj.uuid ] );

        eventObject = null;
      break;

      default:
        console.log("Event-type missing!");
      break;
   
    }

}

function dispatch( array, event ) {

  for ( var i = 0, l = array.length; i < l; i ++ ) {

    try {

      array[ i ]( event );

    } catch ( e ) {

      console.error( ( e.message || e ), ( e.stack || '' ) );

    }
  }
}

function onDocumentKeyDown( event ) {

  dispatch( events.keydown, event );

  if (event.keyCode == 90) { // z
    controls.resetSensor();
  }
}

function onDocumentKeyUp( event ) {

  dispatch( events.keyup, event );

}

function onDocumentMouseDown( event ) {

  if(!manager.isVRMode()){
    clickCast(event.clientX, event.clientY, "start");

    dispatch( events.mousedown, event );
  }
}

function onDocumentMouseUp( event ) {

  if(!manager.isVRMode()) {
    if(eventObject !== null && rayEnd[eventObject.uuid]) {
       
      dispatch( rayEnd[ eventObject.uuid ] );
      eventObject = null;

    }

    dispatch( events.mouseup, event );
  }
}

function onDocumentMouseMove( event ) {

  if(!manager.isVRMode()){
    dispatch( events.mousemove, event );

    clickCast(event.clientX, event.clientY, "hover");
  }
}

function onDocumentTouchStart( event ) {

  if(manager.isVRMode() && manager.getViewer().id == "CardboardV1"){
    lookAtTime = maxLookTime;
    return;
  }

  var touch0 = event.changedTouches[0];

  clickCast(touch0.clientX, touch0.clientY, "start");

  dispatch( events.touchstart, event );

}

function onDocumentTouchEnd( event ) {

  unlockAudio();

  if(eventObject !== null && rayEnd[eventObject.uuid]) {
    dispatch( rayEnd[ eventObject.uuid ] );
    eventObject = null;
    dispatch( events.touchend, event );
  }
}

function onDocumentTouchMove( event ) {

  dispatch( events.touchmove, event );

}

///////////////////////
//Crosshair - Functions
///////////////////////
function crossHairScaling(_dir){
  if(manager.isVRMode()){
    if(_dir){
      TweenMax.to(".Absolute-Center", 0.1, {className:"+=Absolute-Center-Big"});
      TweenMax.to(".Absolute-Center-Loader", maxLookTime, {opacity:1});
    }else{
      TweenMax.to(".Absolute-Center", 0.1, {className:"-=Absolute-Center-Big"});
      TweenMax.to(".Absolute-Center-Loader", 0.1, {opacity:0});
    }
  }
}

///////////////////////
//Skybox - Functions
///////////////////////
function loadSkyImages(){

  var boxSize = 19;
  var _mobile = '';
  if(isMobile) _mobile += "_mobile";

  var urlsNew = [
    'img/sky/'+ skyNames[0] + _mobile + '/pano_2.jpg',
    'img/sky/'+ skyNames[0] + _mobile + '/pano_0.jpg',
    'img/sky/'+ skyNames[0] + _mobile + '/pano_4.jpg',
    'img/sky/'+ skyNames[0] + _mobile + '/pano_5.jpg',
    'img/sky/'+ skyNames[0] + _mobile + '/pano_1.jpg',
    'img/sky/'+ skyNames[0] + _mobile + '/pano_3.jpg'

  ];

  skyShader = THREE.ShaderLib[ 'cube' ];
  cubemap = cubeTexLoader.load(urlsNew, function(){
    top.initialSkyboxLoad();
    top.iframeDidLoad();
    preloadImages();
  });
  skyShader.uniforms[ 'tCube' ].value = cubemap;

  skyMaterial = new THREE.ShaderMaterial( {

    fragmentShader: skyShader.fragmentShader,
    vertexShader: skyShader.vertexShader,
    uniforms: skyShader.uniforms,
    side: THREE.BackSide

  } );

  skyBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxSize, boxSize, boxSize),
    skyMaterial 
  );

  skyBox.position.set(0,0,0);
  scene.add(skyBox);
}

function preloadImages(){

  controls.resetSensor();

  var found = false;
  var _tempNames = [];
  for(var i = 1; i < skyNames.length; i++){

    found = false;

    for(var y = 0; y < top.loadedSkies.length; y++){
    
      if(top.loadedSkies[y] === skyNames[i] )
        found = true;
    }

    if(!found){
      _tempNames.push(skyNames[i]);
      top.loadedSkies.push(skyNames[i]);
    }
  }

  console.log(_tempNames);

  //LoadTextures
  for(var ii = 0; ii < _tempNames.length; ii++){
    for(var iii = 0; iii < 6; iii++){

      var name = _tempNames[ii];
      if(isMobile) name += "_mobile";

      imageLoader.load( 'img/sky/'+ name +'/pano_'+ iii +'.jpg', function(name){
        top.skyboxLoad();
      });    
    }
  }
}

function recreateSky(_folderName, _newPos){

  TweenMax.to(transition.material, top.fadeOut ,{opacity: 1, onComplete:transitionEnd, onCompleteParams:[_folderName, _newPos]});

}

function transitionEnd(_folderName, _newPos){

  if(isMobile) _folderName += "_mobile";

  var urlsNew = [
    'img/sky/' + _folderName + '/pano_2.jpg',
    'img/sky/' + _folderName + '/pano_0.jpg',
    'img/sky/' + _folderName + '/pano_4.jpg',
    'img/sky/' + _folderName + '/pano_5.jpg',
    'img/sky/' + _folderName + '/pano_1.jpg',
    'img/sky/' + _folderName + '/pano_3.jpg'
  ];

  cubemap = cubeTexLoader.load(urlsNew);
  skyShader.uniforms[ "tCube" ].value = cubemap;

  camera.position.set(_newPos.x, _newPos.y, _newPos.z);
  controls.resetSensor();

  skyBox.position.set(camera.position.x, camera.position.y, camera.position.z);
  transition.position.set(camera.position.x, camera.position.y, camera.position.z);

  TweenMax.to(transition.material, top.fadeIn, {opacity:0});

}

///////////////////////
//TextureAnimator - Functions
///////////////////////
function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{ 
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet. 
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
  texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;
    
  this.update = function( milliSec )
  {
    // console.log(milliSec);
    if(!isNaN(milliSec)){
        
      this.currentDisplayTime += milliSec*1000;

      while (this.currentDisplayTime > this.tileDisplayDuration)
      {
        this.currentDisplayTime -= this.tileDisplayDuration;
        this.currentTile++;
        if (this.currentTile == this.numberOfTiles)
          this.currentTile = 0;
        var currentColumn = this.currentTile % this.tilesHorizontal;
        texture.offset.x = currentColumn / this.tilesHorizontal;
        var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
        texture.offset.y = currentRow / this.tilesVertical;
      }
    }
  };
}

///////////////////////
//Fallback & Mobile - Functions
///////////////////////

function webglAvailable() {
  try {
    var canvas = document.createElement( 'canvas' );
    return !!( window.WebGLRenderingContext && (
      canvas.getContext( 'webgl' ) ||
      canvas.getContext( 'experimental-webgl' ) )
    );
  } catch ( e ) {
    return false;
  }
}

///////////////////////
//AUDIO - Functions
///////////////////////

//Unlock Audio on IOS
var isUnlocked = false;
function unlockAudio() {
      
  if(!iOS() )
    return;

  if( isUnlocked )
    return;

  // create empty buffer and play it
  var buffer = listener.context.createBuffer(1, 1, 22050);
  var source = listener.context.createBufferSource();
  source.buffer = buffer;
  source.connect(listener.context.destination);
  source.noteOn(0);

  // by checking the play state after some time, we know if we're really unlocked
  setTimeout(function() {
    if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
      isUnlocked = true;
      console.log('AudioUnlocked');
    }
  }, 0);
}

function iOS() {

  var iDevices = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ];

  while (iDevices.length) {
    if (navigator.platform === iDevices.pop()){ return true; }
  }

  return false;
}

//Toggle Master Volume
function toggleMute(){

  var _volume = listener.getMasterVolume();

  if(_volume > 0.02)
    listener.setMasterVolume(0.01);
  else
    listener.setMasterVolume(1.0);
}

//Unmute Audio on Focus
window.onfocus = function () { 
  listener.setMasterVolume(1);
}; 

//Mute Audio on Defocus
window.onblur = function () { 
  listener.setMasterVolume(0.01);
}; 

window.addEventListener('resize', onWindowResize, false);

// Handle window resizes
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  effect.setSize(window.innerWidth, window.innerHeight);
}

function takeScreenshot() {
  var dataUrl = renderer.domElement.toDataURL('image/png');

  if (CARDBOARD_DEBUG) console.debug('SCREENSHOT: ' + dataUrl);
    return renderer.domElement.toDataURL('image/png');

}