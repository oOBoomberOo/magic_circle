let width, height;
let world;
let generator;
let cheatBox;
let magicWord = 'Hello World';

const uuid = new UUID();
const fontSize = 64;

function setup() {
	width = windowWidth;
	height = windowHeight;
	createCanvas(width, height);

	world = new World(width / 2, height / 2);
	
	cheatBox = createInput('');
	cheatBox.size(width/2, 20);
	cheatBox.position(0, 0);
	cheatBox.center('horizontal');
	cheatBox.id('cheatBox');
	document.getElementById('cheatBox').addEventListener('change', inputBox);
}

function draw() {
	background(255);
	world.update();

	if (selecting) {
		editing();
	}

	translate(width / 2, height);
	fill(0);
	strokeWeight(0);
	textAlign(CENTER, BOTTOM);
	textSize(32);
	text(magicWord, 0, 0);
	checkCanvas();
}

function checkCanvas() {
	if (width !== windowWidth || height !== windowHeight) {
		width = windowWidth;
		height = windowHeight;
		world.width = width;
		world.height = height;
		resizeCanvas(width, height);
	}
}

let selecting = null;

function mousePressed() {
	if (!selecting) {
		selecting = world.selectObject(mouseX, mouseY);
	}
	else {
		selecting = null;
	}
}

function editing() {
	let coord = world.convertCoord(mouseX, mouseY);
	selecting.x = coord.x;
	selecting.y = coord.y;
}

function createObject(type) {
	let object;
	if (type === 'circle') {
		let parent = world;
		let angle = random(TWO_PI);
		let length = random(0, 50);
		let radius = random(50, 200);
		object = new Circle(parent, angle, length, radius);
	}
	world.child.push(object);
}

function inputBox(event) {
	const functionList = {
		circle: () => {isEditing = true; createObject('circle')},
		symbol: () => {isEditing = true; createObject('symbol')}
	}

	let value = event.target.value;
	try {
		functionList[value]();
	} catch {
		console.log('Invalid object!');
	}
	cheatBox.value('');

}

function Intepreter(object, parent) {
	let result;
	if (parent) {
		if (object.constructor === Object) {
			let length = typeof object.length === 'number' ? object.length: 0;
			if (object.id === 'Circle') {
				result = new Circle(parent, object.angle, length, object.radius);
			}
			else if (object.id === 'MagicSymbol') {
				result = new MagicSymbol(parent, object.angle, length, parent.scale, object.type);
			}

			if (object.rotation) {
				result.rotation = object.rotation;
			}
			if (object.child) {
				result.child = Intepreter(object.child, result);
			}
		}
		else if (object.constructor === Array) {
			let temp = [];
			for (let i of object) {
				if (i.id === 'Circle') {
					temp.push(Intepreter(i, parent));
				}
				else if (i.id === 'MagicSymbol') {
					temp.push(Intepreter(i, parent));
				}
			}
			result = temp;
		}
		return result;
	}

	return false;
}

class World {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.rot = 0;
		this.child = [
			new MagicSymbol(this, 0, 0, 64, '/file/image/element/wind.png'),
			new Circle(this, 0, 0, 200)
		];
	}

	selectObject(x, y) {
		let coord = this.convertCoord(x, y);
		return this.search(coord.x, coord.y);
	}

	search(x, y) {
		let coord = new p5.Vector(x, y);
		let leastDist = Infinity;
		let leastSize = Infinity;
		let result = null;
		for (let element of this.child) {
			let distance = this.calculateDistance(coord, element);
			let isCollide = element.collide(coord);
			if (isCollide && element.radius < leastSize && distance <= leastDist) {
				leastDist = distance;
				leastSize = element.radius;
				result = element;
			}
		}
		return result;
	}

	searchAll(x, y, w, h) {
		let result = [];
		for (let element of this.child) {
			if (x <= element.x && element.x <= w && y <= element.y && element.y <= h) {
				result.push(element);
			}
		}
		return result;
	}

	calculateDistance(a, b) {
		let dx = a.x - b.x;
		let dy = a.y - b.y;
		return Math.pow(dx, 2) + Math.pow(dy, 2);
	}

	convertCoord(x, y) {
		let angle = this.rot;
		let newX = (y - this.y) * sin(angle) + (x - this.x) * cos(angle);
		let newY = (y - this.y) * cos(angle) - (x - this.x) * sin(angle);
		return new p5.Vector(newX, newY);
	}

	update() {
		push();
		this.offset();
		this.show();
		pop();
	}

	offset() {
		translate(this.x, this.y);
		rotate(this.rot);
	}

	show() {
		for (let element of this.child) {
			element.update();
		}
	}
}

class WorldObject {
	constructor(world, x, y) {
		this.world = world;
		this.x = x;
		this.y = y;
		this.rot = 0;
		this.radius = 64;
		this.id = uuid.generate();
	}

	update() {
		push();
		this.offset();
		this.show();
		pop();
	}

	offset() {
		translate(this.x, this.y);
		rotate(this.rot);
	}

	show() {
		push();
		noFill();
		stroke(255);
		strokeWeight(8);
		ellipse(0, 0, 64*2);
		pop();
	}

	collide(coord) {
		let dx = this.x - coord.x;
		let dy = this.y - coord.y;
		let distance = Math.pow(dx, 2) + Math.pow(dy, 2);

		if (distance <= Math.pow(this.radius, 2)) {
			return true;
		}
		return false;
	}
}

