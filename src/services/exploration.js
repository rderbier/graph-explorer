export  class ExplorationStep {
  constructor(title, query, elements,reset=false) {
  this.title = title;
  this.query = query;
  this.elements = elements;
  this.reset = reset; // if we reset the elements in the list
}
}
export  class Exploration {
  constructor() {
    this.steps = [];
  }
  addStep(title, query, elements, reset=false) {
    this.steps.push(new ExplorationStep(title, query, elements,reset))
  }
  undoLastStep() {
    // return the calculated list of elements
    this.steps.pop();

    return this.getElements();
  }
  getElements() {
    var elements=[];
    for(var s of this.steps) {
       if (s.reset == true) {
         elements = []; //reset
       }
       elements.push(...s.elements)
    }
    return elements;
  }
}
