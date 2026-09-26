const display = document.querySelector("#display");
const expressionLabel = document.querySelector("#expression");
const keypad = document.querySelector(".keypad");

let expression = "";
let previousExpression = "";
let justEvaluated = false;
let hasError = false;

function formatExpression(value) {
  return value.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("-", "−");
}

function render(message = "READY") {
  display.textContent = hasError ? "Error" : expression || "0";
  expressionLabel.textContent = hasError
    ? message
    : justEvaluated
      ? `${formatExpression(previousExpression)} =`
      : expression
        ? formatExpression(expression)
        : "READY";
  display.scrollLeft = display.scrollWidth;
}

function startFreshExpression() {
  expression = "";
  previousExpression = "";
  justEvaluated = false;
  hasError = false;
}

function appendDigit(digit) {
  if (justEvaluated || hasError) startFreshExpression();
  expression += digit;
  render();
}

function appendOperator(operator) {
  if (hasError) startFreshExpression();
  if (justEvaluated) {
    justEvaluated = false;
    previousExpression = "";
  }

  if (!expression) {
    if (operator === "-") expression = operator;
    render();
    return;
  }

  if (/[+\-*/]$/.test(expression)) {
    if (expression === "-") return;
    expression = expression.slice(0, -1) + operator;
  } else {
    expression += operator;
  }
  render();
}

function appendDecimal() {
  if (justEvaluated || hasError) startFreshExpression();
  const currentNumber = expression.split(/[+\-*/]/).at(-1);
  if (currentNumber.includes(".")) return;
  expression += currentNumber ? "." : "0.";
  render();
}

function tokenize(value) {
  const tokens = value.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?|[+\-*/]/g) || [];
  if (tokens.join("") !== value) throw new Error("Invalid expression");
  return tokens;
}

function calculate(value) {
  const tokens = tokenize(value);
  let position = 0;

  function parseNumber() {
    const token = tokens[position++];
    if (token === "+") return parseNumber();
    if (token === "-") return -parseNumber();
    if (token === undefined || Number.isNaN(Number(token))) throw new Error("Invalid expression");
    return Number(token);
  }

  function parseProduct() {
    let result = parseNumber();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const next = parseNumber();
      if (operator === "/" && next === 0) throw new Error("Cannot divide by zero");
      result = operator === "*" ? result * next : result / next;
    }
    return result;
  }

  function parseSum() {
    let result = parseProduct();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const next = parseProduct();
      result = operator === "+" ? result + next : result - next;
    }
    return result;
  }

  const result = parseSum();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid expression");
  return result;
}

function formatResult(value) {
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function evaluate() {
  if (!expression || justEvaluated) return;

  try {
    previousExpression = expression;
    expression = formatResult(calculate(expression));
    justEvaluated = true;
    render();
  } catch (error) {
    expression = "";
    justEvaluated = false;
    hasError = true;
    render(error.message === "Cannot divide by zero" ? "CANNOT DIVIDE BY ZERO" : "INVALID EXPRESSION");
  }
}

function clear() {
  startFreshExpression();
  render();
}

function deleteLastCharacter() {
  if (hasError || justEvaluated) {
    clear();
    return;
  }
  expression = expression.slice(0, -1);
  render();
}

function handleInput(value, action) {
  if (action === "clear") clear();
  else if (action === "delete") deleteLastCharacter();
  else if (action === "decimal") appendDecimal();
  else if (action === "equals") evaluate();
  else if (/^\d$/.test(value)) appendDigit(value);
  else if (["+", "-", "*", "/"].includes(value)) appendOperator(value);
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) handleInput(button.dataset.value, button.dataset.action);
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) handleInput(event.key);
  else if (["+", "-", "*", "/"].includes(event.key)) handleInput(event.key);
  else if (event.key === ".") handleInput(undefined, "decimal");
  else if (event.key === "Enter" || event.key === "=") handleInput(undefined, "equals");
  else if (event.key === "Backspace") handleInput(undefined, "delete");
  else if (event.key === "Escape") handleInput(undefined, "clear");
  else return;
  event.preventDefault();
});

render();