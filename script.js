function showSection(id) {
  document.getElementById("mainMenu").style.display = "none";
  document.querySelectorAll(".chapter-section").forEach(sec => {
    sec.style.display = "none";
  });
  document.getElementById(id).style.display = "flex";
}

function goBack() {
  document.getElementById("mainMenu").style.display = "flex";
  document.querySelectorAll(".chapter-section").forEach(sec => {
    sec.style.display = "none";
  });
}

/* ===== Chapter 7: Objects ===== */

const objBox = document.getElementById("objBox");

function objLiteral() {
  objBox.textContent = JSON.stringify({ name: "Ali", age: 20 });
}

function objConstructor() {
  function Student(name, id) {
    this.name = name;
    this.id = id;
  }
  objBox.textContent = JSON.stringify(new Student("Amina", 10));
}

function objClass() {
  class Car {
    constructor(brand, year) {
      this.brand = brand;
      this.year = year;
    }
  }
  objBox.textContent = JSON.stringify(new Car("Toyota", 2024));
}

function objRead() {
  const user = { username: "admin", role: "student" };
  objBox.textContent = `User: ${user.username}\nRole: ${user.role}`;
}

function objUpdate() {
  const phone = { brand: "Samsung", price: 300 };
  phone.price = 350;
  objBox.textContent = JSON.stringify(phone);
}

function objAdd() {
  const book = { title: "JavaScript" };
  book.pages = 200;
  objBox.textContent = JSON.stringify(book);
}

function objMethod() {
  const person = {
    name: "Omar",
    greet() {
      return "Hello " + this.name;
    }
  };
  objBox.textContent = person.greet();
}

function objLoop() {
  const marks = { math: 80, english: 75 };
  let result = "";
  for (let key in marks) {
    result += key + ": " + marks[key] + "\n";
  }
  objBox.textContent = result;
}

/* ===== Chapter 8: DOM ===== */

const domBox = document.getElementById("domBox");

function domId() {
  domBox.innerHTML = "<p>Selected using ID</p>";
}

function domTag() {
  domBox.innerHTML = "<p>Paragraph 1</p><p>Paragraph 2</p>";
}

function domClass() {
  const div = document.createElement("div");
  div.textContent = "Selected using class";
  domBox.innerHTML = "";
  domBox.appendChild(div);
}

function domQuery() {
  domBox.innerHTML = "<span style='color:lime'>querySelector example</span>";
}

function domQueryAll() {
  domBox.innerHTML = "<p>Item 1</p><p>Item 2</p><p>Item 3</p>";
}

/* ===== Chapter 9: Events ===== */

const eventBox = document.getElementById("eventBox");

function clickEvent() {
  eventBox.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "Click Me";
  btn.onclick = () => btn.textContent = "Clicked!";
  eventBox.appendChild(btn);
}

function mouseEvent() {
  eventBox.innerHTML = "";
  const div = document.createElement("div");
  div.textContent = "Hover Me";
  div.style.padding = "15px";
  div.style.border = "1px solid white";
  div.onmouseenter = () => div.style.background = "orange";
  div.onmouseleave = () => div.style.background = "transparent";
  eventBox.appendChild(div);
}

function keyboardEvent() {
  eventBox.innerHTML = "";
  const input = document.createElement("input");
  const p = document.createElement("p");
  input.onkeyup = () => p.textContent = input.value;
  eventBox.append(input, p);
}

function focusEvent() {
  eventBox.innerHTML = "";
  const input = document.createElement("input");
  input.onfocus = () => input.style.background = "yellow";
  input.onblur = () => input.style.background = "white";
  eventBox.appendChild(input);
}
