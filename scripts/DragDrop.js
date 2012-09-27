//Module does require Modernizr, it is not preferred lines can be commented out 

var DragDrop = (function () {
	"use strict";

	//Object holding all varibles
	var Pix = {};

	//CONSTANTS
	Pix.ALL_IMAGES = /image\/\S+/;	//regular expression to match any image type

	//Variables
	Pix.imageTypes = null;	//Declares what types of images to take action on
	Pix.callback = null;   //Function given pixels at end of drag drop extraction
	Pix.canvasWidth = null;
	Pix.canvasHeight = null;
	Pix.image = null;     //Holds image object of image

	//This function stops the default behavior of an event, stops propagation and action
	//Note: there is event bubbling and event capturing
	function stopDefault(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}

	function supportDOM() {
		return document.createElement;
	}

	function isImage(file) {
		return Pix.ALL_IMAGES.test(file.type);
	}

	function extractPixels(evt) {
		Pix.image = new Image();
		Pix.image.onload = function () {

			var pixels,
				canvas = document.createElement("canvas"),
				context = canvas.getContext('2d'),
				width = Pix.image.width,				//image width
				height = Pix.image.height,				//image height
				canvasWidth = Pix.canvasWidth || width,
				canvasHeight = Pix.canvasHeight || height,
				ratio = 1 / Math.max(width / canvasWidth, height / canvasHeight),
				scaledWidth = ratio * width,
				scaledHeight = ratio * height;

			//Set canvas dimensions
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			//Draw image to canvas
			context.drawImage(Pix.image, 0, 0, width, height, (canvasWidth - scaledWidth) * 0.5,
				(canvasHeight - scaledHeight) * 0.5, scaledWidth, scaledHeight);

			//Get Pixels then call callback function
			pixels = context.getImageData(0, 0, canvasWidth, canvasHeight).data;

			Pix.callback({
				pixels: pixels, //all pixels from canvas, even those not in image
				width: width,
				height: height,
				scaledWidth: scaledWidth,
				scaledHeight: scaledHeight
			});

		};

		Pix.image.src = evt.target.result;
	}

	function readImage(image) {
		//Create file reader to read dropped files
		var reader = new FileReader();
		//set reader to call pixel extractor function when loaded image
		reader.onload = extractPixels;
		//start reading image
		reader.readAsDataURL(image);
	}

	//Drop function
	function drop(evt) {
		var files, file;
		//stop default execution of this event
		stopDefault(evt);
		//grab files from drop
		files = evt.dataTransfer.files;
		//Handle dropped files
		if (files.length > 0) {
			file = files[0]; //grab first file, only one concerned about
			//Extract Pixels if image
			if (isImage(file)) {
				readImage(file);
			}
		}
	}

	//This function adds all event listeners pertinent to Drag Drop
	//Associates functions above as actions to perform upon events
	function addEventListeners() {
		if (!Modernizr.draganddrop) {
			console.log("Browser does not support Drag and Drop");
			return;
		}

		document.addEventListener("dragenter", stopDefault, false);
		document.addEventListener("dragexit", stopDefault, false);
		document.addEventListener("dragover", stopDefault, false);
		document.addEventListener("drop", drop, false);
	}

	/*
		Starts the process of extracting pixels from dropped over image
		
		Note: imageTypes is optional, accepts all images by default
		
		canvasWidth - width of canvas to draw image in - 0 to be image width, default
		canvasHeight - height of canvas to draw image in - 0 to be image height, default
		imageTypes - An array of the MIME types to accept upon drag and drop events
		callback - function to hand pixels to once extracted from an image
	*/
	function init(callback, canvasWidth, canvasHeight, imageTypes) {
		if (!supportDOM()) {
			throw "Browser does not support necessary DOM methods";
		}

		if (typeof callback === "undefined") {
			throw "init - Must have callback function as parameter, not optional";
		}

		//Initialize variables
		Pix.canvasWidth = canvasWidth || 0;
		Pix.canvasHeight = canvasHeight || 0;
		Pix.imageTypes = imageTypes || Pix.ALL_IMAGES;
		Pix.callback = callback;

		addEventListeners();
	}

	return {
		pixInit: init
	};

}());