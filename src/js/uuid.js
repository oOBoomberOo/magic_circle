class UUID {
	constructor(start = 0) {
		this.current = start;
	}

	generate() {
		this.current += 1;
		return this.current - 1;
	}

	reset(start = 0) {
		this.current = start;
	}
}