class Circle extends WorldObject {
	constructor(world, x, y, radius) {
		super();
		this.world = world;
		this.x = x;
		this.y = y;
		this.rot = 0;
		this.radius = radius;
		this.id = uuid.generate();
		this.magicWord = '';
	}

	update() {
		push();
		this.intepreter();
		this.offset();
		this.show();
		pop();

		magicWord = this.magicWord;
	}

	intepreter() {
		this.magicWord = '';
		let centerSearch = this.world.searchAll(this.x - 16, this.y - 16, 32, 32);
		if (centerSearch) {
			let result = '';
			for (let element of centerSearch) {
				if (element.id !== this.id) {
					result = this.decipher(element);
					break;
				}
			}
			this.magicWord += result;
		}
	}

	decipher(element) {
		switch(element.constructor) {
			case MagicSymbol:
				return 'Symbol';
			case Circle:
				return 'Circle';
			default:
				return '[Unknow]';
		}
	}

	show() {
		noFill();
		stroke(0);
		strokeWeight(10);
		ellipse(0, 0, this.radius * 2);
	}
}

class MagicSymbol extends WorldObject {
	constructor(world, x, y, size, image) {
		super();
		this.world = world;
		this.x = x;
		this.y = y;
		this.rot = 0;
		this.size = size;
		this.radius = size;
		this.id = uuid.generate();
		this.image = loadImage(image);
	}

	show() {
		image(this.image, -this.size/2, -this.size/2, this.size, this.size);
	}

	// (x, y) have to be converted first!
	collide(coord) {
		let lowWidth = this.x - this.size/2;
		let highWidth = this.x + this.size/2;
		let lowHeight = this.y - this.size/2;
		let highHeight = this.y + this.size/2;
		if (lowWidth <= coord.x && coord.x <= highWidth && lowHeight <= coord.y && coord.y <= highHeight) {
			return true;
		}
		return false;
	}
}


/*
class PolarObject {
	constructor(parent, angle, length) {
		this.parent = parent;
		this.angle = angle;
		this.length = length;
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.radius = 0;
		this.layer = 0;
		this.scale = 1;
		this.child = [];

		this.classType = 'PolarObject';
	}

	selectObject(x, y) {
		let leastDist = Infinity;
		let result;
		for (let element of this.child) {
			let pos = element.getCoord();
		}
	}

	getTotalAngle(angle = 0) {
		if (this.parent) {
			angle += this.angle + this.rotation + this.parent.getTotalAngle(angle);
			return angle;
		}
		else {
			return 0;
		}
	}

	// TODO: Convert polar coord to cartesian coord
	getCoord(sum = [0, 0]) {
		if (this.layer > 0) {
			let length = this.calculateLength(this);
			let result = this.parent.getCoord();
			sum[0] += result[0];
			sum[1] += result[1];
		}
	}

	update() {
		push();
		this.offset();
		this.show();
		pop();
	}

	offset() {
		rotate(this.angle);
		translate(this.calculateLength(this), 0);
		rotate(this.rotation);
	}

	show() {
		push();
		fill(255);
		stroke(0);
		stroke(6);
		ellipse(0, 0, 16);
		for (let element of this.child) {
			push();
			element.update();
			pop();
		}
		pop();
	}

	calculateLength(element) {
		if (this.parent) {
			return map(element.length, 0, 200, 0, this.parent.radius*2);
		}
		else {
			return 0;
		}
	}
}

class World extends PolarObject {
	constructor(x, y, radius) {
		super();
		this.x = x;
		this.y = y;
		this.parent = null;
		this.radius = radius;
		this.scale = 1;
		this.angle = 0;
		this.rotation = 0;
		this.length = 0;
		this.classType = 'World';
		this.child = [];
	}

	offset() {
		translate(width / 2, height /2);
		rotate(this.angle);
		translate(this.calculateLength(this), 0);
		rotate(this.rotation);
	}

	show() {
		push();
		fill(255);
		stroke(0);
		circle(0, 0, this.radius*2);
	
		for (let element of this.child) {
			element.update();
		}
		pop();
	}
}

class Circle extends PolarObject {
	constructor(parent, angle, length, radius) {
		super();
		this.parent = parent;
		this.angle = angle;
		this.length = length;
		this.radius = radius;
		this.scale = parent.scale * 0.5; //(this.radius / circle.radius) * circle.scale * 1.7;
		this.layer = this.parent.layer + 1;
		this.classType = 'Circle';
		this.child = [];
	}

	show() {
		fill(255);
		stroke(0);
		strokeWeight(10 * this.scale);
		ellipse(0, 0, this.radius * 2 + this.scale * fontSize);

		for (let element of this.child) {
			element.update();
		}

		//this.rotation -= PI/100;
	}
}

class MagicSymbol extends PolarObject {
	constructor(parent, angle, length, scale, type) {
		super();
		this.parent = parent;
		this.angle = angle;
		this.length = length;
		this.scale = scale;
		this.radius = fontSize * this.scale;
		this.type = type;
		this.image = loadImage(`/file/image/${type}.png`);
		this.classType = 'Symbol';
	}

	show() {
		push();
		let w = fontSize * this.scale;
		let h = fontSize * this.scale;
		image(this.image, -w/2, -h/2, w, h);
		pop();
	}
}
*/