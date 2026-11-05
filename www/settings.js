(function () {
  var KEY = "actp_theme";
  var THEMES = [
    { id: "dark",   name: "Dark Orange",  bg: "#121212", ac: "#ff9800" },
    { id: "amoled", name: "AMOLED Black", bg: "#000000", ac: "#ff9800" },
    { id: "ocean",  name: "Ocean Blue",   bg: "#0b1622", ac: "#29b6f6" },
    { id: "forest", name: "Forest Green", bg: "#0e1a12", ac: "#66bb6a" },
    { id: "light",  name: "Light",        bg: "#f4f4f4", ac: "#e65100" }
  ];
  function current() {
    try { return localStorage.getItem(KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function apply(id) {
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem(KEY, id); } catch (e) {}
    render();
  }
  function render() {
    var box = document.getElementById("themeList");
    if (!box) return;
    var cur = current();
    box.innerHTML = "";
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "theme-card" + (t.id === cur ? " on" : "");
      b.innerHTML = '<span class="sw" style="background:' + t.bg + '"><i style="background:' + t.ac + '"></i></span>' +
        '<span class="nm">' + t.name + '</span><span class="ck">\u2713</span>';
      b.addEventListener("click", function () { apply(t.id); });
      box.appendChild(b);
    });
  }
  document.documentElement.setAttribute("data-theme", current());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
