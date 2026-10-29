class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.className = "";
    this.title = "";
    this.children = [];
    this.ownText = "";
    this.innerHTMLWrites = 0;
  }

  set textContent(value) {
    this.children = [];
    this.ownText = String(value);
  }

  get textContent() {
    return this.ownText + this.children.map((child) => child.textContent).join("");
  }

  set innerHTML(_value) {
    this.innerHTMLWrites += 1;
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.ownText = "";
    this.children = [...nodes];
  }
}

export function createFakeDocument() {
  return {
    createElement: (tagName) => new FakeElement(tagName),
  };
}
