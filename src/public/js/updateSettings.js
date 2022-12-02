/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettings = async (data, type) => {
  try {
    const urlApi = "http://127.0.0.1:3000/api/v1/users";
    const url = urlApi + (type === "password" ? "/updateMyPassword" : "/me");
    console.log(data);
    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", "Cadastro alterado com sucesso!");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
