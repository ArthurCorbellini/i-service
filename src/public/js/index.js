/* eslint-disable */
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { updateSettings } from "./updateSettings";

const mapBox = document.getElementById("map");
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

const loginForm = document.querySelector(".form--login");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

const logOutButton = document.querySelector(".nav__el--logout");
if (logOutButton) logOutButton.addEventListener("click", logout);

const userDataForm = document.querySelector(".form-user-data");
if (userDataForm)
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    updateSettings({ name, email }, "data");
  });

const userPasswordForm = document.querySelector(".form-user-password");
if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelector(".btn--save-password").textContent =
      "Atualizando...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";

    document.querySelector(".btn--save-password").textContent = "Salvar senha";
  });
